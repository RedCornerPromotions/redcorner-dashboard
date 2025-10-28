# Red Corner AWS MediaLive Dashboard

Professional web-based dashboard for managing AWS MediaLive channels with real-time HLS video monitoring, dynamic HTML5 overlay control, and multi-destination streaming.

## Features

- **Real-Time Video Players**: CloudFront HLS playback with automatic recovery
- **5-Channel Management**: Start/stop AWS MediaLive channels with live status
- **Dynamic Overlays**: Change HTML5 graphics overlays without restarting streams
- **Multi-Destination**: Stream to SRT (CASTR) and RTMP (YouTube, Facebook)
- **Multiview Monitor**: 3x3 grid for production monitoring
- **Cost Tracking**: Real-time AWS billing estimates

## Quick Start

1. Install dependencies: `npm install`
2. Configure `.env` with AWS credentials
3. Start server: `pm2 start server.js --name redcorner-dashboard`
4. Access: `http://your-ip:3000`

## Technology

- Node.js + Express
- AWS MediaLive, MediaConnect, S3, CloudFront
- HLS.js for video playback
- Session-based authentication

## Setup Requirements

- AWS MediaLive channel IDs
- CloudFront distribution with S3 origin
- IAM credentials with MediaLive/MediaConnect permissions

## License

MIT
