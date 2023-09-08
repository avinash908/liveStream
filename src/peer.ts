import { types } from 'mediasoup';

export class Peer {
    id: string;
    name: string;
    isAdmin: boolean;
    transports = new Map<string, types.WebRtcTransport>()
    consumers = new Map()
    producers = new Map()
    constructor(socket_id: string, name: string, isAdmin: boolean) {
        this.id = socket_id
        this.name = name
        this.isAdmin = isAdmin;
    }
    addTransport(transport: types.WebRtcTransport) {
        this.transports.set(transport.id, transport)
    }
    async connectTransport(transportId: string, dtlsParameters: types.DtlsParameters) {
        if (!this.transports.has(transportId)) return
        await this.transports.get(transportId)!.connect({
            dtlsParameters: dtlsParameters
        });
        console.log("Transport Connected...");
    }

    async createProducer(producerTransportId: string, rtpParameters: any, kind: any) {
        //TODO handle null errors
        let producer = await this.transports!.get(producerTransportId)?.produce({
            kind,
            rtpParameters
        })

        this.producers.set(producer!.id, producer)
        producer!.on(
            'transportclose',
            () => {
                console.log('Producer transport close', { name: `${this.name}`, consumer_id: `${producer!.id}` })
                producer!.close()
                this.producers.delete(producer!.id)
            }
        )

        return producer
    }

    async createConsumer(consumer_transport_id: any, producer_id: any, rtpCapabilities: any) {
        let consumerTransport = this.transports.get(consumer_transport_id)

        let consumer = null
        try {
            consumer = await consumerTransport?.consume({
                producerId: producer_id,
                rtpCapabilities,
                paused: false //producer.kind === 'video',
            })
        } catch (error) {
            console.error('Consume failed', error)
            return
        }

        if (consumer!.type === 'simulcast') {
            await consumer?.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2
            })
        }

        this.consumers.set(consumer!.id, consumer)
        consumer?.on(
            'transportclose',
            () => {
                console.log('Consumer transport close', { name: `${this.name}`, consumer_id: `${consumer!.id}` })
                this.consumers.delete(consumer!.id)
            }
        )

        return {
            consumer,
            params: {
                producerId: producer_id,
                id: consumer!.id,
                kind: consumer!.kind,
                rtpParameters: consumer!.rtpParameters,
                type: consumer!.type,
                producerPaused: consumer!.producerPaused
            }
        }
    }

    updateAdmin(isAdmin:boolean){
        this.isAdmin=isAdmin;
        return this.isAdmin;
    }

    closeProducer(producer_id: any) {
        try {
            this.producers.get(producer_id).close()
        } catch (e) {
            console.warn(e)
        }

        this.producers.delete(producer_id)
    }

    getProducer(producer_id:any) {
        return this.producers.get(producer_id)
    }

    close() {
        this.transports.forEach((transport) => transport.close())
    }

    removeConsumer(consumer_id: any) {
        this.consumers.delete(consumer_id)
    }

}