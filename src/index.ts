import dotenv from 'dotenv';
import express, { Express } from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { Server } from 'socket.io';
import { config } from './config';
import { mainRouter } from './router';
import { createWorker, socketServer } from './socket';

import cors from 'cors';
import { dbConnect } from './db/db';
dotenv.config();
const app: Express = express();
const port = process.env.PORT;


app.use(express.static("build"));
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({ extended: true ,limit:100000}));
app.use("/api/v1", mainRouter);
const options = {
    key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
    cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
}

app.get("*",(req,res)=>{
    res.sendFile('index.html', {root: path.join(__dirname, '../build/')});
    // res.sendFile(path.resolve(__dirname,  'build', 'index.html'));

});

const server = https.createServer(options, app)
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
socketServer(io);
server.listen(port, async () => {
    await createWorker();
    await dbConnect();
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

