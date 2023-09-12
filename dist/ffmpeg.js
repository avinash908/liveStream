"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Class to handle child process used for running FFmpeg
const child_process_1 = __importDefault(require("child_process"));
const events_1 = require("events");
const stream_1 = require("stream");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.setPromisesDependency(require('bluebird'));
aws_sdk_1.default.config.update({
    accessKeyId: "AKIA3QW5R7CLSAUOQUOI",
    secretAccessKey: "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",
    "region": "us-east-1"
});
var s3Bucket = new aws_sdk_1.default.S3();
const RECORD_FILE_LOCATION_PATH = process.env.RECORD_FILE_LOCATION_PATH || __dirname + '/recording';
class FFmpeg {
    constructor(rtpParameters) {
        this.rtpParameters = null;
        this.process = null;
        this.rtpParameters = rtpParameters;
        this.observer = new events_1.EventEmitter();
        this._createProcess();
    }
    _createProcess() {
        const sdpString = createSdpText(this.rtpParameters);
        const sdpStream = convertStringToStream(sdpString);
        console.log('createProcess() [sdpString:%s]', sdpString);
        this.process = child_process_1.default.spawn('ffmpeg', this._commandArgs);
        if (this.process.stderr) {
            this.process.stderr.setEncoding('utf-8');
            this.process.stderr.on('data', data => {
                console.log('ffmpeg::process::data [data:%o]', data);
            });
        }
        if (this.process.stdout) {
            this.process.stdout.setEncoding('utf-8');
            this.process.stdout.on('data', data => {
                console.log('ffmpeg::process::data [data:%o]', data);
            });
            this.process.stdout.on("close", () => {
                const coolPath = path_1.default.join(__dirname, "recording", `${this.rtpParameters.fileName}.webm`);
                try {
                    if (fs_1.default.existsSync(coolPath)) {
                        var params = {
                            Body: fs_1.default.createReadStream(coolPath),
                            Bucket: "liverecords",
                            Key: this.rtpParameters.fileName + ".webm"
                        };
                        s3Bucket.putObject(params, (err, data) => {
                            var _a, _b;
                            if (err) {
                                (_a = this.observer) === null || _a === void 0 ? void 0 : _a.emit("uploaded", { name: this.rtpParameters.fileName + ".webm", isSuccess: false });
                            }
                            else {
                                (_b = this.observer) === null || _b === void 0 ? void 0 : _b.emit("uploaded", { name: this.rtpParameters.fileName + ".webm", isSuccess: true });
                            }
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                }
            });
        }
        this.process.on('message', message => console.log('ffmpeg::process::message [message:%o]', message));
        this.process.on('error', error => {
            console.error('ffmpeg::process::error [error:%o]', error);
        });
        this.process.on("close", () => {
            var _a;
            console.log('ffmpeg::process::close');
            (_a = this.observer) === null || _a === void 0 ? void 0 : _a.emit('process-close');
        });
        sdpStream.on('error', error => {
            console.error('sdpStream::error [error:%o]', error);
        });
        // Pipe sdp stream to the ffmpeg process
        sdpStream.resume();
        sdpStream.pipe(this.process.stdin);
    }
    kill() {
        var _a;
        console.log('kill() [pid:%d]', this.process.pid);
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.kill('SIGINT');
    }
    get _commandArgs() {
        let commandArgs = [
            '-loglevel',
            'debug',
            '-protocol_whitelist',
            'pipe,udp,rtp',
            '-fflags',
            '+genpts',
            '-f',
            'sdp',
            '-i',
            'pipe:0'
        ];
        commandArgs = commandArgs.concat(this._videoArgs);
        commandArgs = commandArgs.concat(this._audioArgs);
        commandArgs = commandArgs.concat([
            /*
            '-flags',
            '+global_header',
            */
            `${RECORD_FILE_LOCATION_PATH}/${this.rtpParameters.fileName}.webm`
        ]);
        console.log('commandArgs:%o', commandArgs);
        return commandArgs;
    }
    get _videoArgs() {
        return [
            '-map',
            '0:v:0',
            '-c:v',
            'copy'
        ];
    }
    get _audioArgs() {
        return [
            '-map',
            '0:a:0',
            '-strict',
            '-2',
            '-c:a',
            'copy'
        ];
    }
}
// File to create SDP text from mediasoup RTP Parameters
const createSdpText = (rtpParameters) => {
    const { video, audio } = rtpParameters;
    // Video codec info
    const videoCodecInfo = getCodecInfoFromRtpParameters('video', video.rtpParameters);
    // Audio codec info
    const audioCodecInfo = getCodecInfoFromRtpParameters('audio', audio.rtpParameters);
    return `v=0
     o=- 0 0 IN IP4 127.0.0.1
     s=FFmpeg
     c=IN IP4 127.0.0.1
     t=0 0
     m=video ${video.remoteRtpPort} RTP/AVP ${videoCodecInfo.payloadType} 
     a=rtpmap:${videoCodecInfo.payloadType} ${videoCodecInfo.codecName}/${videoCodecInfo.clockRate}
     a=sendonly
     m=audio ${audio.remoteRtpPort} RTP/AVP ${audioCodecInfo.payloadType} 
     a=rtpmap:${audioCodecInfo.payloadType} ${audioCodecInfo.codecName}/${audioCodecInfo.clockRate}/${audioCodecInfo.channels}
     a=sendonly`;
};
// const createSdpText = (rtpParameters: any) => {
//     const { video, audio } = rtpParameters;
//     // Video codec info
//     const videoCodecInfo = getCodecInfoFromRtpParameters('video', video.rtpParameters);
//     // Audio codec info
//     // const audioCodecInfo = getCodecInfoFromRtpParameters('audio', audio.rtpParameters);
//     return `v=0
//      o=- 0 0 IN IP4 127.0.0.1
//      s=FFmpeg
//      c=IN IP4 127.0.0.1
//      t=0 0
//      m=video ${video.remoteRtpPort} RTP/AVP ${videoCodecInfo.payloadType} 
//      a=rtpmap:${videoCodecInfo.payloadType} ${videoCodecInfo.codecName}/${videoCodecInfo.clockRate}
//      a=sendonly
//      m=audio ${audio.remoteRtpPort} RTP/AVP ${audioCodecInfo.payloadType} 
//      a=rtpmap:${audioCodecInfo.payloadType} ${audioCodecInfo.codecName}/${audioCodecInfo.clockRate}/${audioCodecInfo.channels}
//      a=sendonly`;
// };
const getCodecInfoFromRtpParameters = (kind, rtpParameters) => {
    return {
        payloadType: rtpParameters.codecs[0].payloadType,
        codecName: rtpParameters.codecs[0].mimeType.replace(`${kind}/`, ''),
        clockRate: rtpParameters.codecs[0].clockRate,
        channels: kind === 'audio' ? rtpParameters.codecs[0].channels : undefined
    };
};
const convertStringToStream = (stringToConvert) => {
    const stream = new stream_1.Readable();
    stream._read = () => { };
    stream.push(stringToConvert);
    stream.push(null);
    return stream;
};
exports.default = FFmpeg;
