# Red Corner AWS MediaLive Dashboard

Professional web-based dashboard for managing AWS MediaLive live streaming channels with real-time HLS video monitoring, dynamic HTML5 overlay control, multi-destination streaming, and comprehensive recording/conversion capabilities.

🔒 **Production**: https://dashboard.redcorner.com.au (SSL secured with Let's Encrypt)

## Key Features

### Live Streaming Management
- **5-Channel Support**: Start/stop AWS MediaLive channels with live status monitoring
- **Real-Time HLS Players**: CloudFront-delivered video with automatic stall detection
- **Zero-Cache Protection**: Prevents stale content loops when channels stop (aggressive staleness detection)
- **Dynamic HTML5 Overlays**: Change graphics overlays live without restarting streams
- **Multi-Destination Streaming**:
  - RTMP destinations (YouTube, Facebook Live)
  - SRT destinations via AWS MediaConnect (CASTR)
  - Tab-style selector for easy configuration

### Recording & Post-Production
- **Permanent Archive Recordings**: 30-minute .ts segments stored in S3
- **Dual Output Types**: Preview (raw) and Program (with overlay)
- **Dual Conversion Strategy**:
  - **Quick H.264 MP4**: Ready in ~15-20 minutes for immediate client delivery
  - **HEVC MP4**: High-quality, smaller files ready in ~90 minutes
- **Real-Time Progress Tracking**: Monitor both conversion jobs independently
- **Downloads Management**: Separate tab for converted MP4 files

### Professional UI
- **HTTPS/SSL Secured**: Let's Encrypt certificate with auto-renewal
- **Collapsible Sections**: Cost Monitor, Holding Slide, Stream Destinations, HTML5 Overlays
- **Professional Color Scheme**: Calming blue headings, green (activate) / red (remove) actions
- **Compact Controls**: Space-efficient button styling and tab-based selectors
- **Cost Monitor**: Real-time AWS billing estimates (hourly/daily/weekly)
- **Multiview**: 3x3 grid for production monitoring

### Input Management
- **Holding Slide Upload**: Automatic fallback when input signal lost
- **Thumbnail Preview**: See current holding slide (320x180)
- **Auto-Update**: MediaLive reads from S3 on input loss (no restart needed)

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your AWS credentials and channel IDs

# Start with PM2
pm2 start server.js --name redcorner-dashboard
pm2 save
```

### HTTPS Setup (Production)

For secure production deployment with custom domain:

```bash
# Run automated HTTPS setup script
chmod +x setup-https.sh
sudo ./setup-https.sh dashboard.redcorner.com.au your@email.com

# This will:
# - Configure DNS resolution
# - Install Nginx and Certbot
# - Set up reverse proxy (port 80/443 → 3000)
# - Obtain Let's Encrypt SSL certificate
# - Configure auto-renewal (every 90 days)
```

**DNS Requirements**: Point your domain's A record to your server's static IP before running setup.

### Access

- **Development**: `http://your-ip:3000`
- **Production**: `https://dashboard.redcorner.com.au`

