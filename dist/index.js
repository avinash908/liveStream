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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const router_1 = require("./router");
const socket_1 = require("./socket");
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db/db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(express_1.default.static("build"));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: 100000 }));
app.use("/api/v1", router_1.mainRouter);
const options = {
    key: fs_1.default.readFileSync(path_1.default.join(__dirname, config_1.config.sslKey), 'utf-8'),
    cert: fs_1.default.readFileSync(path_1.default.join(__dirname, config_1.config.sslCrt), 'utf-8')
};
app.get("*", (req, res) => {
    res.sendFile('index.html', { root: path_1.default.join(__dirname, '../build/') });
    // res.sendFile(path.resolve(__dirname,  'build', 'index.html'));
});
const server = https_1.default.createServer(options, app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*"
    }
});
(0, socket_1.socketServer)(io);
server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, socket_1.createWorker)();
    yield (0, db_1.dbConnect)();
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
}));
