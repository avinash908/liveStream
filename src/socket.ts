import { Server, Socket } from "socket.io"
import { Room } from "./room";
import { config } from "./config";
import * as mediasoup from 'mediasoup';
import { WorkerLogLevel, WorkerLogTag } from "mediasoup/node/lib/types";
import { Peer } from "./peer";
import { Post } from "./model/post";

var users: Map<string, any> = new Map();
var rooms: Map<string, Room> | null = new Map();

// all mediasoup workers
let workers: Array<mediasoup.types.Worker> = [];
let nextMediasoupWorkerIdx = 0;

const clone = function (data?: any, defaultValue?: any) {
    if (typeof data === 'undefined')
        return defaultValue;

    return JSON.parse(JSON.stringify(data));
};


export const createWorker = async () => {
    let { numWorkers } = config.mediasoup
    let logTags = config.mediasoup.worker.logTags as WorkerLogTag[];
    for (let i = 0; i < numWorkers; i++) {
        let worker = await mediasoup.createWorker({
            logLevel: config.mediasoup.worker.logLevel as WorkerLogLevel,
            logTags: logTags,
            rtcMinPort: Number(config.mediasoup.worker.rtcMinPort),
            rtcMaxPort: Number(config.mediasoup.worker.rtcMaxPort)
        });
        worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid)
            setTimeout(() => process.exit(1), 2000)
        })
        workers.push(worker);

        if (process.env.MEDIASOUP_USE_WEBRTC_SERVER !== 'false') {
            const webRtcServerOptions = clone(config.mediasoup.webRtcServerOptions);
            const portIncrement = workers.length - 1;
            for (const listenInfo of webRtcServerOptions.listenInfos) {
                listenInfo.port += portIncrement;
            }
            const webRtcServer = await worker.createWebRtcServer(webRtcServerOptions);
            worker.appData.webRtcServer = webRtcServer;
        }
        console.log('mediasoup Worker')

        // Log worker resource usage every X seconds.
        setInterval(async () => {
            const usage = await worker.getResourceUsage();
            console.log('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);
    }


}
async function getMediasoupWorker() {
    const worker = workers[nextMediasoupWorkerIdx]
    if (++nextMediasoupWorkerIdx === workers.length) nextMediasoupWorkerIdx = 0
    return worker
}
export const socketServer = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        socket.on("getAllRooms", (_) => {
            if (rooms?.size! > 0) {
                const mapToArray = [];
                for (const [key, value] of rooms!.entries()) {
                    mapToArray.push({ key: key, value: value.toJson() });
                }
                socket.emit("allRooms", JSON.stringify(mapToArray));
            } else {
                socket.emit("allRooms", null);
            }
        });
        socket.on("userLogin", (data, cb) => {
            console.log("user Connected " + socket.id, data.name);
            if (!users.has(data.id)) {
                const id = data.id;
                users.set(id, { user: data, socketId: socket.id });
                cb(true);
                socket.emit("allLiveStream", rooms);
            } else {
                cb(false)
                socket.emit("allLiveStream", rooms);
            }
        });
        socket.on("createRoom", (data, cb) => onCreadedRoom(data, cb, io));
        socket.on('join', ({ roomId, name, isAdmin }, cb) => onRoomJoin({ roomId, name, isAdmin }, socket, cb))
        socket.on('getProducers', ({ id }) => {
            if (!rooms!.has(id)) return
            let producerList = rooms!.get(id)?.getProducerListForPeer();
            console.log(producerList);
            socket.emit('newProducers', { producerList, id })
        });
        socket.on("getRouterRtpCapabilities", async ({ id }, cb) => {
            printPreeName(id, socket);
            try {
                const routerRtpCapabilities = await rooms?.get(id)?.getRtpCapabilities();
                cb(null, { routerRtpCapabilities: routerRtpCapabilities, id: id });
            } catch (e: any) {
                cb(e, null);
            }
        });
        socket.on('createWebRtcTransport', async (data, callback) => {
            const id = data.id;
            console.log('Create webrtc transport', {
                name: `${rooms!.get(id)?.getPeers()!.get(socket.id)?.name}`
            })
            try {
                const { params }: any = await rooms!.get(id)?.createWebRtcTransport(socket.id)
                callback(null, { params, id })
            } catch (err) {
                callback(err, null)
            }
        });

        socket.on('connectTransport', async ({ transportId, dtlsParameters, id }, cb) => {
            console.log('Connect transport', { name: `${rooms!.get(id)?.getPeers()!.get(socket.id)?.name}` })
            if (!rooms!.has(id)) return
            await rooms!.get(id)?.connectPeerTransport(socket.id, transportId, dtlsParameters)
            cb()
        });

        socket.on("produce", async ({ kind, rtpParameters, producerTransportId, id, appData }, cb) => {
            if (!rooms!.has(id)) {
                return cb({
                    message: 'Room not longer the open'
                }, null)
            }

            let producer_id = await rooms!.get(id)?.produce(socket.id, producerTransportId, rtpParameters, kind, id, appData)
            console.log('Produce', {
                type: `${kind}`,
                name: `${rooms!.get(id)?.getPeers()!.get(socket.id)?.name}`,
                id: `${producer_id}`
            });
            cb(null, { id: producer_id })
        });

        socket.on('consume', async ({ rtpCapabilities, consumerTransportId, producerId, roomId, appData, id }, callback) => {
            if (!rooms!.has(roomId)) {
                return callback({ error: 'Room not found' }, null);
            }
            let produce: mediasoup.types.Producer | null = await rooms!.get(roomId)?.getPeers().get(id)?.getProducer(producerId);
            // console.log(produce)
            if (produce == null) return callback({ error: 'Room not found' }, null);
            let params = await rooms!
                .get(roomId)
                ?.consume(socket.id, consumerTransportId, producerId, rtpCapabilities, { type: produce.appData.type == "scree-share" ? "scree-share" : "video" });

            console.log('Consuming', {
                peer_id: socket.id,
                producer_id: producerId,
                consumer_id: params ? params.id : undefined,
            });
            callback(null, params);
        });


        socket.on('producerClosed', ({ producer_id }) => {
            console.log('Producer close', {
                name: `${rooms?.get(socket.data.roomId) &&
                    rooms.get(socket.data.roomId)?.getPeers().get(socket.id)?.name
                    }`,
            });
            rooms?.get(socket.data.roomId)?.closeProducer(socket.id, producer_id);
        });


        socket.on('disconnect', () => {
            console.log('Disconnect', {
                name: `${rooms!.get(socket.data.roomId) &&
                    rooms!.get(socket.data.roomId)?.getPeers().get(socket.id)?.name
                    }`,
            });
            if (!socket.data.roomId) return;
            rooms!.get(socket.data.roomId)?.removePeer(socket.id);
        });




        socket.on("sendRequsetToJoin", (_) => {
            console.log('User Requset To Join', {
                name: `${rooms?.get(socket.data.roomId) &&
                    rooms.get(socket.data.roomId)?.getPeers().get(socket.id)?.name
                    }`,
            });
            var prees = rooms?.get(socket.data.roomId)?.getPeers();
            console.log("prees");
            prees?.forEach((v: Peer, key: string) => {
                if (v.isAdmin) {
                    socket.to(key).emit("requsetToJoin", { id: socket.id, name: rooms!.get(socket.data.roomId)?.getPeers().get(socket.id)?.name })
                }
            });
        });
        socket.on("requsetAccept", (id) => {
            console.log('User Requset To Join', {
                name: `${rooms?.get(socket.data.roomId) &&
                    rooms.get(socket.data.roomId)?.getPeers().get(socket.id)?.name
                    }`,
            });
            if (rooms?.has(socket.data.roomId)) {
                socket.to(id).emit("requsetAccepted", { isAdmin: true, roomId1: socket.data.roomId });
            }
        });



        socket.on("startRecording", (_) => {
            rooms?.get(socket.data.roomId)?.handleStartRecording(socket.data.roomId, socket.id);
            console.log("Starte Recording");
        });


        socket.on("stopRecording", (_) => {
            rooms?.get(socket.data.roomId)?.stopMediasoupRtp({ useAudio: true, useVideo: true });
            console.log("Starte Recording");
        });



        socket.on("liveEnd", async (_, callback) => {
            console.log(socket.data.roomId);
            console.log('Exit room', {
                name: `${rooms?.get(socket.data.roomId) && rooms?.get(socket.data.roomId)?.getPeers().get(socket.id)}`
            });
            if (!rooms?.has(socket.data.roomId)) {
                callback({
                    error: 'not currently in a room'
                })
                return
            }
            for (let first of rooms?.get(socket.data.roomId)?.getPeers()!.entries()!) {
                await rooms?.get(socket.data.roomId)?.removePeer(first[0]);
                io.to(first[0]).emit("liveEnded", "live Stream ended");
            }
            // close transports
            var room = rooms?.get(socket.data.roomId);
            console.log(room);
            if (rooms?.get(socket.data.roomId)?.getPeers().size === 0) {
                rooms.delete(socket.data.roomId)
            }
            // const post = await Post.findById(socket.data.roomId);
            await Post.findByIdAndUpdate(socket.data.roomId, { $set: { isLive: false } }, { new: true }).then((v) => {
                console.log(v?._id);
            }).catch(e => console.log("UpdateError=>", e));
            socket.data.roomId = null
            callback('successfully exited room')
        });

    })
}



