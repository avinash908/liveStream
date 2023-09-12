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
exports.Peer = void 0;
class Peer {
    constructor(socket_id, name, isAdmin) {
        this.transports = new Map();
        this.consumers = new Map();
        this.producers = new Map();
        this.id = socket_id;
        this.name = name;
        this.isAdmin = isAdmin;
    }
    addTransport(transport) {
        this.transports.set(transport.id, transport);
    }
    connectTransport(transportId, dtlsParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.transports.has(transportId))
                return;
            yield this.transports.get(transportId).connect({
                dtlsParameters: dtlsParameters
            });
            console.log("Transport Connected...");
        });
    }
    createProducer(producerTransportId, rtpParameters, kind, appData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            //TODO handle null errors
            let producer = yield ((_a = this.transports.get(producerTransportId)) === null || _a === void 0 ? void 0 : _a.produce({
                kind,
                rtpParameters,
                appData: appData
            }));
            this.producers.set(producer.id, producer);
            producer.on('transportclose', () => {
                console.log('Producer transport close', { name: `${this.name}`, consumer_id: `${producer.id}` });
                producer.close();
                this.producers.delete(producer.id);
            });
            return producer;
        });
    }
    createConsumer(consumer_transport_id, producer_id, rtpCapabilities, appData) {
        return __awaiter(this, void 0, void 0, function* () {
            let consumerTransport = this.transports.get(consumer_transport_id);
            let consumer = null;
            try {
                consumer = yield (consumerTransport === null || consumerTransport === void 0 ? void 0 : consumerTransport.consume({
                    appData: appData,
                    producerId: producer_id,
                    rtpCapabilities,
                    paused: false //producer.kind === 'video',
                }));
            }
            catch (error) {
                console.error('Consume failed', error);
                return;
            }
            if (consumer.type === 'simulcast') {
                yield (consumer === null || consumer === void 0 ? void 0 : consumer.setPreferredLayers({
                    spatialLayer: 2,
                    temporalLayer: 2
                }));
            }
            this.consumers.set(consumer.id, consumer);
            consumer === null || consumer === void 0 ? void 0 : consumer.on('transportclose', () => {
                console.log('Consumer transport close', { name: `${this.name}`, consumer_id: `${consumer.id}` });
                this.consumers.delete(consumer.id);
            });
            return {
                consumer,
                params: {
                    producerId: producer_id,
                    id: consumer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    type: consumer.type,
                    producerPaused: consumer.producerPaused,
                    appData
                }
            };
        });
    }
    updateAdmin(isAdmin) {
        this.isAdmin = isAdmin;
        return this.isAdmin;
    }
    closeProducer(producer_id) {
        try {
            this.producers.get(producer_id).close();
        }
        catch (e) {
            console.warn(e);
        }
        this.producers.delete(producer_id);
    }
    getProducer(producer_id) {
        return this.producers.get(producer_id);
    }
    close() {
        this.transports.forEach((transport) => transport.close());
    }
    removeConsumer(consumer_id) {
        this.consumers.delete(consumer_id);
    }
}
exports.Peer = Peer;
