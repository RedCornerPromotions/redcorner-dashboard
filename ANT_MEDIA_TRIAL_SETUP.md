# Ant Media Server Enterprise - Trial Setup Documentation

## Server Details
- **Provider:** Digital Ocean
- **Location:** SYD1 (Sydney)
- **IP Address:** 134.199.150.238
- **Specs:** 8GB RAM / 4 vCPUs / 50GB + 100GB disk
- **OS:** Ubuntu 22.04.5 LTS
- **Hostname:** SRT-Server

## License Information
- **Edition:** Enterprise (14-day trial)
- **License Key:** AMS3866d0cec1488cd2a93780b4737f23
- **Owner:** brian@redcorner.com.au
- **Trial Start:** November 3, 2025
- **Trial Ends:** November 17, 2025

## Installation Details
- **Install Date:** November 3, 2025
- **Version:** Latest Enterprise Edition
- **Install Location:** `/usr/local/antmedia`
- **Service Name:** antmedia.service

## Access Points

### Admin Dashboard
- **HTTP:** http://134.199.150.238:5080
- **HTTPS:** https://134.199.150.238:5443

### Streaming Endpoints

#### SRT Input (Hardware Encoders)
```
srt://134.199.150.238:4200?streamid=YOUR_STREAM_ID
```
- **Port:** 4200 (UDP)
- **Protocol:** SRT
- **Latency:** 750ms (configurable)
- **Passphrase:** Can be configured per stream

#### RTMP Input (Software Encoders like OBS)
```
rtmp://134.199.150.238:1935/LiveApp/YOUR_STREAM_ID
```
- **Port:** 1935 (TCP)
- **Application:** LiveApp (default)

#### HLS Playback
```
http://134.199.150.238:5080/LiveApp/streams/YOUR_STREAM_ID.m3u8
```

#### WebRTC Playback (Ultra-low latency ~0.5s)
```
http://134.199.150.238:5080/LiveApp/play.html?name=YOUR_STREAM_ID
```

## Firewall Configuration

### Open Ports
```bash
22/tcp      - SSH
1935/tcp    - RTMP input
4200/udp    - SRT input
5080/tcp    - HTTP dashboard
5443/tcp    - HTTPS dashboard
5000-5500/udp - WebRTC
```

### Existing SRT Relay (Preserved)
```bash
20000-20009/udp - Existing SRT relay (unchanged)
```

## Applications

### LiveApp (Default)
- **Path:** /LiveApp
- **Purpose:** General live streaming
- **Features:**
  - Adaptive bitrate transcoding
  - Multi-destination RTMP push
  - Recording
  - HLS/WebRTC playback

### WebRTCAppEE
- **Path:** /WebRTCAppEE
- **Purpose:** WebRTC-specific features
- **Features:** Enterprise WebRTC capabilities

### live
- **Path:** /live
- **Purpose:** Additional streaming application

## Current Configuration

### Active Stream
- **Application:** LiveApp
- **Input:** SRT from hardware encoder
- **Output:** RTMP to CASTR
- **CASTR Endpoint:** rtmp://au.castr.io:1935/static/live_81c06b509f1b11f0a5db8fcec287313a?password=b97f45f7

### Stream Flow
```
Hardware Encoder (SRT)
    ↓
Ant Media Server (Port 4200)
    ↓ (Transcoding/Processing)
    ↓
CASTR (RTMP Push)
    ↓
YouTube/Facebook/Other Platforms
```

## Enterprise Features Available

### 1. Adaptive Bitrate Streaming (ABR)
- Automatically creates multiple quality levels
- Viewers get best quality for their bandwidth
- Reduces buffering

### 2. Multi-Destination Streaming (Simulcast)
- Push to unlimited RTMP endpoints simultaneously
- YouTube, Facebook, Twitch, custom servers
- Per-stream endpoint configuration

### 3. Advanced Transcoding
- H.264/H.265 codec support
- GPU acceleration support (NVIDIA)
- Custom resolution/bitrate profiles

### 4. Recording
- Record streams to MP4/WebM
- Automatic or manual recording
- S3 integration available

### 5. Ultra-Low Latency
- WebRTC playback (~0.5 seconds)
- SRT input (configurable latency)
- CMAF-LL support

### 6. Clustering & Scaling
- Origin-edge architecture
- Load balancing
- Geographic distribution

### 7. Security
- Token-based authentication
- Time-based one-time passwords
- IP filtering
- HTTPS/SSL support

### 8. Advanced Analytics
- Real-time viewer statistics
- Bandwidth monitoring
- Stream health metrics
- Historical data

## Management Commands

### Service Control
```bash
# Check status
systemctl status antmedia

# Restart service
systemctl restart antmedia

# Stop service
systemctl stop antmedia

# Start service
systemctl start antmedia

# View logs
journalctl -u antmedia -f
```

### Application Logs
```bash
# Live tail
tail -f /usr/local/antmedia/log/ant-media-server.log

# Error logs
tail -f /usr/local/antmedia/log/antmedia-error.log
```

## Adding RTMP Endpoints

### Via Dashboard
1. Go to LiveApp → Streams
2. Click on your stream
3. Find "RTMP Endpoints" section
4. Click "Add Endpoint"
5. Enter RTMP URL in format: `rtmp://server:1935/app/streamkey`

### Common Platform Formats

#### YouTube Live
```
rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY
```

