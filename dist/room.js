"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const config_1 = require("./config");
class Room {
    constructor(id, worker, io) {
        this.id = null;
        this.router = null;
        this.io = null;
        this.peers = new Map();
        this.webRtcServer = null;
        this.id = id;
        this.io = io;
        const mediaCodecs = config_1.config.mediasoup.router.mediaCodecs;
        this.webRtcServer = worker.appData.webRtcServer;
        worker
            .createRouter({
            mediaCodecs: mediaCodecs
        }).then((router) => __awaiter(this, void 0, void 0, function* () {
            this.router = router;
            yield this.createSpeaker(router);
        }));
    }
    createSpeaker(router) {
        return __awaiter(this, void 0, void 0, function* () {
            const audioLevelObserver = yield router.createAudioLevelObserver({
                maxEntries: 1,
                threshold: -80,
                interval: 800
            });
            console.log("Audio Level=>", audioLevelObserver.id);
            // Create a mediasoup ActiveSpeakerObserver.
            const activeSpeakerObserver = yield router.createActiveSpeakerObserver();
            console.log("Speaker=>", activeSpeakerObserver.id);
        });
    }
    addPeer(peer) {
        this.peers.set(peer.id, peer);
    }
    removePeer(socketId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.peers.get(socketId)) === null || _a === void 0 ? void 0 : _a.close();
            this.peers.delete(socketId);
        });
    }
    getProducerListForPeer() {
        let producerList = [];
        this.peers.forEach((peer) => {
            peer.producers.forEach((producer) => {
                producerList.push({ producer_id: producer.id, producer_socket_id: peer.id });
            });
        });
        return producerList;
    }
    getRtpCapabilities() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.router.rtpCapabilities;
        });
    }
    createWebRtcTransport(id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config_1.config.mediasoup.webRtcTransport;
            const transport = yield this.router.createWebRtcTransport({
                listenIps: config_1.config.mediasoup.webRtcTransport.listenIps,
                enableUdp: true,
                // enableTcp: true,
                preferUdp: true,
                initialAvailableOutgoingBitrate,
                webRtcServer: this.webRtcServer,
            });
            if (maxIncomingBitrate) {
                try {
                    yield transport.setMaxIncomingBitrate(maxIncomingBitrate);
                }
                catch (error) {
                    console.log(error, "setMaxIncomingBitrate");
                }
            }
            transport.on('dtlsstatechange', (dtlsState) => {
                var _a;
                if (dtlsState === 'closed') {
                    console.log('Transport close', { name: (_a = this.peers.get(id)) === null || _a === void 0 ? void 0 : _a.name });
                    transport.close();
                }
            });
            transport.on("@close", () => {
                var _a;
                console.log('Transport close', { name: (_a = this.peers.get(id)) === null || _a === void 0 ? void 0 : _a.name });
            });
            console.log('Adding transport', { transportId: transport.id });
            (_a = this.peers.get(id)) === null || _a === void 0 ? void 0 : _a.addTransport(transport);
            return {
                params: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters
                }
            };
        });
    }
    connectPeerTransport(id, transportId, dtlsParameters) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.peers.has(id))
                return;
            yield ((_a = this.peers.get(id)) === null || _a === void 0 ? void 0 : _a.connectTransport(transportId, dtlsParameters));
        });
    }
    produce(id, producerTransportId, rtpParameters, kind, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            // handle undefined errors
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                let producer = yield ((_a = this.peers.get(id)) === null || _a === void 0 ? void 0 : _a.createProducer(producerTransportId, rtpParameters, kind));
                resolve(producer.id);
                this.broadcast(id, 'newProducers', {
                    producerList: [{
                            producer_id: producer.id,
                            producer_socket_id: id
                        }], id: roomId
                });
            }));
        });
    }
    consume(socketId, consumerTransportId, producerId, rtpCapabilities) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.router ||
                !this.router.canConsume({
                    producerId,
                    rtpCapabilities,
                })) {
                console.error(`router can't consume,`, producerId, rtpCapabilities);
                return;
            }
            const consumer = yield ((_a = this.peers
                .get(socketId)) === null || _a === void 0 ? void 0 : _a.createConsumer(consumerTransportId, producerId, rtpCapabilities));
            if (!consumer) {
                console.error('consumer not found');
                return;
            }
            (_b = consumer.consumer) === null || _b === void 0 ? void 0 : _b.on('producerclose', () => {
                var _a, _b;
                console.log('Consumer closed due to producerclose event', {
                    name: `${(_a = this.peers.get(socketId)) === null || _a === void 0 ? void 0 : _a.name}`,
                    consumer_id: `${consumer.consumer.id}`,
                });
                (_b = this.peers.get(socketId)) === null || _b === void 0 ? void 0 : _b.removeConsumer(consumer.consumer.id);
                // tell client consumer is dead
                this.io.to(socketId).emit('consumerClosed', {
                    consumer_id: consumer.consumer.id,
                    consumer_kind: consumer.consumer.kind,
                    socketId: socketId,
                });
                // this.io.to(socket_id).emit('consumerClosed', {
                //     consumer_id: consumer.id,
                //     consumer_kind: consumer.kind,
                // });
            });
            return consumer.params;
        });
    }
    broadcast(socketId, name, data) {
        const otherPeers = [...this.peers.keys()].filter((id) => id !== socketId);
        for (const otherId of otherPeers) {
            this.send(otherId, name, data);
        }
    }
    send(socketId, name, data) {
        var _a;
        (_a = this.io) === null || _a === void 0 ? void 0 : _a.to(socketId).emit(name, data);
    }
    closeProducer(socketId, producerId) {
        var _a;
        (_a = this.peers.get(socketId)) === null || _a === void 0 ? void 0 : _a.closeProducer(producerId);
    }
    getPeers() {
        return this.peers;
    }
    addMoreAdmin(socketId) {
        var _a;
        var isAdmin = (_a = this.peers.get(socketId)) === null || _a === void 0 ? void 0 : _a.updateAdmin(true);
        console.log("Update Admin user is " + socketId);
        return isAdmin;
    }
    toJson() {
        return {
            id: this.id,
            peers: JSON.stringify([...this.peers])
        };
    }
}
exports.Room = Room;
