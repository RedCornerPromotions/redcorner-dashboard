# Red Corner Stream Manager
**Live Sports Production**

A professional 5-channel stream management system for live sports broadcasting.

## Features

- **5 Independent Channels** - Manage multiple streams simultaneously
- **Multiple Input Protocols** - SRT, RTMP, RTSP support
- **Preview/Program Architecture** - Professional broadcast workflow
- **Multi-Destination Output** - Stream to YouTube, Twitch, custom RTMP endpoints
- **Web-Based Control** - Modern dashboard interface
- **Low Latency** - Optimized for live sports with minimal delay
- **Overlay Support** - Add graphics and branding to your streams

## System Architecture
```
Input (SRT/RTMP/RTSP) → MediaMTX → GStreamer Processing → Preview/Program Outputs → Destinations
```

## Technology Stack

- **Node.js** - API server and control interface
- **GStreamer** - Video processing and encoding
- **MediaMTX** - Media server for protocol conversion and streaming
- **FFmpeg** - Multi-destination streaming

## Quick Start

### Prerequisites

- Ubuntu 22.04 or later
- Node.js 18+
- GStreamer 1.20+
- MediaMTX
- FFmpeg

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/redcorner-stream-manager.git
cd redcorner-stream-manager

# Install dependencies
npm install

# Start server
node server.js
```

### Access Dashboard

Open browser: `http://your-server-ip:5000/dashboard.html`

Default credentials:
- Username: `admin`
- Password: `RedCorner321` (change after first login)

## Channel Configuration

Each channel supports:

**Inputs:**
- SRT: `srt://0.0.0.0:889X?mode=listener` (X = 0-4)
- RTMP: `rtmp://localhost:1935/channelX/stream`
- RTSP: `rtsp://localhost:855X/channelX`

**Outputs:**
- Preview: Real-time input monitoring
- Program: Processed output with overlays and effects

## Usage

### Starting a Channel

1. Send video to channel input (SRT recommended)
2. Open dashboard and login
3. Select channel
4. Click "Start Channel" in Settings tab
5. Monitor in Preview/Program tabs

### Adding Destinations

1. Go to channel's Destinations section
2. Enter RTMP/SRT URL
3. Click "Add Destination"
4. Toggle to start/stop streaming

### Adding Overlays

1. Configure overlay image URL
2. Set position and opacity
3. Apply overlay
4. Restart channel to see changes

## API Documentation

### Channel Control
```bash
# Start channel
POST /api/channel/:id/start
Body: { "inputUrl": "rtsp://localhost:8554/channel1" }

# Stop channel
POST /api/channel/:id/stop

# Get status
GET /api/channel/:id/status
```

### Overlay Management
```bash
# Set overlay
POST /api/channel/:id/overlay/new
Body: { "url": "https://...", "x": 0, "y": 0, "alpha": 1.0 }

# Remove overlay
DELETE /api/channel/:id/overlay/remove

# Refresh overlay
POST /api/channel/:id/overlay/refresh
```

## Configuration

Edit `server.js` to customize:
- Port (default: 5000)
- Video resolution (default: 1920x1080)
- Bitrate (default: 6000 kbps)
- Channel count (default: 5)

## Troubleshooting

### Channel won't start
- Verify input source is streaming
- Check GStreamer is installed: `gst-launch-1.0 --version`
- Check MediaMTX is running: `ps aux | grep mediamtx`

### No video in dashboard
- Verify MediaMTX HLS is enabled (port 8888)
- Check browser console for errors
- Try different browser (Chrome recommended)

### Destination streaming fails
- Verify destination URL is correct
- Check network connectivity
- Review server logs for errors

## Development

Built by **Red Corner** for professional live sports production.

For custom features or support, contact: brian@redcorner.com.au

## License

Proprietary - Red Corner © 2025

---

**Red Corner - Live Sports Production**
