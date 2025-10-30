# Red Corner Dashboard - User Guide

**Version**: 1.0
**Last Updated**: October 30, 2025
**Dashboard URL**: https://dashboard.redcorner.com.au

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Starting a Live Stream](#starting-a-live-stream)
4. [Managing Stream Destinations](#managing-stream-destinations)
5. [Managing HTML5 Overlays](#managing-html5-overlays)
6. [Recording Management](#recording-management)
7. [Converting Recordings to MP4](#converting-recordings-to-mp4)
8. [Holding Slide Setup](#holding-slide-setup)
9. [Monitoring Costs](#monitoring-costs)
10. [Complete System Flow](#complete-system-flow)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## Getting Started

### Accessing the Dashboard

1. **Open your web browser** (Chrome, Firefox, or Safari recommended)
2. **Navigate to**: `https://dashboard.redcorner.com.au`
3. **You should see a green padlock** 🔒 indicating secure connection
4. **Enter your credentials**:
   - Username: `[provided by admin]`
   - Password: `[provided by admin]`
5. **Click "Login"**

**✅ Security Note**: If you see a certificate warning, DO NOT PROCEED. Contact your system administrator.

---

## Dashboard Overview

Once logged in, you'll see:

### Main Sections

1. **Cost Monitor** (Collapsible)
   - Shows running channels and hourly/daily/weekly costs
   - Click header to expand/collapse

2. **Holding Slide** (Collapsible)
   - Upload fallback image for when source feed drops
   - Click header to expand/collapse

3. **Channel Cards** (1-5)
   - Each channel has its own card with:
     - Channel status (IDLE, RUNNING, STARTING, STOPPING)
     - Start/Stop buttons
     - Program video player (live preview)
     - Stream Destination section (collapsible)
     - HTML5 Overlay section (collapsible)

### Navigation Buttons (Top)

- **OPEN MULTIVIEW**: View all channels simultaneously
- **RECORDINGS & DOWNLOADS**: Access recorded content
- **Logout**: End your session

---

## Starting a Live Stream

### Prerequisites

Before starting a channel, ensure:
1. ✅ Video source is ready (RTMP feed, camera, etc.)
2. ✅ Destination is configured (YouTube, Facebook, CASTR, etc.)
3. ✅ Channel status shows "IDLE"

### Step-by-Step: Starting Channel 1

1. **Locate Channel 1 card** on the dashboard
2. **Check status badge** - should show "IDLE" (blue)
3. **Click "Start Channel" button**
4. **Confirm the prompt**:
   ```
   Start Channel 1?
   This will begin AWS MediaLive billing at ~$4/hour.
   ```
5. **Wait for channel to start** (~30-45 seconds)
   - Button shows "Starting..."
   - Status changes to "STARTING" (yellow)
6. **Channel is RUNNING** when:
   - Status shows "RUNNING" (green)
   - Video appears in Program Output player
   - Stop Channel button becomes active

### What Happens When You Start a Channel?

- AWS MediaLive encoder starts
- Begins outputting HLS stream to S3
- Starts recording to archive (30-min segments)
- Pushes to configured destinations (YouTube, Facebook, etc.)
- Applies HTML5 overlay if configured
- **Billing starts at ~$4/hour**

---

## Managing Stream Destinations

Stream destinations are where your video goes (YouTube, Facebook, CASTR, etc.).

### Configuring RTMP Destination (YouTube/Facebook)

1. **Expand "Stream Destination"** section (click header)
2. **Select "RTMP (YouTube, Facebook)" tab**
3. **Use Quick Fill (optional)**:
   - Click "YouTube" to pre-fill YouTube RTMP URL
   - Click "Facebook" to pre-fill Facebook RTMP URL
4. **Enter details**:
   - **RTMP URL**: e.g., `rtmp://a.rtmp.youtube.com/live2`
   - **Stream Key**: Your unique stream key from YouTube/Facebook
   - **Destination Name**: e.g., "YouTube Live"
5. **Click "Configure RTMP"**
6. **Wait for confirmation**: Green indicator shows "✓ Configured"

### Configuring SRT Destination (CASTR)

1. **Expand "Stream Destination"** section
2. **Select "SRT (CASTR)" tab**
3. **Use Quick Fill (optional)**:
   - Click "CASTR SRT" to pre-fill CASTR details
4. **Enter details**:
   - **SRT URL**: e.g., `srt://au.castr.io:9998`
   - **Stream ID**: Your CASTR stream ID (long string with password)
   - **Destination Name**: e.g., "CASTR"
5. **Click "Configure SRT"**
6. **Wait for configuration**: Takes ~60-90 seconds (creates MediaConnect flow)

### Important Notes

- ⚠️ **Configure destinations BEFORE starting the channel**
- ⚠️ **Channel must be IDLE to change destinations**
- 🔴 **To change destination**: Click "Remove All Destinations" → Reconfigure → Start channel

---

## Managing HTML5 Overlays

HTML5 overlays add graphics on top of your video (scoreboards, lower thirds, etc.).

### Activating an Overlay

1. **Expand "HTML5 Overlay (Live Switching)"** section
2. **Enter overlay URL**:
   - Example: `https://ligr.live/overlay/your-overlay-id`
3. **Click "Activate Overlay"** (green button)
4. **Overlay applies within 5-10 seconds**
   - ✅ No channel restart needed
   - ✅ Works while channel is RUNNING

### Changing Overlays (Live Switching)

You can change overlays while streaming:

1. **Enter NEW overlay URL**
2. **Click "Activate Overlay"** again
3. **New overlay appears within 5-10 seconds**
4. **Perfect for**: Switching between different games/events

### Removing an Overlay

1. **Click "Remove Overlay"** (red button)
2. **Overlay disappears within 5-10 seconds**
3. **Stream continues without overlay**

### Notes

- 💡 Overlay only affects "Program" output (not Preview)
- 💡 Changes happen via AWS Schedule Actions (no restart)
- 💡 You can switch overlays as many times as needed

---

## Recording Management

All recordings are accessible via **RECORDINGS & DOWNLOADS** button.

### Understanding Recording Types

**Recordings Tab** (Source Files):
- `.ts` files (MPEG-TS format)
- Created automatically when channel runs
- 30-minute segments
- Two types:
  - **PVW (Preview)**: Raw input, no overlay
  - **PGM (Program)**: With overlay applied

**Downloads Tab** (Converted Files):
- `.mp4` files (H.264 or HEVC)
- Created by converting `.ts` files
- Two versions:
  - **Quick**: `*_quick.mp4` (H.264, ready in ~15-20 min)
  - **Quality**: `*.mp4` (HEVC, ready in ~90 min)

### Stopping and Finalizing a Recording

**While channel is RUNNING:**

1. **Go to Recordings & Downloads page**
2. **See "Recording Control" section** (only visible when recording)
3. **Status shows**: "● Recording in progress..." (green)
4. **Click "Stop & Finalize Recording"**
5. **Channel stops** and current 30-min segment finalizes
6. **Recording appears** in Recordings tab within 1-2 minutes

### Downloading a Recording

**From Recordings Tab (source .ts files):**

1. **Locate your recording** (sorted by date, newest first)
2. **Click "Download .ts" button**
3. **File downloads** (large file: ~5GB for 30 minutes)

**From Downloads Tab (converted .mp4 files):**

1. **Switch to Downloads tab**
2. **Locate your converted file**
3. **Click "Download MP4" button**
4. **File downloads** (smaller: ~1-2GB for 30 minutes)

### Deleting Recordings

⚠️ **WARNING: Deletion is permanent!**

1. **Locate the recording**
2. **Click "Delete" button**
3. **Confirm the prompt**
4. **File is permanently removed from S3**

---

## Converting Recordings to MP4

### Why Convert?

- `.ts` files are large and hard to share
- `.mp4` files are smaller and play everywhere
- You get TWO versions: Quick (fast) + Quality (compressed)

### Starting a Conversion

1. **Go to Recordings & Downloads page**
2. **In Recordings tab**, find your `.ts` file
3. **Click "Convert to MP4" button**
4. **Confirm the dual conversion prompt**:
   ```
   Start dual conversion?
   • Quick H.264 MP4 (fast, ready in ~15-20 min)
   • HEVC MP4 (high quality, ready in ~90 min)
   Both will appear in Downloads tab when complete.
   ```
5. **Two conversion jobs start simultaneously**

### Monitoring Conversion Progress

After starting conversion, you'll see:

```
Quick H.264: 23%
HEVC: 8%
```

Progress updates automatically every 5 seconds.

**Typical timeline for 30-minute recording:**
- Quick H.264: 15-20 minutes
- HEVC: 80-90 minutes

### When Conversion Completes

1. **Switch to Downloads tab**
2. **You'll see TWO files**:
   - `Ch1_PGM_Thu_Oct_30_quick.mp4` (~2.5GB, H.264)
   - `Ch1_PGM_Thu_Oct_30.mp4` (~1.2GB, HEVC)
3. **Download whichever you need**:
   - Quick version for immediate client delivery
   - HEVC version for archival/smaller file size

### Notes

- 💡 Both conversions run in parallel (not sequential)
- 💡 You can start multiple conversions at once
- 💡 Conversions continue even if you close the browser
- 💡 Hardware acceleration is enabled for faster processing

---

## Holding Slide Setup

The holding slide appears when your video source drops (camera fails, feed lost, etc.).

### Uploading a Holding Slide

1. **Expand "Holding Slide - Input Loss Fallback"** section
2. **Click "Choose Image" button**
3. **Select your image**:
   - Format: PNG or JPG
   - Recommended size: 1920x1080
   - Max file size: 10MB
4. **Upload starts automatically**
5. **Preview appears** (320x180 thumbnail)
6. **Note the S3 path**: `s3://your-bucket/holding-slides/holding-slide.png`

### Configuring MediaLive to Use Holding Slide

**This is a ONE-TIME setup:**

1. **Go to AWS MediaLive Console**
2. **Select your channel** (e.g., Channel 1)
3. **Click "Edit"**
4. **Find "Input Loss Behavior"** section
5. **Select "Input Loss Image Slate"**
6. **Set "Input Loss Image Slate"** to:
   ```
   s3://your-bucket/holding-slides/holding-slide.png
   ```
7. **Save channel configuration**

### How It Works

- When source feed drops, MediaLive detects input loss
- Automatically switches to holding slide
- Stream continues with holding slide (no black screen)
- When source recovers, switches back automatically

### Updating the Holding Slide

1. **Upload new image** (same process as above)
2. **Overwrites existing holding slide**
3. **MediaLive reads new image** on next input loss
4. **No channel restart needed**

---

## Monitoring Costs

### Cost Monitor Section

**Expand "Cost Monitor"** to see:

- **Running Channels**: Number of active channels
- **Cost/Hour**: Current hourly rate (~$4 per channel)
- **Cost/Day**: Projected daily cost (24 hours)
- **Cost/Week**: Projected weekly cost (7 days)

### AWS MediaLive Pricing (Approximate)

- **Channel Running**: ~$4.00/hour
- **Per 30-min recording**: Included in channel cost
- **MediaConvert conversion**:
  - Quick H.264: ~$0.50 per 30-min video
  - HEVC: ~$1.00 per 30-min video
- **S3 Storage**: ~$0.023 per GB per month
- **CloudFront Delivery**: First 1TB free, then $0.085 per GB

### Cost Optimization Tips

1. **Stop channels when not streaming** (saves $4/hour per channel)
2. **Delete old recordings** you don't need (saves storage costs)
3. **Use Quick H.264 conversion** when quality isn't critical
4. **Monitor "Cost Monitor"** regularly

---

## Complete System Flow

### 1. Pre-Stream Setup

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Configure Destination (YouTube/Facebook/CASTR)          │
│    └─ Channel must be IDLE                                 │
│                                                              │
│ 2. Configure HTML5 Overlay (optional)                      │
│    └─ Enter overlay URL                                    │
│                                                              │
│ 3. Upload Holding Slide (optional, one-time)              │
│    └─ Fallback image for input loss                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Starting Stream

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Start Channel"                                 │
│         ↓                                                    │
│ AWS MediaLive starts encoding (~30-45 seconds)             │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Four output streams begin:                           │   │
│ │                                                       │   │
│ │ 1. HLS Preview → S3 (rolling window, 3 min)         │   │
│ │ 2. HLS Program → S3 (rolling window, 3 min)         │   │
│ │ 3. Archive Preview → S3 (permanent, 30-min segments)│   │
│ │ 4. Archive Program → S3 (permanent, 30-min segments)│   │
│ └─────────────────────────────────────────────────────┘   │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Distribution:                                         │   │
│ │                                                       │   │
│ │ • HLS streams → CloudFront → Dashboard players      │   │
│ │ • RTMP/SRT → External destinations (YouTube, etc.)  │   │
│ │ • Archive recordings → S3 bucket (permanent)        │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Live Streaming (Channel RUNNING)

```
┌─────────────────────────────────────────────────────────────┐
│ Viewers watch:                                              │
│ • YouTube Live                                              │
│ • Facebook Live                                             │
│ • CASTR → Other platforms                                  │
│ • Dashboard players (internal monitoring)                  │
│                                                              │
│ You can:                                                    │
│ • Change HTML5 overlay (live, no restart)                  │
│ • Monitor video in dashboard                               │
│ • Check Cost Monitor                                       │
│                                                              │
│ Behind the scenes:                                          │
│ • 30-min archive segments continuously writing to S3       │
│ • HLS playlists updating every ~6-10 seconds              │
│ • If source drops → Holding slide appears automatically    │
└─────────────────────────────────────────────────────────────┘
```

### 4. Stopping Stream

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Stop & Finalize Recording"                    │
│         ↓                                                    │
│ MediaLive stops encoding                                    │
│         ↓                                                    │
│ Current 30-min segment finalizes                           │
│         ↓                                                    │
│ Channel enters IDLE state                                  │
│         ↓                                                    │
│ AWS billing stops for this channel                         │
│         ↓                                                    │
│ Recording appears in Recordings tab (1-2 minutes)          │
└─────────────────────────────────────────────────────────────┘
```

### 5. Post-Production

```
┌─────────────────────────────────────────────────────────────┐
│ User goes to Recordings & Downloads                         │
│         ↓                                                    │
│ Clicks "Convert to MP4" on recording                       │
│         ↓                                                    │
│ Two AWS MediaConvert jobs start:                           │
│         ↓                                                    │
│ ┌──────────────────────┐  ┌──────────────────────┐        │
│ │ Job 1: Quick H.264   │  │ Job 2: HEVC Quality  │        │
│ │ Time: 15-20 min      │  │ Time: 80-90 min      │        │
│ │ Size: ~2.5GB         │  │ Size: ~1.2GB         │        │
│ │ Codec: H.264         │  │ Codec: H.265/HEVC    │        │
│ │ Quality: Good        │  │ Quality: High        │        │
│ └──────────────────────┘  └──────────────────────┘        │
│         ↓                           ↓                        │
│ Both MP4s appear in Downloads tab when ready               │
│         ↓                                                    │
│ User downloads and shares with clients                      │
└─────────────────────────────────────────────────────────────┘
```

### 6. Player Behavior (Monitoring Live Streams)

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard players monitor stream health:                    │
│                                                              │
│ While Channel RUNNING:                                      │
│ ├─ Server checks channel state every 5 seconds            │
│ ├─ Playlist monitors for new segments every 2 seconds     │
│ └─ If new segments arriving → Play video ✅                │
│                                                              │
│ When Channel STOPS:                                        │
│ ├─ Server detects state != RUNNING (5 sec check)          │
│ │  OR                                                      │
│ ├─ No new segments for 12 seconds (Program player)        │
│ └─ Shows "No stream available" slide                       │
│     └─ Prevents looping cached content ("heist movie")     │
│                                                              │
│ Player polls server every 10 seconds:                      │
│ └─ When channel restarts → Resumes playback automatically  │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Guide

### Issue 1: Channel Won't Start

**Symptom**: Click "Start Channel" but it stays IDLE or shows error.

**Possible Causes & Solutions**:

1. **No destination configured**
   - ✅ Configure RTMP or SRT destination first
   - ✅ Ensure green "✓ Configured" indicator shows

2. **Previous start still processing**
   - ⏱️ Wait 60 seconds, refresh page, try again

3. **AWS MediaLive error**
   - 🔍 Check AWS Console → MediaLive → Channel details for errors
   - 📞 Contact system administrator

---

### Issue 2: No Video in Dashboard Player

**Symptom**: Channel shows RUNNING but player shows "No stream available".

**Check these in order**:

1. **Wait for stream to start**
   - ⏱️ Takes 30-45 seconds after channel starts
   - ⏱️ CloudFront cache takes 10-20 seconds to populate

2. **Check if source is sending video**
   - 🎥 Verify camera/encoder is actually streaming to MediaLive
   - 🔍 Check MediaLive input metrics in AWS Console

3. **Check browser console for errors**
   - Press F12 → Console tab
   - Look for HLS errors or CORS issues
   - 🔄 Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Verify CloudFront is serving content**
   - Open in new tab: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/program_1.m3u8`
   - Should download .m3u8 file or show playlist text
   - If 403/404 → S3 or CloudFront configuration issue

---

### Issue 3: Destination Won't Configure

**Symptom**: Click "Configure RTMP/SRT" but nothing happens or error appears.

**For RTMP (YouTube/Facebook)**:

1. **Verify URL format**
   - YouTube: `rtmp://a.rtmp.youtube.com/live2`
   - Facebook: `rtmps://live-api-s.facebook.com:443/rtmp`
   - ✅ Must include `rtmp://` or `rtmps://` protocol

2. **Check stream key**
   - ✅ Copy-paste from YouTube/Facebook (don't type manually)
   - ✅ No spaces before or after

3. **Channel must be IDLE**
   - ❌ Can't change destination while channel is RUNNING
   - 🔴 Stop channel first

**For SRT (CASTR)**:

1. **Verify SRT URL format**
   - Example: `srt://au.castr.io:9998`
   - ✅ Must include `srt://` protocol and port number

2. **Check Stream ID format**
   - ✅ Should be long string with password
   - Example: `#!::r=live_xxxxx,password=xxxxx,m=publish`

3. **Wait for MediaConnect creation**
   - ⏱️ SRT setup takes 60-90 seconds (creates AWS MediaConnect Flow)
   - ⏱️ Don't click multiple times

4. **Check AWS MediaConnect quotas**
   - 🔍 AWS has limit of 20 flows per region
   - 📞 Contact admin if quota reached

---

### Issue 4: SSL Certificate Error / "Not Secure" Warning

**Symptom**: Browser shows "Not secure" or certificate error.

**Solutions**:

1. **Check URL**
   - ✅ Should be: `https://dashboard.redcorner.com.au`
   - ❌ NOT: `http://` or IP address

2. **Certificate expired** (unlikely - auto-renews)
   - 📞 Contact system administrator
   - 🔧 SSH to server and run: `sudo certbot renew --force-renewal`

3. **DNS not resolving**
   - 🔍 Check: `nslookup dashboard.redcorner.com.au`
   - Should return: `15.134.99.64`
   - If wrong: Check Wix DNS settings

---

### Issue 5: Conversion Stuck or Failed

**Symptom**: Click "Convert to MP4" but progress never updates or shows error.

**Check these**:

1. **Refresh page**
   - 🔄 Progress updates every 5 seconds
   - ⏱️ First update can take 30-60 seconds

2. **Check AWS MediaConvert console**
   - 🔍 Go to AWS Console → MediaConvert → Jobs
   - Look for COMPLETE, PROGRESSING, or ERROR status
   - Error messages show what went wrong

3. **Common MediaConvert errors**:

   **"Access Denied"**
   - 🔧 MediaConvertRole needs S3 permissions
   - 📞 Contact admin to add IAM permissions

   **"Invalid input file"**
   - ❌ Source .ts file might be corrupted
   - ✅ Try converting a different recording

   **"Queue full"**
   - ⏱️ Too many conversion jobs running
   - ⏱️ Wait for existing jobs to complete

---

### Issue 6: Overlay Not Appearing

**Symptom**: Click "Activate Overlay" but overlay doesn't show on stream.

**Check these**:

1. **Verify overlay URL**
   - ✅ Must start with `https://`
   - ✅ Test URL in browser - should load overlay page

2. **Check which player**
   - 💡 Overlay only appears on **PROGRAM** output
   - 💡 Preview output NEVER shows overlay (by design)
   - ✅ Check YouTube/Facebook stream (should have overlay)

3. **Wait for Schedule Action**
   - ⏱️ Takes 5-15 seconds for overlay to activate
   - ⏱️ Check MediaLive Console → Channel → Schedule Actions

4. **Overlay URL accessibility**
   - 🔍 Overlay URL must be publicly accessible
   - 🔍 Can't use localhost or internal URLs
   - ✅ Test from different network

---

### Issue 7: Recording Missing or Not Found

**Symptom**: Stopped channel but recording doesn't appear in Recordings tab.

**Check these**:

1. **Wait a few minutes**
   - ⏱️ S3 finalization takes 1-3 minutes
   - 🔄 Refresh the page

2. **Check channel ran long enough**
   - ⚠️ Very short streams (< 2 minutes) might not create archive segment
   - ✅ Let channel run at least 5 minutes

3. **Verify S3 bucket**
   - 🔍 Go to AWS S3 Console
   - 🔍 Check: `recordings/channel-1/preview/` and `recordings/channel-1/program/`
   - Files should be there even if dashboard doesn't show them

4. **Check dashboard API**
   - Press F12 → Network tab → Refresh recordings page
   - Look for `/api/recordings` call
   - Check response for errors

---

### Issue 8: High AWS Costs

**Symptom**: Cost Monitor shows higher than expected costs.

**Investigation Steps**:

1. **Check running channels**
   - 🔍 Cost Monitor → "Running Channels"
   - ✅ Each channel = ~$4/hour
   - 🔴 Stop channels you're not using

2. **Check MediaConvert jobs**
   - 🔍 AWS Console → MediaConvert → Jobs
   - ❌ Cancel any stuck or unnecessary jobs
   - 💡 Each conversion costs ~$0.50-$1.00

3. **Check S3 storage**
   - 🔍 AWS Console → S3 → Bucket
   - 📊 Check total bucket size
   - 🗑️ Delete old recordings you don't need

4. **Check CloudFront data transfer**
   - 🔍 AWS Console → CloudFront → Reports
   - 📊 First 1TB/month is free
   - 💡 After that: $0.085 per GB

**Cost-Saving Tips**:
- Stop channels immediately after streaming
- Delete recordings after converting to MP4
- Delete old MP4s you don't need
- Use Quick H.264 instead of HEVC when possible

---

### Issue 9: Dashboard Offline / Won't Load

**Symptom**: Dashboard at https://dashboard.redcorner.com.au won't load.

**Check these**:

1. **Is the server running?**
   - SSH to Lightsail: `ssh ubuntu@15.134.99.64`
   - Check Node.js process: `ps aux | grep node`
   - If not running: `cd /home/user/redcorner-dashboard && nohup node server.js &`

2. **Is Nginx running?**
   - SSH to server
   - Check: `sudo systemctl status nginx`
   - If stopped: `sudo systemctl start nginx`

3. **Check Lightsail firewall**
   - Go to AWS Lightsail Console
   - Check Networking tab
   - Verify ports 80 and 443 are open

4. **Check DNS**
   - Command: `nslookup dashboard.redcorner.com.au`
   - Should return: `15.134.99.64`
   - If wrong: Check Wix DNS settings

5. **Check SSL certificate**
   - SSH to server
   - Check: `sudo certbot certificates`
   - Should show valid certificate for dashboard.redcorner.com.au

---

### Issue 10: "Stale Content" / Looping Video

**Symptom**: Channel stopped but player keeps showing old video in a loop.

**This should NOT happen** - we have protection for this!

**If it does happen**:

1. **Hard refresh browser**
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R
   - Clears browser cache

2. **Check player console logs**
   - Press F12 → Console tab
   - Look for: "⚠️ STALE PLAYLIST DETECTED"
   - Should automatically show offline slide after 12-20 seconds

3. **If player doesn't detect staleness**:
   - 📞 Contact developer - staleness detection may be broken
   - 🔧 Player should check:
     - Server status every 5 seconds (PROGRAM) or 15 seconds (PREVIEW)
     - New HLS segments every 2 seconds
     - Stops playing if no new segments for 12s (PROGRAM) or 20s (PREVIEW)

---

### Issue 11: Holding Slide Not Appearing

**Symptom**: Source feed drops but holding slide doesn't appear.

**Check these**:

1. **Holding slide uploaded?**
   - ✅ Dashboard → Holding Slide section
   - ✅ Should show thumbnail preview

2. **MediaLive configured?**
   - 🔍 AWS Console → MediaLive → Channel → Edit
   - 🔍 Input Loss Behavior → Input Loss Image Slate
   - ✅ Should have S3 path: `s3://bucket/holding-slides/holding-slide.png`

3. **Input actually lost?**
   - 🔍 Check MediaLive metrics → Input Loss Seconds
   - 💡 Might be source is still sending (but black video)

4. **Holding slide format**
   - ✅ Must be PNG or JPG
   - ✅ Recommended: 1920x1080
   - ✅ Max 10MB

---

### Emergency Contacts

**For urgent issues**:

1. **Dashboard down**: Contact system administrator
2. **AWS billing concerns**: Check Cost Monitor, contact admin
3. **Stream quality issues**: Check source encoder settings
4. **Destination not receiving**: Check YouTube/Facebook status pages

---

### Getting Help

**Before contacting support, gather this information**:

1. What were you trying to do?
2. What did you expect to happen?
3. What actually happened?
4. Error messages (screenshots helpful)
5. Browser console errors (F12 → Console tab)
6. Time the issue occurred
7. Which channel (Channel 1, 2, etc.)

**Useful commands for tech support**:

```bash
# SSH to server
ssh ubuntu@15.134.99.64

# Check if Node.js app is running
ps aux | grep node

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# View Node.js logs (if using PM2)
pm2 logs redcorner-dashboard --lines 50

# Check disk space
df -h

# Check S3 bucket size
aws s3 ls s3://your-bucket --recursive --summarize --human-readable
```

---

## Quick Reference Card

### Daily Operations Checklist

**Before Going Live**:
- [ ] Configure destination (YouTube/Facebook/CASTR)
- [ ] Configure overlay (if needed)
- [ ] Verify source is streaming
- [ ] Check Cost Monitor

**Starting Stream**:
- [ ] Click "Start Channel"
- [ ] Wait for RUNNING status (~30-45 sec)
- [ ] Verify video in Program Output player
- [ ] Check external destination (YouTube/Facebook)

**During Stream**:
- [ ] Monitor video quality
- [ ] Switch overlays as needed (live switching works)
- [ ] Check Cost Monitor periodically

**Ending Stream**:
- [ ] Click "Stop & Finalize Recording"
- [ ] Wait for IDLE status
- [ ] Recording appears in Recordings tab (1-2 min)

**Post-Production**:
- [ ] Go to Recordings & Downloads
- [ ] Click "Convert to MP4" on recording
- [ ] Wait for both conversions (Quick + HEVC)
- [ ] Download from Downloads tab
- [ ] Delete source .ts files if no longer needed

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Next Review**: December 2025
