import { types } from 'mediasoup';
import { Server } from 'socket.io';
import { config } from './config';
import FFmpeg from './ffmpeg';
import { Peer } from './peer';
import { Post } from './model/post';

export class Room {
    id: string | null = null;
    router: types.Router | null = null;
    io: Server | null = null;
    peers: Map<string, Peer> = new Map();
    webRtcServer: any = null;
    audioConsumer: types.Consumer | null = null;
    videoConsumer: types.Consumer | null = null;
    audioTransport: types.PlainTransport | null = null;
    videoTransport: types.PlainTransport | null = null;
    processFFmpeg: FFmpeg | null = null;
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

    async produce(id: string, producerTransportId: string, rtpParameters: any, kind: any, roomId: string, appData: any) {
        // handle undefined errors
        return new Promise(
            async (resolve: any, reject: any) => {
                let producer = await this.peers!.get(id)?.createProducer(producerTransportId, rtpParameters, kind, appData)
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
        appData: any
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
            ?.createConsumer(consumerTransportId, producerId, rtpCapabilities, appData);

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





    async handleStartRecording(roomId: string, id: string) {
        let producer = this.peers!.get(id);
        let recordInfo: any = {};
        var isVideo = false;
        var isAudio = false;
        var pId;
        var pvId;
        producer?.producers.forEach(async (v: types.Producer) => {
            console.log(v.appData);
            // if (v.appData.type == "scree-share" && v.kind=="video") {
            //     pvId = v.id;
            //     isVideo = true;
            // }
            if (v.appData.type == "scree-share" && v.kind == "audio") {
                isAudio = true;
                pId = v.id;
            } else if (v.appData.type == "scree-share" && v.kind == "video") {
                isVideo = true;
                pvId = v.id;
            }
        });
        recordInfo.fileName = Date.now().toString();
        if (isAudio) {
            const rtpTransport = await this.router?.createPlainTransport({
                rtcpMux: false,
                comedia: false,
                ...config.mediasoup.plainTransportOptions,
            });
            await rtpTransport?.connect({
                ip: '127.0.0.1',
                port: config.mediasoup.recording.audioPort,
                rtcpPort: config.mediasoup.recording.audioPortRtcp
            });
            this.audioTransport = rtpTransport!;
            const codecs = [];
            const routerCodec = this.router!.rtpCapabilities!.codecs?.find(
                codec => codec.kind === "audio"
            );
            codecs.push(routerCodec);
            const rtpConsumer = await rtpTransport?.consume({
                producerId: pId!,
                rtpCapabilities: {
                    codecs: codecs.map(v => v!),
                },
                paused: true
            });
            this.audioConsumer = rtpConsumer!;
            recordInfo["audio"] = {
                remoteRtpPort: config.mediasoup.recording.audioPort,
                remoteRtcpPort: config.mediasoup.recording.audioPortRtcp,
                localRtcpPort: rtpTransport!.rtcpTuple ? rtpTransport!.rtcpTuple.localPort : undefined,
                rtpCapabilities: {
                    codecs: codecs.map(v => v!),
                },
                rtpParameters: rtpConsumer!.rtpParameters
            }
        }
        if (isVideo) {
            const rtpTransport = await this.router?.createPlainTransport({
                rtcpMux: false,
                comedia: false,
                ...config.mediasoup.plainTransportOptions,
            });
            await rtpTransport?.connect({
                ip: '127.0.0.1',
                port: config.mediasoup.recording.videoPort,
                rtcpPort: config.mediasoup.recording.videoPort
            });
            this.videoTransport = rtpTransport!;
            const codecs = [];
            const routerCodec = this.router!.rtpCapabilities!.codecs?.find(
                codec => codec.kind === "video"
            );
            codecs.push(routerCodec);
            const rtpConsumer = await rtpTransport?.consume({
                producerId: pvId!,
                rtpCapabilities: {
                    codecs: this.router!.rtpCapabilities!.codecs,
                },
                paused: true
            });
            this.videoConsumer = rtpConsumer!;
            recordInfo["video"] = {
                remoteRtpPort: config.mediasoup.recording.videoPort,
                remoteRtcpPort: config.mediasoup.recording.videoPortRtcp,
                localRtcpPort: rtpTransport!.rtcpTuple ? rtpTransport!.rtcpTuple.localPort : undefined,
                rtpCapabilities: {
                    codecs: codecs.map(v => v!),
                },
                rtpParameters: rtpConsumer!.rtpParameters
            }
        }
        console.log(recordInfo);
        this.processFFmpeg = new FFmpeg(recordInfo);
        this.processFFmpeg!.observer?.on("process-close", () => {
            console.log("Okddhfgwufwfwfwy")
        });
        this.processFFmpeg!.observer?.on("uploaded", async ({ name, isSuccess }) => {
            console.log(name, isSuccess);
            if (isSuccess) {
                await Post.findByIdAndUpdate(roomId, { $set: { recordedUrl: 'https://liverecords.s3.amazonaws.com/' + name } }, { new: true }).then((v) => {
                    console.log(v?._id);
                }).catch(e => console.log("UpdateError=>", e));
            }
        })
        setTimeout(async () => {
            await this.videoConsumer?.resume();
            await this.videoConsumer?.requestKeyFrame();
            await this.audioConsumer?.resume();
            await this.audioConsumer?.requestKeyFrame();
        }, 1000);
    }
    stopMediasoupRtp({ useAudio, useVideo }: any) {
        console.log("Stop mediasoup RTP transport and consumer");
        this.processFFmpeg?.kill();
        if (useAudio) {
            this.audioConsumer?.close();
            this.audioTransport?.close();
        }
        if (useVideo) {
            this.videoConsumer?.close();
            this.videoTransport?.close();
        }
    }

}
