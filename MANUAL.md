# **Red Corner AWS MediaLive Dashboard**
## Complete System Manual

**Version:** 2.0
**Last Updated:** November 3, 2025
**System Status:** Production Ready with Deep Hibernation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started](#2-getting-started)
3. [Dashboard Features](#3-dashboard-features)
4. [Recording & Downloads](#4-recording--downloads)
5. [Cost Management](#5-cost-management)
6. [Deep Hibernation System](#6-deep-hibernation-system)
7. [Technical Architecture](#7-technical-architecture)
8. [Troubleshooting](#8-troubleshooting)
9. [AWS Cost Comparison](#9-aws-cost-comparison)
10. [Security & Maintenance](#10-security--maintenance)

---

## 1. System Overview

### What This System Does

The Red Corner AWS MediaLive Dashboard is a professional live streaming platform that provides:

- **Live Video Encoding** - Broadcast quality HD video with AWS MediaLive
- **Dual HLS Outputs** - Preview (raw input) and Program (with overlay)
- **Dynamic HTML5 Overlays** - Live scoreboard/graphics switching without restarting
- **Multiple Destinations** - Stream to YouTube, Facebook, custom RTMP/SRT endpoints
- **Permanent Recordings** - 30-minute archive segments with Enhanced VQ quality
- **Dual MP4 Conversion** - Quick H.264 (15-20 min) + HEVC quality (90 min)
- **Cost Monitoring** - Real-time AWS cost tracking and alerts
- **Deep Hibernation** - Reduce costs from $4,080/month to $3-8/month during off-season

### Access Information

- **URL:** https://dashboard.redcorner.com.au
- **Login:** Secure authentication with username/password
- **SSL:** Let's Encrypt certificate (auto-renews every 90 days)
- **Hosting:** AWS Lightsail (Static IP: 15.134.99.64)

### Key URLs

- **Main Dashboard:** https://dashboard.redcorner.com.au/dashboard.html
- **Recordings & Downloads:** https://dashboard.redcorner.com.au/recordings.html
- **Multiview:** https://dashboard.redcorner.com.au/multiview.html
- **Player:** https://dashboard.redcorner.com.au/player.html?channel=1

---

## 2. Getting Started

### First Time Setup

1. **Log in** to https://dashboard.redcorner.com.au
2. **Navigate** to Dashboard page
3. **Start Channel 1** by clicking the green "Start Channel" button
4. **Wait** 30-60 seconds for channel to reach "RUNNING" state
5. **Begin streaming** your video source (RTMP/SRT)

### Starting a Live Stream

**Step 1: Start the MediaLive Channel**

1. Go to Dashboard page
2. Locate Channel 1 card
3. Click **"Start Channel"** (green button)
4. Status will change: IDLE → STARTING → RUNNING
5. Wait for **"RUNNING"** status (usually 30-60 seconds)

**Step 2: Connect Your Video Source**

Choose your input method:

- **RTMP Push:** Use the RTMP URL shown in channel card
- **SRT (via MediaConnect):** Click "Add Destination" → Select "SRT" → Enter destination details

**Step 3: Verify Stream**

- Click **"View Preview"** to watch raw input
- Click **"View Program"** to watch with overlay
- Both streams appear in embedded HLS players

### Adding Overlays

**To activate an overlay:**

1. Expand **"HTML5 Overlays"** section
2. Enter overlay URL (e.g., `https://yoursite.com/scoreboard.html`)
3. Click **"Activate Overlay"**
4. Overlay appears on Program output immediately (no channel restart!)

**To remove overlay:**

1. Click **"Deactivate Overlay"** button
2. Program output returns to raw video

### Adding Stream Destinations

**RTMP Destinations (YouTube, Facebook):**

1. Expand **"Stream Destinations"** section
2. Click **"Add RTMP"** tab
3. Enter destination details:
   - Name: "YouTube Live"
   - URL: `rtmp://a.rtmp.youtube.com/live2`
   - Stream Key: Your YouTube stream key
4. Click **"Add Destination"**
5. Destination activates immediately

**SRT Destinations (CASTR, etc.):**

1. Click **"Add SRT"** tab
2. Enter destination details:
   - Name: "CASTR"
   - URL: `srt://castr.io:1234`
   - Stream ID: Your stream ID
   - Passphrase (if required)
3. Click **"Add Destination"**
4. System creates MediaConnect flow automatically

**To remove a destination:**

- Click **"Remove"** button next to destination
- MediaConnect flows auto-delete when channel stops

---

## 3. Dashboard Features

### Channel Control Card

Each channel card shows:

- **Channel Name:** "Channel 1" (customizable)
- **Status Badge:** IDLE (gray) / STARTING (yellow) / RUNNING (green) / STOPPING (orange)
- **Input Type:** RTMP Push / MediaConnect / RTP
- **Running Time:** Hours:Minutes since start
- **Current Cost:** Hourly rate and total accumulated
- **Control Buttons:**
  - **Start Channel** (green) - Starts MediaLive channel
  - **Stop Channel** (red) - Stops channel and finalizes recording
  - **View Preview** (blue) - Opens raw input stream
  - **View Program** (blue) - Opens overlay stream

### Cost Monitor Section

**Real-time cost tracking:**

- **Channel Status:** Running/Idle count
- **Current Hourly Rate:** $5.67/hr per running channel
- **Daily Cost:** Based on current usage
- **Weekly Projected Cost:** Extrapolated from current rate

**How costs are calculated:**

- **Running channel:** $5.67/hour
  - Input (HD HEVC): $0.5832/hr
  - Motion Graphics (50%): $0.7085/hr
  - Preview HLS: $0.8748/hr
  - Program HLS: $0.8748/hr
  - Program Recording (Enhanced VQ): $2.6244/hr

- **Idle channel:** $0.04/hour
  - Input idle: $0.01/hr
  - 3 outputs idle: $0.03/hr

- **MediaConnect flow:** $0.045/hour (when SRT active)

### Holding Slide Section

**Purpose:** Image shown when video source drops

**To upload a holding slide:**

1. Expand **"Holding Slide"** section
2. Click **"Choose File"**
3. Select PNG/JPG image (max 10MB, recommended 1920×1080)
4. Click **"Upload"**
5. Thumbnail preview appears
6. S3 path shown: `s3://bucket/holding-slides/holding-slide.png`

**How it works:**

- MediaLive detects input loss
- Automatically switches to holding slide
- Returns to live video when source reconnects
- No channel restart needed

---

## 4. Recording & Downloads

### Recordings Tab

**What you see:**

- **Channel sections** (1-5)
- **Recording status** - "● Recording in progress..." (only when channel running)
- **Stop & Finalize Recording** button (only when channel running)
- **.ts archive files** listed by date/size

**File information:**

- **Type:** PGM (Program with overlay)
- **Format:** .ts (MPEG Transport Stream)
- **Size:** ~4.9GB per 30-minute segment
- **Quality:** Enhanced VQ (high quality)
- **Naming:** `_1.000000_Ch1_PGM_Recording_Thu_Oct_30_2025.ts`

**Actions per recording:**

1. **Download .ts** - Downloads original transport stream file
2. **Convert to MP4** - Starts DUAL conversion (Quick H.264 + HEVC)
3. **Delete** - Removes file from S3 permanently

### Converting to MP4

**When you click "Convert to MP4":**

Two MediaConvert jobs start simultaneously:

**Job 1: Quick H.264 Conversion**
- **Time:** ~15-20 minutes for 30-min recording
- **Output:** `*_quick.mp4` (~2.5GB)
- **Codec:** H.264 (widely compatible)
- **Quality:** Good (QVBR 7)
- **Use case:** Immediate client delivery

**Job 2: HEVC Quality Conversion**
- **Time:** ~90 minutes for 30-min recording
- **Output:** `*.mp4` (~1.2GB, 50% smaller!)
- **Codec:** H.265/HEVC (superior compression)
- **Quality:** High (QVBR 8)
- **Use case:** Archival, distribution

**Progress tracking:**

- Real-time progress bars for both jobs
- Updates every 5 seconds
- Shows percentage and status
- Both files appear in Downloads tab when complete

### Downloads Tab

**What you see:**

- Converted MP4 files from both jobs
- Custom display names (e.g., "Ch1_PGM_Thu_Oct_30.mp4")
- File size and codec type (H.264/HEVC)
- Date converted

**Actions per download:**

1. **Download MP4** - Forces download to your laptop (doesn't open in browser)
2. **Delete** - Removes file from S3 permanently

### Recording Settings

**To customize recording filenames:**

1. Go to Recordings & Downloads page
2. Expand **"Recording Settings"** section
3. Select channel (1-5)
4. Enter custom prefix (e.g., "Ch1_PGM")
5. Click **"Save Settings"**

**Display name format:**
- `{Prefix}_{DayOfWeek}_{Month}_{Day}.mp4`
- Example: `Ch1_PGM_Thu_Oct_30.mp4`

---

## 5. Cost Management

### Real-Time Cost Tracking

**Built-in dashboard monitor:**

- Collapsible "Cost Monitor" section
- Shows running/idle channel count
- Displays hourly, daily, weekly costs
- Updates in real-time

### Command-Line Cost Checker

**To check costs manually:**

```bash
cd /home/ubuntu/redcorner-dashboard
node check-costs.js
```

**Output shows:**

- All MediaLive channels (with state and running time)
- All MediaConnect flows
- Current hourly rate
- Daily/weekly/monthly projections
- Cost breakdown per service

### Email/SMS Cost Alerts

**Automated monitoring with cost-alert-monitor.js:**

**Alert conditions:**

- Hourly cost > $6/hr per channel
- Any channel running > 8 hours
- Unexpected idle costs > $1/hr

**How to set up:**

1. Edit `cost-alert-monitor.js`
2. Configure email/SMS settings (AWS SNS or SendGrid)
3. Set up cron job:

```bash
crontab -e
# Add line:
0 * * * * cd /home/ubuntu/redcorner-dashboard && node cost-alert-monitor.js
```

**Alert frequency:** Every hour

---

## 6. Deep Hibernation System

### Why Use Hibernation?

**Problem:** Off-season months with zero usage still cost $35+/month

**Solution:** Deep hibernation reduces to $3-8/month

### Cost Comparison

| State | MediaLive | Lightsail | S3 | Total/Month |
|-------|-----------|-----------|-----|-------------|
| **Running 24/7** | $4,080 | $10 | $3 | **$4,093** |
| **Awake (idle)** | $29 | $10 | $3 | **$42** |
| **Hibernated** | $0 | $5 | $3 | **$8** |
| **Deep Hibernated** | $0 | $3 | $3 | **$6** |

**Savings:** $35/month → $6/month = **$29/month saved** during off-season

### How to Hibernate

**Step 1: Run hibernate.sh script**

```bash
cd /home/ubuntu/redcorner-dashboard
./hibernate.sh
```

**What it does:**

1. ✅ Checks and deletes MediaConnect flows
2. ✅ Stops all MediaLive channels
3. ✅ Exports config to `hibernation-backup.txt`
4. ✅ Shows instructions for stopping Lightsail

**Step 2: Stop Lightsail instance**

1. Go to AWS Lightsail console
2. Find your instance (dashboard.redcorner.com.au)
3. **Optional:** Create snapshot first (recommended for first time)
   - Click "Snapshots" tab
   - Click "Create snapshot"
   - Name it: `pre-hibernation-2025-11-03`
4. Click **"Stop"** (not Delete!)
5. Confirm stop

**Step 3: Optional - Delete MediaLive channels**

**Extra $29/month savings:**

```bash
# Before stopping Lightsail, run:
cd /home/ubuntu/redcorner-dashboard
node -e "
const { MediaLiveClient, DeleteChannelCommand } = require('@aws-sdk/client-medialive');
require('dotenv').config();
const client = new MediaLiveClient({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }});
(async () => {
  await client.send(new DeleteChannelCommand({ ChannelId: process.env.CHANNEL_1_ID }));
  console.log('Channel 1 deleted');
})();
"
```

**⚠️ Warning:** You'll need to recreate channel when waking up

### How to Wake Up

**Step 1: Start Lightsail instance**

1. Go to AWS Lightsail console
2. Select your stopped instance
3. Click **"Start"**
4. Wait 1-2 minutes for boot

**Step 2: Run wakeup.sh script**

```bash
cd /home/ubuntu/redcorner-dashboard
./wakeup.sh
```

**What it does:**

1. ✅ Checks Lightsail status
2. ✅ Verifies MediaLive channels exist
3. ✅ Starts PM2 dashboard process
4. ✅ Shows system status and current costs
5. ✅ Provides next steps

**Step 3: Test the system**

1. Go to https://dashboard.redcorner.com.au
2. Start Channel 1
3. Verify stream works
4. Check cost monitor

### Hibernation Duration

**Safe to hibernate for:**

- Days, weeks, or months
- No time limit
- S3 recordings are safe
- Configuration preserved in `.env`

**What's preserved:**

- ✅ All S3 recordings (.ts and .mp4 files)
- ✅ Holding slide images
- ✅ Dashboard configuration
- ✅ MediaLive channel configuration (if not deleted)
- ✅ Lightsail static IP
- ✅ SSL certificates

**What's lost:**

- ❌ Active MediaConnect flows (recreated on demand)
- ❌ Scheduled overlays (not commonly used)

---

## 7. Technical Architecture

### Video Flow

```
Video Source (RTMP/SRT)
    ↓
MediaConnect (optional, for SRT)
    ↓
MediaLive (encoding + overlay + outputs)
    ↓
S3 Bucket (storage)
    ↓
CloudFront CDN (delivery)
    ↓
Dashboard Players (HLS playback)
```

### MediaLive Channel Configuration

**Channel 1 has 3 output groups:**

1. **"preview"** - HLS Output (raw input, no overlay)
   - Live streaming playlist
   - Rolling window (~3 minutes)
   - Cost: $0.8748/hr

2. **"program"** - HLS Output (with HTML5 overlay)
   - Live streaming playlist
   - Dynamic overlay switching
   - Rolling window (~3 minutes)
   - Cost: $0.8748/hr

3. **"program-recording"** - Archive Output (permanent storage)
   - 30-minute .ts segments
   - Enhanced VQ quality
   - Kept permanently
   - Cost: $2.6244/hr

### S3 Bucket Structure

**Bucket:** `redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o`

```
medialive/
└── channel1/
    ├── preview_1.m3u8          (live playlist)
    ├── program_1.m3u8          (live playlist)
    └── *.ts segments           (rolling window, auto-deleted)

recordings/
└── channel1/
    └── program/
        ├── _1.000000_Ch1_PGM_Recording_*.ts    (permanent)
        ├── _1.000000_Ch1_PGM_Recording_*.mp4   (converted HEVC)
        └── _1.000000_Ch1_PGM_Recording_*_quick.mp4  (converted H.264)

holding-slides/
└── holding-slide.png           (input loss fallback)
```

### CloudFront CDN

**Domain:** `d2njmhq33zb6p4.cloudfront.net`

**Live stream URLs:**
- Preview: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/preview_1.m3u8`
- Program: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/program_1.m3u8`

**Purpose:** Low-latency global HLS delivery

### Server Infrastructure

**Lightsail Instance:**
- Static IP: 15.134.99.64
- Domain: dashboard.redcorner.com.au
- OS: Ubuntu Linux
- Nginx reverse proxy (ports 80/443)
- Node.js application (port 3000)
- PM2 process manager
- Let's Encrypt SSL certificate

**Dashboard Application:**
- Backend: Node.js + Express
- Frontend: HTML/CSS/JavaScript
- HLS Player: Video.js library
- Authentication: Session-based
- AWS SDK: MediaLive, MediaConnect, S3, MediaConvert

---

## 8. Troubleshooting

### Channel Won't Start

**Symptoms:**
- Click "Start Channel" but stays IDLE
- Error message appears

**Solutions:**

1. **Check AWS credentials:**
   ```bash
   cd /home/ubuntu/redcorner-dashboard
   cat .env | grep AWS_
   ```
   Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set

2. **Verify channel exists:**
   ```bash
   node check-costs.js
   ```
   Should show Channel 1 in output

3. **Check IAM permissions:**
   - User `redcorner-medialive` needs MediaLive start/stop permissions
   - Check AWS IAM console

4. **View server logs:**
   ```bash
   pm2 logs dashboard
   ```

### Stream Shows "No stream available"

**Symptoms:**
- HLS player shows offline pattern
- Channel is RUNNING but no video

**Solutions:**

1. **Verify video source is streaming:**
   - Check your encoder (OBS, vMix, etc.)
   - Confirm RTMP URL is correct
   - Test with different encoder

2. **Check input loss:**
   - Look at holding slide - if showing, input is lost
   - Fix video source connection

3. **Wait for HLS generation:**
   - First segments take 30-60 seconds after channel starts
   - Be patient!

4. **Check S3 for .ts files:**
   ```bash
   node find-mp4-files.js
   ```
   Should show recent .ts files in `medialive/channel1/`

### Recording Not Appearing

**Symptoms:**
- Recording ran for hours but no .ts files in Recordings tab

**Solutions:**

1. **Check correct S3 location:**
   - Recordings save to `recordings/channel1/program/`
   - Dashboard searches this location automatically

2. **Verify S3_BUCKET in .env:**
   ```bash
   cat .env | grep S3_BUCKET
   ```
   Should show: `redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o`

3. **Check AWS S3 console directly:**
   - Go to S3 bucket
   - Navigate to `recordings/channel1/program/`
   - Look for .ts files

4. **Verify archive output is configured:**
   - Check MediaLive console
   - Channel 1 should have "program-recording" output group

### MP4 Conversion Stuck

**Symptoms:**
- Progress bar stuck at 0% or low percentage
- Job started hours ago

**Solutions:**

1. **Check MediaConvert job status:**
   ```bash
   node -e "
   const { MediaConvertClient, ListJobsCommand } = require('@aws-sdk/client-mediaconvert');
   require('dotenv').config();
   const client = new MediaConvertClient({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }, endpoint: process.env.MEDIACONVERT_ENDPOINT });
   (async () => { const r = await client.send(new ListJobsCommand({ MaxResults: 10, Status: 'PROGRESSING' })); console.log(JSON.stringify(r.Jobs, null, 2)); })();
   "
   ```

2. **Check for errors:**
   - Look in MediaConvert console (AWS)
   - Check job error messages

3. **Cancel and restart:**
   - Delete stuck job in MediaConvert console
   - Click "Convert to MP4" again in dashboard

### Download Opens in Browser Instead of Saving

**Symptoms:**
- Click "Download MP4" but video plays in browser

**Solutions:**

1. **This was fixed** in latest version (Nov 3, 2025)
2. **If still happening:**
   - Check server.js has `ResponseContentDisposition` header
   - Update code from GitHub
   - Restart dashboard: `pm2 restart dashboard`

3. **Workaround:**
   - Right-click video in browser
   - Select "Save Video As..."

### Browser Shows Translation Prompt

**Symptoms:**
- Opening multiview prompts "Translate this page?"

**Solutions:**

1. **This was fixed** in latest version (Nov 3, 2025)
2. **If still happening:**
   - Update `multiview.html` from GitHub
   - Hard refresh browser (Ctrl+Shift+R)

### High Costs Unexpectedly

**Symptoms:**
- Cost monitor shows > $10/hr
- Multiple channels running unintentionally

**Solutions:**

1. **Check running channels:**
   ```bash
   node check-costs.js
   ```

2. **Stop all channels:**
   - Go to Dashboard page
   - Click "Stop Channel" on all running channels

3. **Check for rogue MediaConnect flows:**
   ```bash
   ./hibernate.sh
   ```
   This will delete any leftover flows

4. **Set up cost alerts:**
   - Configure `cost-alert-monitor.js`
   - Set up hourly cron job

---

## 9. AWS Cost Comparison

### Previous Solution: CloudMix

**September 2025 CloudMix Bill:**

- Standard Server: 263 hours × $12/hr = **$3,156 USD**
- Encode Minutes: 16,617 min × $0.01 AUD = $166.17 AUD
- Storage: 2,457 GB × $0.025 USD = $61.43 USD
- Data Transfer: 14 GB × $0.05 USD = $0.70 USD
- **Total:** **$3,218 USD + $166 AUD**

**CloudMix Costs:**
- **Per hour:** $12 USD
- **Per day (8.7 hrs):** $104 USD
- **Per month (263 hrs):** $3,156 USD

### Current Solution: AWS MediaLive

**For Same 263 Hours:**

- 263 hours × $5.67/hr = **$1,491 USD**
- **Monthly savings: $1,665 USD (52% cheaper)**

**AWS MediaLive Costs:**
- **Per hour:** $5.67 USD
- **Per day (8.7 hrs):** $49 USD
- **Per month (263 hrs):** $1,491 USD

### Future Option: Ant Media Server

**14-day trial available** (testing in progress)

**Potential benefits:**
- Self-hosted (no per-hour encoding costs)
- One-time license cost
- Could save $4,000+/month vs AWS

**Current approach:**
- Complete AWS system first ✅
- Test Ant Media during trial period
- Keep AWS as fallback if Ant Media doesn't work
- Custom overlay scoreboard system works with both

### Cost Summary Table

| Solution | Hourly | 263 hrs/month | 24/7 Usage | Notes |
|----------|--------|---------------|------------|-------|
| **CloudMix** | $12.00 | $3,156 | $8,640/mo | Previous solution |
| **AWS MediaLive** | $5.67 | $1,491 | $4,080/mo | Current (52% cheaper) |
| **AWS Hibernated** | $0.00 | $8 | $8/mo | Off-season mode |
| **Ant Media** | TBD | TBD | TBD | Testing in progress |

**Best strategy:**
- Use AWS MediaLive during season ($1,491/month for 263 hours)
- Hibernate during off-season ($8/month)
- Test Ant Media as potential permanent replacement

---

## 10. Security & Maintenance

### SSL Certificate

**Provider:** Let's Encrypt (free, trusted CA)

**Auto-renewal:**
- Certbot handles automatic renewal
- Renews at 60 days (expires at 90 days)
- No manual intervention needed

**Location:** `/etc/letsencrypt/live/dashboard.redcorner.com.au/`

**To check status:**
```bash
sudo certbot certificates
```

**To manually renew (if needed):**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### AWS Credentials Security

**October 2025 Security Incident:**

- **What happened:** AWS keys accidentally exposed in public GitHub repo (Oct 26-29)
- **Resolution:** Keys rotated Oct 29, repository made private, AWS support case closed
- **Impact:** No unauthorized usage detected

**Current security measures:**

1. **.env file in .gitignore** ✅
2. **Repository is private** ✅
3. **Keys rotated** ✅ (Oct 29, 2025)
4. **Regular key rotation** recommended every 90 days

**To verify repository privacy:**

1. Go to: https://github.com/RedCornerPromotions/redcorner-dashboard/settings
2. Check "Danger Zone" section
3. Should show: "This repository is currently **private**"

**To rotate AWS keys:**

1. Go to AWS IAM console
2. Find user `redcorner-medialive`
3. Create new access key
4. Update `.env` file on Lightsail
5. Restart dashboard: `pm2 restart dashboard`
6. Delete old access key

### Backup Strategy

**What's backed up automatically:**

- ✅ S3 recordings (permanent, redundant storage)
- ✅ S3 holding slides
- ✅ Configuration in `.env`

**What you should backup manually:**

- `.env` file (contains all credentials and config)
- `recording-settings.json` (custom filename prefixes)
- `hibernation-backup.txt` (created by hibernate.sh)

**Recommended backup frequency:**

- Before making configuration changes
- Before hibernation
- After adding new channels
- Monthly (automated)

**How to backup:**

```bash
# SSH into Lightsail
cd /home/ubuntu/redcorner-dashboard

# Create backup archive
tar -czf backup-$(date +%Y%m%d).tar.gz .env recording-settings.json

# Download to your laptop
# (use FileZilla or scp)
```

### Dashboard Updates

**To update dashboard code:**

```bash
cd /home/ubuntu/redcorner-dashboard
git pull origin claude/continue-frozen-session-011CUcdFCDbv43dpXPQoUgYS
npm install  # if package.json changed
pm2 restart dashboard
```

**To view current version:**
```bash
git log -1
```

### Server Maintenance

**Check dashboard status:**
```bash
pm2 status
```

**View logs:**
```bash
pm2 logs dashboard
```

**Restart dashboard:**
```bash
pm2 restart dashboard
```

**Check disk space:**
```bash
df -h
```

**Check Nginx:**
```bash
sudo systemctl status nginx
```

**Check SSL expiry:**
```bash
sudo certbot certificates
```

---

## Appendix: Quick Reference

### Common Commands

```bash
# Cost checking
node check-costs.js

# Find MP4 files
node find-mp4-files.js

# Hibernate system
./hibernate.sh

# Wake up system
./wakeup.sh

# Dashboard management
pm2 status
pm2 logs dashboard
pm2 restart dashboard

# Nginx
sudo systemctl status nginx
sudo systemctl reload nginx

# SSL certificates
sudo certbot certificates
sudo certbot renew
```

### AWS Services Used

- **MediaLive** - Live video encoding
- **MediaConnect** - SRT flow management
- **MediaConvert** - MP4 conversion
- **S3** - Object storage
- **CloudFront** - CDN delivery
- **Lightsail** - Server hosting
- **IAM** - Access management

### Important File Paths

- **Dashboard:** `/home/ubuntu/redcorner-dashboard/`
- **Configuration:** `/home/ubuntu/redcorner-dashboard/.env`
- **Recording Settings:** `/home/ubuntu/redcorner-dashboard/recording-settings.json`
- **Hibernate Backup:** `/home/ubuntu/redcorner-dashboard/hibernation-backup.txt`
- **Nginx Config:** `/etc/nginx/sites-available/default`
- **SSL Certificates:** `/etc/letsencrypt/live/dashboard.redcorner.com.au/`

### Support Resources

- **GitHub Repository:** https://github.com/RedCornerPromotions/redcorner-dashboard
- **AWS Support:** https://console.aws.amazon.com/support/
- **Architecture Doc:** `/home/ubuntu/redcorner-dashboard/ARCHITECTURE.md`
- **Hibernation Guide:** `/home/ubuntu/redcorner-dashboard/HIBERNATION_GUIDE.md`

---

**End of Manual**

**Document Version:** 2.0
**Created:** November 3, 2025
**Format:** PDF-ready Markdown
**Total Pages:** ~15 pages when printed

---
