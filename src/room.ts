import { types } from 'mediasoup';
import { Server } from 'socket.io';
import { config } from './config';
import { Peer } from './peer';


export class Room {
    id: string | null = null;
    router: types.Router | null = null;
    io: Server | null = null;
    peers: Map<string, Peer> = new Map();
    webRtcServer: any = null;
    constructor(id: string, worker: types.Worker, io: Server) {
        this.id = id;
        this.io = io;
        const mediaCodecs = config.mediasoup.router.mediaCodecs as types.RtpCodecCapability[];
        this.webRtcServer = worker.appData.webRtcServer;
        worker
            .createRouter({
                mediaCodecs: mediaCodecs
            }).then(
                async (router: types.Router) => {
                    this.router = router;
                    await this.createSpeaker(router);
                }
            );
    }


    async createSpeaker(router: types.Router) {
        const audioLevelObserver = await router.createAudioLevelObserver(
            {
                maxEntries: 1,
                threshold: -80,
                interval: 800
            });
        console.log("Audio Level=>", audioLevelObserver.id);
        // Create a mediasoup ActiveSpeakerObserver.
        const activeSpeakerObserver = await router.createActiveSpeakerObserver();
        console.log("Speaker=>", activeSpeakerObserver.id);
    }


    addPeer(peer: Peer) {
        this.peers.set(peer.id, peer)
    }
    async removePeer(socketId: string) {
        this.peers.get(socketId)?.close();
        this.peers.delete(socketId);
    }
    getProducerListForPeer() {
        let producerList: any = []
        this.peers.forEach((peer) => {
            peer.producers.forEach((producer: types.Producer) => {
                producerList.push(
                    { producer_id: producer.id, producer_socket_id: peer.id }
                )
            })
        })
        return producerList
    }
    async getRtpCapabilities() {
        return this.router!.rtpCapabilities
    }


    async createWebRtcTransport(id: string) {
        const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport

        const transport = await this.router!.createWebRtcTransport({
            listenIps: config.mediasoup.webRtcTransport.listenIps,
            enableUdp: true,
            // enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate,
            webRtcServer: this.webRtcServer,
        })
        if (maxIncomingBitrate) {
            try {
                await transport.setMaxIncomingBitrate(maxIncomingBitrate)
            } catch (error) {
                console.log(error, "setMaxIncomingBitrate")
            }
        }

        transport.on(
            'dtlsstatechange',
            (dtlsState: types.DtlsState) => {
                if (dtlsState === 'closed') {
                    console.log('Transport close', { name: this.peers!.get(id)?.name })
                    transport.close()
                }
            }
        );
        transport.on("@close", () => {
            console.log('Transport close', { name: this.peers!.get(id)?.name })
        });
        console.log('Adding transport', { transportId: transport.id })
        this.peers!.get(id)?.addTransport(transport)
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            }
        }
    }

    async connectPeerTransport(id: string, transportId: any, dtlsParameters: types.DtlsParameters) {
        if (!this.peers.has(id)) return
        await this.peers!.get(id)?.connectTransport(transportId, dtlsParameters)
    }

    async produce(id: string, producerTransportId: string, rtpParameters: any, kind: any, roomId: string) {
        // handle undefined errors
        return new Promise(
            async (resolve: any, reject: any) => {
                let producer = await this.peers!.get(id)?.createProducer(producerTransportId, rtpParameters, kind)
                resolve(producer!.id)
                this.broadcast(id, 'newProducers',
                    {
                        producerList: [{
                            producer_id: producer!.id,
                            producer_socket_id: id
                        }], id: roomId
                    }
                );
            }
        )
    }


    async consume(
        socketId: string,
        consumerTransportId: string,
        producerId: string,
        rtpCapabilities: types.RtpCapabilities,
    ) {
        if (
            !this.router ||
            !this.router.canConsume({
                producerId,
                rtpCapabilities,
            })
        ) {
            console.error(`router can't consume,`, producerId, rtpCapabilities);
            return;
        }
        const consumer = await this.peers
            .get(socketId)
            ?.createConsumer(consumerTransportId, producerId, rtpCapabilities);

        if (!consumer) {
            console.error('consumer not found');
            return;
        }

        consumer.consumer?.on('producerclose', () => {
            console.log('Consumer closed due to producerclose event', {
                name: `${this.peers.get(socketId)?.name}`,
                consumer_id: `${consumer.consumer!.id}`,
            });
            this.peers.get(socketId)?.removeConsumer(consumer.consumer!.id);
            // tell client consumer is dead
            this.io!.to(socketId).emit('consumerClosed', {
                consumer_id: consumer.consumer!.id,
                consumer_kind: consumer.consumer!.kind,
                socketId: socketId,
            });
            // this.io.to(socket_id).emit('consumerClosed', {
            //     consumer_id: consumer.id,
            //     consumer_kind: consumer.kind,
            // });
        });

        return consumer.params;
    }



    broadcast(socketId: string, name: string, data: any) {
        const otherPeers = [...this.peers.keys()].filter((id) => id !== socketId);
        for (const otherId of otherPeers) {
            this.send(otherId, name, data);
        }
    }

    send(socketId: string, name: string, data: any) {
        this.io?.to(socketId).emit(name, data);
    }


    closeProducer(socketId: string, producerId: string) {
        this.peers.get(socketId)?.closeProducer(producerId);
    }

    getPeers() {
        return this.peers
    }


    addMoreAdmin(socketId: string): boolean {
        var isAdmin: boolean = this.peers.get(socketId)?.updateAdmin(true) as boolean;
        console.log("Update Admin user is " + socketId);
        return isAdmin;
    }

    toJson() {
        return {
            id: this.id,
            peers: JSON.stringify([...this.peers])
        }
    }
}