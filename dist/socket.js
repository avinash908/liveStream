"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.socketServer = exports.createWorker = void 0;
const room_1 = require("./room");
const config_1 = require("./config");
const mediasoup = __importStar(require("mediasoup"));
const peer_1 = require("./peer");
const post_1 = require("./model/post");
var users = new Map();
var rooms = new Map();
// all mediasoup workers
let workers = [];
let nextMediasoupWorkerIdx = 0;
const clone = function (data, defaultValue) {
    if (typeof data === 'undefined')
        return defaultValue;
    return JSON.parse(JSON.stringify(data));
};
const createWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    let { numWorkers } = config_1.config.mediasoup;
    let logTags = config_1.config.mediasoup.worker.logTags;
    for (let i = 0; i < numWorkers; i++) {
        let worker = yield mediasoup.createWorker({
            logLevel: config_1.config.mediasoup.worker.logLevel,
            logTags: logTags,
            rtcMinPort: Number(config_1.config.mediasoup.worker.rtcMinPort),
            rtcMaxPort: Number(config_1.config.mediasoup.worker.rtcMaxPort)
        });
        worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        });
        workers.push(worker);
        if (process.env.MEDIASOUP_USE_WEBRTC_SERVER !== 'false') {
            const webRtcServerOptions = clone(config_1.config.mediasoup.webRtcServerOptions);
            const portIncrement = workers.length - 1;
            for (const listenInfo of webRtcServerOptions.listenInfos) {
                listenInfo.port += portIncrement;
            }
            const webRtcServer = yield worker.createWebRtcServer(webRtcServerOptions);
            worker.appData.webRtcServer = webRtcServer;
        }
        console.log('mediasoup Worker');
        // Log worker resource usage every X seconds.
        setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const usage = yield worker.getResourceUsage();
            console.log('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }), 120000);
    }
});
exports.createWorker = createWorker;
function getMediasoupWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        const worker = workers[nextMediasoupWorkerIdx];
        if (++nextMediasoupWorkerIdx === workers.length)
            nextMediasoupWorkerIdx = 0;
        return worker;
    });
}
const socketServer = (io) => {
    io.on("connection", (socket) => {
        socket.on("getAllRooms", (_) => {
            if ((rooms === null || rooms === void 0 ? void 0 : rooms.size) > 0) {
                const mapToArray = [];
                for (const [key, value] of rooms.entries()) {
                    mapToArray.push({ key: key, value: value.toJson() });
                }
                socket.emit("allRooms", JSON.stringify(mapToArray));
            }
            else {
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
            }
            else {
                cb(false);
                socket.emit("allLiveStream", rooms);
            }
        });
        socket.on("createRoom", (data, cb) => onCreadedRoom(data, cb, io));
        socket.on('join', ({ roomId, name, isAdmin }, cb) => onRoomJoin({ roomId, name, isAdmin }, socket, cb));
        socket.on('getProducers', ({ id }) => {
            var _a;
            if (!rooms.has(id))
                return;
            let producerList = (_a = rooms.get(id)) === null || _a === void 0 ? void 0 : _a.getProducerListForPeer();
            socket.emit('newProducers', { producerList, id });
            if ((rooms === null || rooms === void 0 ? void 0 : rooms.size) > 0) {
                const mapToArray = [];
                for (const [key, value] of rooms.entries()) {
                    mapToArray.push({ key: key, value: value.toJson() });
                }
                io.emit("allRooms", JSON.stringify(mapToArray));
            }
            else {
                io.emit("allRooms", null);
            }
        });
        socket.on("getRouterRtpCapabilities", ({ id }, cb) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            printPreeName(id, socket);
            try {
                const routerRtpCapabilities = yield ((_a = rooms === null || rooms === void 0 ? void 0 : rooms.get(id)) === null || _a === void 0 ? void 0 : _a.getRtpCapabilities());
                cb(null, { routerRtpCapabilities: routerRtpCapabilities, id: id });
            }
            catch (e) {
                cb(e, null);
            }
        }));
        socket.on('createWebRtcTransport', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            var _b, _c, _d;
            const id = data.id;
            console.log('Create webrtc transport', {
                name: `${(_c = (_b = rooms.get(id)) === null || _b === void 0 ? void 0 : _b.getPeers().get(socket.id)) === null || _c === void 0 ? void 0 : _c.name}`
            });
            try {
                const { params } = yield ((_d = rooms.get(id)) === null || _d === void 0 ? void 0 : _d.createWebRtcTransport(socket.id));
                callback(null, { params, id });
            }
            catch (err) {
                callback(err, null);
            }
        }));
        socket.on('connectTransport', ({ transportId, dtlsParameters, id }, cb) => __awaiter(void 0, void 0, void 0, function* () {
            var _e, _f, _g;
            console.log('Connect transport', { name: `${(_f = (_e = rooms.get(id)) === null || _e === void 0 ? void 0 : _e.getPeers().get(socket.id)) === null || _f === void 0 ? void 0 : _f.name}` });
            if (!rooms.has(id))
                return;
            yield ((_g = rooms.get(id)) === null || _g === void 0 ? void 0 : _g.connectPeerTransport(socket.id, transportId, dtlsParameters));
            cb();
        }));
        socket.on("produce", ({ kind, rtpParameters, producerTransportId, id, appData }, cb) => __awaiter(void 0, void 0, void 0, function* () {
            var _h, _j, _k;
            if (!rooms.has(id)) {
                return cb({
                    message: 'Room not longer the open'
                }, null);
            }
            let producer_id = yield ((_h = rooms.get(id)) === null || _h === void 0 ? void 0 : _h.produce(socket.id, producerTransportId, rtpParameters, kind, id, appData));
            console.log('Produce', {
                type: `${kind}`,
                name: `${(_k = (_j = rooms.get(id)) === null || _j === void 0 ? void 0 : _j.getPeers().get(socket.id)) === null || _k === void 0 ? void 0 : _k.name}`,
                id: `${producer_id}`
            });
            cb(null, { id: producer_id });
        }));
        socket.on('consume', ({ rtpCapabilities, consumerTransportId, producerId, roomId, appData, id }, callback) => __awaiter(void 0, void 0, void 0, function* () {
            var _l, _m, _o;
            if (!rooms.has(roomId)) {
                return callback({ error: 'Room not found' }, null);
            }
            let produce = yield ((_m = (_l = rooms.get(roomId)) === null || _l === void 0 ? void 0 : _l.getPeers().get(id)) === null || _m === void 0 ? void 0 : _m.getProducer(producerId));
            // console.log(produce)
            if (produce == null)
                return callback({ error: 'Room not found' }, null);
            let params = yield ((_o = rooms
                .get(roomId)) === null || _o === void 0 ? void 0 : _o.consume(socket.id, consumerTransportId, producerId, rtpCapabilities, { type: produce.appData.type == "scree-share" ? "scree-share" : "video" }));
            console.log('Consuming', {
                peer_id: socket.id,
                producer_id: producerId,
                consumer_id: params ? params.id : undefined,
            });
            callback(null, params);
        }));
        socket.on('producerClosed', ({ producer_id }) => {
            var _a, _b, _c;
            console.log('Producer close', {
                name: `${(rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) &&
                    ((_b = (_a = rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(socket.id)) === null || _b === void 0 ? void 0 : _b.name)}`,
            });
            (_c = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _c === void 0 ? void 0 : _c.closeProducer(socket.id, producer_id);
        });
        socket.on('disconnect', () => {
            var _a, _b, _c;
            console.log('Disconnect', {
                name: `${rooms.get(socket.data.roomId) &&
                    ((_b = (_a = rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(socket.id)) === null || _b === void 0 ? void 0 : _b.name)}`,
            });
            if (!socket.data.roomId)
                return;
            (_c = rooms.get(socket.data.roomId)) === null || _c === void 0 ? void 0 : _c.removePeer(socket.id);
        });
        socket.on("sendRequsetToJoin", (_) => {
            var _a, _b, _c;
            console.log('User Requset To Join', {
                name: `${(rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) &&
                    ((_b = (_a = rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(socket.id)) === null || _b === void 0 ? void 0 : _b.name)}`,
            });
            var prees = (_c = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _c === void 0 ? void 0 : _c.getPeers();
            console.log("prees");
            prees === null || prees === void 0 ? void 0 : prees.forEach((v, key) => {
                var _a, _b;
                if (v.isAdmin) {
                    socket.to(key).emit("requsetToJoin", { id: socket.id, name: (_b = (_a = rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(socket.id)) === null || _b === void 0 ? void 0 : _b.name });
                }
            });
        });
        socket.on("requsetAccept", (id) => {
            var _a, _b;
            console.log('User Requset To Join', {
                name: `${(rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) &&
                    ((_b = (_a = rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(socket.id)) === null || _b === void 0 ? void 0 : _b.name)}`,
            });
            if (rooms === null || rooms === void 0 ? void 0 : rooms.has(socket.data.roomId)) {
                socket.to(id).emit("requsetAccepted", { isAdmin: true, roomId1: socket.data.roomId });
            }
        });
        socket.on("rejectRequest", ({ id }) => {
            var _a, _b;
            console.log('User Requset To Reject', {
                name: `${(rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) &&
                    ((_b = (_a = rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(id)) === null || _b === void 0 ? void 0 : _b.name)}`,
            });
            if (rooms === null || rooms === void 0 ? void 0 : rooms.has(socket.data.roomId)) {
                socket.to(id).emit("rejectedRequest", { message: "request Rejected by Admin" });
            }
        });
        socket.on("startRecording", (_) => {
            var _a;
            (_a = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.handleStartRecording(socket.data.roomId, socket.id);
            console.log("Starte Recording");
        });
        socket.on("stopRecording", (_) => {
            var _a;
            (_a = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _a === void 0 ? void 0 : _a.stopMediasoupRtp({ useAudio: true, useVideo: true });
            console.log("Starte Recording");
        });
        socket.on("liveEnd", (_, callback) => __awaiter(void 0, void 0, void 0, function* () {
            var _p, _q, _r, _s;
            console.log(socket.data.roomId);
            console.log('Exit room', {
                name: `${(rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) && ((_p = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _p === void 0 ? void 0 : _p.getPeers().get(socket.id))}`
            });
            if (!(rooms === null || rooms === void 0 ? void 0 : rooms.has(socket.data.roomId))) {
                callback({
                    error: 'not currently in a room'
                });
                return;
            }
            for (let first of (_q = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _q === void 0 ? void 0 : _q.getPeers().entries()) {
                yield ((_r = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _r === void 0 ? void 0 : _r.removePeer(first[0]));
                io.to(first[0]).emit("liveEnded", "live Stream ended");
            }
            // close transports
            var room = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId);
            console.log(room);
            if (((_s = rooms === null || rooms === void 0 ? void 0 : rooms.get(socket.data.roomId)) === null || _s === void 0 ? void 0 : _s.getPeers().size) === 0) {
                rooms.delete(socket.data.roomId);
            }
            // const post = await Post.findById(socket.data.roomId);
            yield post_1.Post.findByIdAndUpdate(socket.data.roomId, { $set: { isLive: false } }, { new: true }).then((v) => {
                console.log(v === null || v === void 0 ? void 0 : v._id);
            }).catch(e => console.log("UpdateError=>", e));
            socket.data.roomId = null;
            callback('successfully exited room');
        }));
    });
};
exports.socketServer = socketServer;
const onRoomJoin = ({ roomId, name, isAdmin }, socket, cb) => {
    var _a, _b;
    console.log('User joined', {
        roomId,
        name,
        isAdmin,
    });
    if (!rooms.has(roomId)) {
        cb({
            isJoind: false,
            id: roomId,
            message: "Room is not exist",
        }, null);
        return;
    }
    (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.addPeer(new peer_1.Peer(socket.id, name, isAdmin));
    socket.data = { roomId };
    socket.rooms.add(roomId);
    cb(null, {
        isJoind: true,
        id: roomId,
        isAdmin,
        data: (_b = rooms.get(roomId)) === null || _b === void 0 ? void 0 : _b.toJson(),
        message: "Room is not exist",
    });
};
const onCreadedRoom = (data, cb, io) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = data;
    if (rooms.has(roomId)) {
        cb({
            isCreated: false,
            id: roomId,
            message: "Room is Already cretaed"
        });
    }
    else {
        console.log('Created room', { roomId: roomId });
        let worker = yield getMediasoupWorker();
        rooms.set(roomId, new room_1.Room(roomId, worker, io));
        cb({
            isCreated: true,
            id: roomId,
            message: "Room Created Suceess"
        });
    }
});
function printPreeName(roomId, socket) {
    var _a, _b;
    console.log('Get producers', { name: `${(_b = (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.getPeers().get(socket.id)) === null || _b === void 0 ? void 0 : _b.name}` });
}