**Default credentials**: Set in `.env` file (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system architecture, AWS service integration, data flow
- **[USER_GUIDE.md](USER_GUIDE.md)** - Operational procedures, troubleshooting, system workflows

## Technology Stack

### Backend
- Node.js + Express
- AWS SDK v3 (MediaLive, MediaConnect, MediaConvert, S3)
- Session-based authentication
- Real-time channel status polling

### Frontend
- Vanilla JavaScript (no frameworks)
- HLS.js for video playback
- Responsive CSS with collapsible sections
- Real-time progress tracking

### AWS Services
- **MediaLive**: Live video encoding with 4 output groups (HLS + Archive)
- **MediaConnect**: SRT destination routing
- **MediaConvert**: Dual conversion strategy (Quick H.264 + HEVC)
- **S3**: Storage for HLS segments, recordings, downloads, holding slides
- **CloudFront**: CDN delivery for live streams

### Infrastructure
- **Nginx**: Reverse proxy with SSL termination
- **Let's Encrypt**: Free SSL certificate with auto-renewal
- **PM2**: Process management with auto-restart

## Setup Requirements

### AWS Resources
- MediaLive channel IDs (up to 5 channels)
- MediaLive channels configured with:
  - Preview output group (HLS)
  - Program output group (HLS with overlay)
  - Archive-preview output group (permanent recordings)
  - Archive-program output group (permanent recordings with overlay)
- S3 bucket with folders: `medialive/`, `recordings/`, `downloads/`, `holding-slides/`
- CloudFront distribution with S3 origin
- MediaConvert endpoint for your region

### IAM Permissions
Dashboard IAM user needs:
- MediaLive: `DescribeChannel`, `StartChannel`, `StopChannel`, `BatchUpdateSchedule`, `CreateInput`, `DeleteInput`
- MediaConnect: `CreateFlow`, `DeleteFlow`, `DescribeFlow`, `UpdateFlow`
- S3: `ListBucket`, `GetObject`, `PutObject`, `DeleteObject`
- MediaConvert: `CreateJob`, `GetJob`, `ListJobs`

MediaLive Role needs:
- S3 write permissions for `medialive/` and `recordings/` folders
- S3 read permissions for `holding-slides/` folder

MediaConvert Role needs:
- S3 read permissions for `recordings/` folder
- S3 write permissions for `downloads/` folder

### Server Requirements
- Ubuntu/Debian Linux (for HTTPS setup script)
- Node.js 16+
- Static IP address
- Domain with DNS management (for SSL)
- Open ports: 80 (HTTP), 443 (HTTPS)

## Key Features Explained

### HLS Staleness Detection

Players monitor stream health to prevent showing cached content:

- **PROGRAM player**: 12-second threshold, 5-second status checks
- **PREVIEW player**: 20-second threshold, 15-second status checks
- **Server verification**: Polls AWS API to confirm channel state
- **Zero blind retries**: Only reconnects when AWS confirms channel is RUNNING
- **Clean offline display**: Shows "No stream available" when channel stops

### Recording Workflow

1. **Automatic**: Archive outputs run continuously when channel is RUNNING
2. **30-minute segments**: Automatically rolled over and saved permanently
3. **Two versions**: Preview (raw) and Program (with overlay)
4. **Stop & Finalize**: Button in dashboard stops channel and completes current segment
5. **No HLS confusion**: Recordings are separate from rolling window HLS segments

### Conversion Workflow

1. Navigate to **Recordings & Downloads** page
2. Find desired `.ts` recording
3. Click **[Convert to MP4]**
4. **Two jobs start**:
   - Quick H.264 MP4 (~15-20 min, `*_quick.mp4`)
   - HEVC MP4 (~90 min, `*.mp4`)
5. Watch real-time progress bars
6. Download from **Downloads tab** when complete

### Overlay Management

- **Live switching**: Change overlay URL without restarting channel
- **Schedule Actions**: Uses MediaLive batch schedule updates
- **Instant activation**: Takes effect on next encoded segment (~6-10 seconds)
- **Preview available**: See overlay in Program output, not in Preview output

## Architecture Highlights

```
Video Input → MediaLive (encode + overlay) → S3 (HLS + recordings)
                                           → CloudFront (CDN delivery)
                                           → Dashboard (playback + control)
                                           → MediaConvert (dual .ts → MP4)
                                           → Downloads (both MP4s ready)
```

**4 Output Groups per Channel**:
1. **preview** - HLS without overlay (rolling window ~3 min)
2. **program** - HLS with overlay (rolling window ~3 min)
3. **archive-preview** - Permanent .ts recordings without overlay (30-min segments)
4. **archive-program** - Permanent .ts recordings with overlay (30-min segments)

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete system diagrams and data flow.

## Troubleshooting

For common issues and solutions, see the [Troubleshooting Guide](USER_GUIDE.md#troubleshooting-guide) in USER_GUIDE.md.

**Quick checks**:
- Channel won't start? Check MediaLive console for errors
- No video in player? Verify CloudFront URL, check browser console
- Conversion stuck? Check MediaConvert console, verify IAM role permissions
- SSL certificate error? Run `sudo certbot renew --dry-run`

## Security Notes

- **Credentials**: Never commit `.env` file (properly in `.gitignore`)
- **Repository**: Keep private to protect AWS account details
- **SSL**: Let's Encrypt certificate auto-renews every 90 days
- **Session auth**: Dashboard secured with username/password
- **Key rotation**: Rotate AWS access keys regularly

### October 2025 Security Incident

AWS access keys were accidentally exposed to public GitHub (Oct 26-29, 2025). Keys were rotated Oct 29, repository made private. See [ARCHITECTURE.md](ARCHITECTURE.md) for full incident details and prevention measures.

## Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| URL | `http://ip:3000` | `https://dashboard.redcorner.com.au` |
| SSL | No | Yes (Let's Encrypt) |
| Reverse Proxy | No | Yes (Nginx) |
| Process Manager | Manual / `node server.js` | PM2 with auto-restart |
| Port | 3000 | 80 (HTTP) + 443 (HTTPS) |

## File Structure

```
redcorner-dashboard/
├── server.js                           # Main Node.js server
├── aws-medialive-manager.js            # AWS SDK wrapper
├── setup-https.sh                      # Automated HTTPS setup script
├── public/
│   ├── dashboard.html                  # Main channel control page
│   ├── dashboard.js                    # Channel control logic
│   ├── dashboard-destinations.js       # RTMP/SRT destination management
│   ├── recordings.html                 # Recordings & Downloads dual tab page
│   ├── player.html                     # HLS player with staleness detection
│   ├── multiview.html                  # 3x3 production monitor grid
│   └── styles.css                      # Professional UI styling
├── ARCHITECTURE.md                     # Complete system architecture
├── USER_GUIDE.md                       # User manual + troubleshooting
└── README.md                           # This file
```

## Production Status

- **Channel 1**: Fully configured and operational
- **Channels 2-5**: Not yet configured (channel IDs not set)
- **HTTPS**: Active with auto-renewal
- **Domain**: dashboard.redcorner.com.au (A record → 15.134.99.64)

## License

MIT

## Support

For issues, feature requests, or questions:
1. Check [USER_GUIDE.md](USER_GUIDE.md) troubleshooting section
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system behavior
3. Check AWS console for service-specific errors

---

**Created**: October 2025
**Status**: Production-ready with SSL
**Last Updated**: October 30, 2025
