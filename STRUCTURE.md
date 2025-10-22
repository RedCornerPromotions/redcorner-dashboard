# Red Corner Stream Manager - Project Structure
```
redcorner-stream-manager/
├── server.js              # Main API server
├── stream-manager.js      # Channel orchestration
├── channel.js             # Individual channel logic
├── overlay_manager.js     # Overlay system
├── auth.js                # Authentication
├── package.json           # NPM dependencies
├── README.md              # Project documentation
├── INSTALL.md             # Installation guide
├── LICENSE                # Proprietary license
├── CONTRIBUTING.md        # Development guidelines
├── STRUCTURE.md           # This file
├── .gitignore            # Git ignore rules
│
└── public/               # Web dashboard
    ├── dashboard.html    # Main control interface
    ├── player.html       # Video player
    └── login.html        # Login page (if separate)
```

## Core Components

### server.js
- Express API server
- REST endpoints for channel control
- Authentication middleware
- Static file serving

**Key Endpoints:**
- `/api/channels` - List all channels
- `/api/channel/:id/start` - Start channel
- `/api/channel/:id/stop` - Stop channel
- `/api/channel/:id/status` - Get channel status
- `/api/channel/:id/destination` - Manage destinations
- `/api/channel/:id/overlay/*` - Overlay management

### stream-manager.js
- Manages 5 channel instances
- Coordinates channel lifecycle
- Handles channel configuration

### channel.js
- GStreamer pipeline management
- Input/output stream handling
- Destination streaming (FFmpeg)
- Preview/Program output
- Overlay integration

**Pipeline Flow:**
```
Input → GStreamer → [Overlay] → Encode → Tee → Preview
                                           └──→ Program
```

### overlay_manager.js
- HTTP image download
- Local caching (/tmp/stream_overlays/)
- GStreamer overlay element generation
- Position/opacity control

### auth.js
- Session management
- User authentication
- Cookie-based sessions

### public/dashboard.html
- Web-based control interface
- Channel tabs (1-5)
- Preview/Program video players
- Settings and overlay controls
- Destination management

### public/player.html
- HLS video player
- Auto-reconnect on error
- Handles preview/program streams

## Data Flow

### Starting a Channel
```
User → Dashboard → API (POST /start) → StreamManager → Channel
  → GStreamer Pipeline → MediaMTX → HLS → Dashboard Player
```

### Adding Overlay
```
User → Dashboard → API (POST /overlay/new) → OverlayManager
  → Download Image → Cache → Channel Restart → GStreamer with Overlay
```

### Streaming to Destination
```
Channel Program Output → MediaMTX → FFmpeg → External RTMP/SRT
```

## Configuration

### Channel Ports
- Channel 1: SRT 8890, RTSP 8554
- Channel 2: SRT 8891, RTSP 8555
- Channel 3: SRT 8892, RTSP 8556
- Channel 4: SRT 8893, RTSP 8557
- Channel 5: SRT 8894, RTSP 8558

### MediaMTX Paths
- Input: `/channel1` - `/channel5`
- Preview: `/preview/channel1` - `/preview/channel5`
- Program: `/program/channel1` - `/program/channel5`

### Server Ports
- API/Dashboard: 5000
- MediaMTX HLS: 8888
- MediaMTX RTMP: 1935
- MediaMTX API: 9997

## External Dependencies

### Required Services
- **MediaMTX** - Media server for RTSP/HLS/RTMP
- **GStreamer** - Video processing
- **FFmpeg** - Multi-destination streaming
- **Node.js** - API server runtime

### NPM Packages
- express - Web framework
- body-parser - JSON parsing
- cors - Cross-origin requests
- cookie-parser - Session cookies

## Development Notes

### Adding a New Channel
1. Update `stream-manager.js` channel count
2. Configure new SRT/RTSP ports
3. Add MediaMTX path
4. Update dashboard UI

### Modifying Video Processing
- Edit `channel.js` GStreamer pipeline
- Update encoding parameters (bitrate, resolution)
- Test with all input protocols

### Overlay Enhancements
- Modify `overlay_manager.js`
- Update GStreamer overlay elements
- Add new positioning options

---

**Red Corner - Live Sports Production**