#### Facebook Live
```
rtmp://live-api-s.facebook.com:80/rtmp/YOUR_STREAM_KEY
```

#### Twitch
```
rtmp://live.twitch.tv/app/YOUR_STREAM_KEY
```

#### Custom RTMP
```
rtmp://your-server:1935/app/streamid
```

## Hardware Encoder Configuration

### SRT Settings (Example for Pearl, Vidiu, Encoder.io, etc.)
- **Protocol:** SRT Caller (Push)
- **Destination:** 134.199.150.238
- **Port:** 4200
- **Stream ID:** YOUR_STREAM_ID (e.g., channel1)
- **Latency:** 750ms (or higher for unstable networks)
- **Mode:** Caller/Push
- **Passphrase:** (Optional, configure in Ant Media if needed)

### Full SRT URL
```
srt://134.199.150.238:4200?streamid=channel1&latency=750
```

## Performance Considerations

### Current Resources
- **RAM:** 8GB (sufficient for 5-10 transcoded streams)
- **CPU:** 4 vCPUs (sufficient for software encoding)
- **Disk:** 50GB + 100GB (ample for recordings)

### Recommended Limits (4 vCPU, 8GB RAM)
- **Live Streams (No transcoding):** 20-30 simultaneous
- **Live Streams (With ABR transcoding):** 5-10 simultaneous
- **Concurrent Viewers:** 1000+ (with CDN)
- **Recording:** Limited by disk space

### Scaling Options
- Add more CPU for more transcoding
- Add GPU for hardware-accelerated encoding
- Add origin-edge servers for more viewers
- Use CDN for global distribution

## Backup & Recovery

### Important Files
- `/usr/local/antmedia/conf/` - Configuration files
- `/usr/local/antmedia/webapps/LiveApp/streams/` - Stream data
- `/usr/local/antmedia/webapps/LiveApp/streamsList.txt` - Stream list

### Backup Command
```bash
# Backup configuration
tar -czf antmedia-backup-$(date +%Y%m%d).tar.gz /usr/local/antmedia/conf/

# Backup streams data
tar -czf streams-backup-$(date +%Y%m%d).tar.gz /usr/local/antmedia/webapps/
```

## Integration with Existing SRT Relay

### Existing Setup (Preserved)
- **Service:** srt-relay.service
- **Ports:** 20000-20009 (5 relay pairs)
- **Script:** /usr/local/bin/srt-relay.sh
- **Status:** Active and unchanged

### Coexistence
- Ant Media uses port 4200 for SRT
- Existing relay uses ports 20000-20009
- No conflicts between services
- Both can run simultaneously

## Next Steps for Trial Evaluation

### Week 1: Basic Testing
- [ ] Test all hardware encoders with SRT input
- [ ] Configure 3-5 RTMP destinations
- [ ] Test adaptive bitrate streaming
- [ ] Monitor CPU/RAM usage under load
- [ ] Test recording functionality
- [ ] Review stream quality and latency

### Week 2: Advanced Features
- [ ] Test WebRTC playback
- [ ] Configure custom transcoding profiles
- [ ] Test failover scenarios
- [ ] Load test with multiple simultaneous streams
- [ ] Review analytics and monitoring
- [ ] Calculate actual costs vs AWS MediaLive

### Decision Criteria
- **Cost savings:** Compare monthly costs
- **Feature parity:** Match AWS MediaLive features
- **Reliability:** Test uptime and stability
- **Performance:** Latency, quality, throughput
- **Ease of use:** Dashboard vs AWS Console
- **Support:** Community vs Enterprise support options

## Troubleshooting

### Stream Not Starting
```bash
# Check if service is running
systemctl status antmedia

# Check logs for errors
journalctl -u antmedia -n 100

# Verify port is listening
ss -tulpn | grep 4200
```

### RTMP Endpoint Not Connecting
- Verify RTMP URL format
- Check firewall on destination server
- Test RTMP endpoint with ffmpeg:
```bash
ffmpeg -re -i test.mp4 -c copy -f flv rtmp://destination/app/key
```

### High CPU Usage
- Reduce number of transcoding profiles
- Lower resolution/bitrate
- Consider GPU encoding
- Distribute load across multiple servers

### Poor Stream Quality
- Increase encoder bitrate
- Check network bandwidth
- Reduce transcoding quality
- Verify encoder settings

## Support Resources

### Official Documentation
- https://antmedia.io/docs/
- https://github.com/ant-media/Ant-Media-Server/wiki

### Community
- Google Groups: https://groups.google.com/g/ant-media-server
- GitHub Issues: https://github.com/ant-media/Ant-Media-Server/issues

### Enterprise Support
- Email: contact@antmedia.io
- Available with paid license

## License Upgrade Options

After trial, consider:

### Self-Hosted Licenses
- **Monthly:** ~$99/month per server
- **Annual:** ~$999/year per server (2 months free)
- **Triannual:** ~$2,499/3 years per server (20% discount)
- **Perpetual:** One-time payment

### Cloud Marketplace
- **AWS Marketplace:** Hourly billing
- **Azure Marketplace:** Hourly/monthly
- **Google Cloud:** Hourly/monthly
- **Digital Ocean:** Monthly

### Pricing Factors
- Number of servers
- Support level required
- Update frequency needed
- Usage volume

---

**Setup Date:** November 3, 2025
**Trial Period:** 14 days
**Documentation Version:** 1.0
