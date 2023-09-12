const os = require('os')
const ifaces = os.networkInterfaces()

const getLocalIp = () => {
  let localIp = '127.0.0.1'
  Object.keys(ifaces).forEach((ifname) => {
    for (const iface of ifaces[ifname]) {
      // Ignore IPv6 and 127.0.0.1
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        continue
      }
      // Set the local ip to the first IPv4 address found and exit the loop
      localIp = iface.address
      return
    }
  })
  return localIp
}
export const config = {
  listenIp: '0.0.0.0',
  listenPort: 4100,
  sslCrt: '../ssl/cert.pem',
  sslKey: '../ssl/key.pem',
  mediasoup: {
    // Worker settings
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: process.env.MEDIASOUP_MIN_PORT || 40000,
      rtcMaxPort: process.env.MEDIASOUP_MAX_PORT || 49999,
      logLevel: 'warn',
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
        'rtx',
        'bwe',
        'score',
        'simulcast',
        'svc'
      ]
    },
    // Router settings
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          preferredPayloadType: 111,
          clockRate: 48000,
          channels: 2,
          parameters: {
            minptime: 10,
            useinbandfec: 1,
          },
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          preferredPayloadType: 96,
          clockRate: 90000,
          // parameters:
          // {
          //   'x-google-start-bitrate': 1000
          // }
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters:
          {
            'profile-id': 2,
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters:
          {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters:
          {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000
          }
        }
      ]
    },
    webRtcServerOptions: {
      listenInfos:
        [
          {
            protocol: 'udp',
            ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
            announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp(),//"|| '3.85.47.74'",
            port: 44444
          },
          {
            protocol: 'tcp',
            ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
            announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp(),//"|| '3.85.47.74'",,
            port: 44444
          }
        ]
    },
    // WebRtcTransport settings
    webRtcTransport: {
      // listenIps is not needed since webRtcServer is used.
      // However passing MEDIASOUP_USE_WEBRTC_SERVER=false will change it.
      listenIps:
        [
          {
            ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
            announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp()//"|| '3.85.47.74'",
          }
        ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      // Additional options that are not part of WebRtcTransportOptions.
      maxIncomingBitrate: 1500000
    },
    plainTransportOptions: {
      listenIp:
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp(),//"|| '3.85.47.74'",,
      },
      maxSctpMessageSize: 262144
    },
    recording: {
      ip: "127.0.0.1",
      // GStreamer's sdpdemux only supports RTCP = RTP + 1
      audioPort: 5004,
      audioPortRtcp: 5005,
      videoPort: 5006,
      videoPortRtcp: 5007,
    },

  }
}