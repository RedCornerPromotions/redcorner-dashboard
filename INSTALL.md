# Red Corner Stream Manager - Installation Guide

## System Requirements

- **OS**: Ubuntu 22.04 LTS (recommended) or Ubuntu 20.04+
- **RAM**: 8GB minimum, 16GB recommended
- **CPU**: 4 cores minimum, 8 cores recommended
- **Network**: Stable internet connection for streaming
- **Storage**: 20GB free space

## Step 1: Install System Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install GStreamer
sudo apt install -y \
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav

# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installations
node --version
gst-launch-1.0 --version
ffmpeg -version
```

## Step 2: Install MediaMTX
```bash
# Download MediaMTX
cd /tmp
wget https://github.com/bluenviron/mediamtx/releases/download/v1.9.0/mediamtx_v1.9.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.9.0_linux_amd64.tar.gz

# Install
sudo mkdir -p /opt/mediamtx
sudo mv mediamtx /opt/mediamtx/
sudo mv mediamtx.yml /etc/mediamtx/

# Configure MediaMTX
sudo nano /etc/mediamtx/mediamtx.yml
```

Edit MediaMTX config:
```yaml
rtmpAddress: :1935
srtAddress: :8890
hlsAddress: :8888
hlsAlwaysRemux: yes
hlsVariant: lowLatency
hlsSegmentDuration: 4s
hlsPartDuration: 500ms
hlsSegmentCount: 10
api: yes
apiAddress: :9997

paths:
  all:
    source: publisher
```

Create MediaMTX service:
```bash
sudo nano /etc/systemd/system/mediamtx.service
```

Add:
```ini
[Unit]
Description=MediaMTX Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/mediamtx/mediamtx /etc/mediamtx/mediamtx.yml
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mediamtx
sudo systemctl start mediamtx
sudo systemctl status mediamtx
```

## Step 3: Install Red Corner Stream Manager
```bash
# Clone repository
cd /root
git clone https://github.com/yourusername/redcorner-stream-manager.git
cd redcorner-stream-manager

# Install dependencies
npm install

# Test run
node server.js
```

You should see:
```
[OverlayManager] Init: /tmp/stream_overlays
...
🔐 API running on http://your-ip:5000
🎥 5-Channel Stream Manager
```

## Step 4: Create System Service
```bash
sudo nano /etc/systemd/system/redcorner-stream.service
```

Add:
```ini
[Unit]
Description=Red Corner Stream Manager
After=network.target mediamtx.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/redcorner-stream-manager
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable redcorner-stream
sudo systemctl start redcorner-stream
sudo systemctl status redcorner-stream
```

## Step 5: Configure Firewall
```bash
# Allow necessary ports
sudo ufw allow 5000/tcp    # Dashboard
sudo ufw allow 8888/tcp    # HLS
sudo ufw allow 8890/udp    # SRT Channel 1
sudo ufw allow 8891/udp    # SRT Channel 2
sudo ufw allow 8892/udp    # SRT Channel 3
sudo ufw allow 8893/udp    # SRT Channel 4
sudo ufw allow 8894/udp    # SRT Channel 5
sudo ufw allow 1935/tcp    # RTMP
sudo ufw reload
```

## Step 6: Access Dashboard

Open browser: `http://your-server-ip:5000/dashboard.html`

Login:
- Username: `admin`
- Password: `RedCorner321`

**⚠️ Change the default password immediately!**

## Verification

Test each component:
```bash
# Check MediaMTX
curl http://localhost:9997/v3/paths/list

# Check Red Corner API
curl http://localhost:5000/api/channels

# Check HLS server
curl http://localhost:8888/
```

## Troubleshooting

### MediaMTX won't start
```bash
sudo systemctl status mediamtx
sudo journalctl -u mediamtx -f
```

### Stream Manager won't start
```bash
sudo systemctl status redcorner-stream
sudo journalctl -u redcorner-stream -f
```

### Port conflicts
```bash
sudo netstat -tulpn | grep -E '5000|8888|8890|1935'
```

## Support

For assistance: brian@redcorner.com.au

---

**Red Corner - Live Sports Production**