const onRoomJoin = ({ roomId, name, isAdmin }: any, socket: Socket, cb: any) => {
    console.log('User joined', {
        roomId,
        name,
        isAdmin,
    })

    if (!rooms!.has(roomId)) {
        cb({
            isJoind: false,
            id: roomId,
            message: "Room is not exist",
        }, null)
        return;
    }
    rooms!.get(roomId)?.addPeer(new Peer(socket.id, name, isAdmin));

    socket.data = { roomId };
    socket.rooms.add(roomId);
    cb(null, {
        isJoind: true,
        id: roomId,
        isAdmin,
        data: rooms!.get(roomId)?.toJson(),
        message: "Room is not exist",
    })
}

const onCreadedRoom = async (data: any, cb: any, io: Server) => {
    const { roomId } = data;
    if (rooms!.has(roomId)) {
        cb({
            isCreated: false,
            id: roomId,
            message: "Room is Already cretaed"
        })
    } else {
        console.log('Created room', { roomId: roomId })
        let worker = await getMediasoupWorker()
        rooms!.set(roomId, new Room(roomId, worker, io));
        cb({
            isCreated: true,
            id: roomId,
            message: "Room Created Suceess"
        })
    }
}


function printPreeName(roomId: any, socket: Socket) {
    console.log('Get producers', { name: `${rooms!.get(roomId)?.getPeers().get(socket.id)?.name}` })
}


