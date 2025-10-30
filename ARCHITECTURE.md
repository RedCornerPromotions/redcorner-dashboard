# Red Corner AWS MediaLive Architecture Map

## Complete Video Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                         🎥 VIDEO SOURCE                               │
│                                                                        │
│  Options:                                                              │
│  • RTMP Push (direct to MediaLive)                                    │
│  • MediaConnect Flow (for SRT sources)                                │
│  • RTP/UDP input                                                       │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│            🔀 AWS MediaConnect (OPTIONAL - for SRT)                   │
│                                                                        │
│  When SRT destination needed:                                         │
│  • Creates Flow with UDP input from MediaLive                         │
│  • Adds SRT output to CASTR/external                                  │
│  • MediaLive → UDP → MediaConnect → SRT out                           │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    🎬 AWS MediaLive Channel 1                          │
│                                                                         │
│  Input: RTMP/MediaConnect/RTP                                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    ENCODER SETTINGS                               │ │
│  │                                                                   │ │
│  │  3 OUTPUT GROUPS CONFIGURED:                                     │ │
│  │                                                                   │ │
│  │  1️⃣ "preview" - HLS Output                                       │ │
│  │     ├─ Raw input video (NO overlay)                              │ │
│  │     ├─ Outputs: preview_1.m3u8 + stream_1.m3u8                   │ │
│  │     └─ Destination: S3 (rolling window ~20 segments)             │ │
│  │                                                                   │ │
│  │  2️⃣ "program" - HLS Output with Overlay                          │ │
│  │     ├─ Video + Dynamic HTML5 Overlay                             │ │
│  │     ├─ Overlay URL set via Schedule Actions (live switching)     │ │
│  │     ├─ Outputs: program_1.m3u8 + program.m3u8                    │ │
│  │     └─ Destination: S3 (rolling window ~20 segments)             │ │
│  │                                                                   │ │
│  │  3️⃣ "archive-preview" - Archive Output                            │ │
│  │     ├─ Continuous .ts recording (raw input, no overlay)          │ │
│  │     ├─ 30-minute rollover segments                               │ │
│  │     ├─ Kept permanently in S3 (not deleted)                      │ │
│  │     └─ Destination: s3://bucket/recordings/channel-1/preview/    │ │
│  │                                                                   │ │
│  │  4️⃣ "archive-program" - Archive Output                           │ │
│  │     ├─ Continuous .ts recording (with overlay)                   │ │
│  │     ├─ 30-minute rollover segments                               │ │
│  │     ├─ Kept permanently in S3 (not deleted)                      │ │
│  │     └─ Destination: s3://bucket/recordings/channel-1/program/    │ │
│  │                                                                   │ │
│  │  ADDITIONAL OUTPUTS (dynamic):                                   │ │
│  │  • RTMP (YouTube/Facebook) - added on demand                     │ │
│  │  • UDP to MediaConnect - for SRT destinations                    │ │
│  │                                                                   │ │
│  │  INPUT LOSS BEHAVIOR:                                            │ │
│  │  • Configured to show holding slide when source drops            │ │
│  │  • S3 path: s3://bucket/holding-slides/holding-slide.png         │ │
│  │  • Uploadable via dashboard UI                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HLS segments written continuously
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   📦 S3 Bucket (Origin)                                │
│  redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o        │
│                                                                         │
│  medialive/channel1/ (LIVE STREAMING - Rolling window)                │
│  ├── preview_1.m3u8 (459B) - Master playlist                          │
│  ├── preview_1_00900.ts (8MB) ┐                                       │
│  ├── preview_1_00901.ts (8MB) │ Rolling                               │
│  ├── preview_1_00902.ts (8MB) │ Window                                │
│  ├── ... (keeps last ~20)     │ ~3 min                                │
│  ├── preview_1_00922.ts (8MB) ┘ of video                             │
│  │                                                                     │
│  ├── program_1.m3u8 (459B) - Master playlist                          │
│  ├── program_1_00900.ts (8MB) ┐                                       │
│  ├── program_1_00901.ts (8MB) │ Rolling                               │
│  ├── program_1_00902.ts (8MB) │ Window                                │
│  ├── ... (keeps last ~20)     │ ~3 min                                │
│  ├── program_1_00922.ts (8MB) ┘ of video                             │
│  │                                                                     │
│  ├── stream_1.m3u8            - Legacy/alternate preview             │
│  └── program.m3u8              - Legacy/alternate program             │
│                                                                         │
│  recordings/channel-1/ (PERMANENT ARCHIVE RECORDINGS)                 │
│  ├── preview/                                                          │
│  │   ├── recording_2025-10-30T14-00-00.ts (4.88GB, 30 min)           │
│  │   ├── recording_2025-10-30T14-30-00.ts (4.88GB, 30 min)           │
│  │   └── recording_2025-10-30T15-00-00.ts (4.88GB, 30 min)           │
│  │                                                                     │
│  └── program/                                                          │
│      ├── recording_2025-10-30T14-00-00.ts (4.88GB, 30 min)           │
│      ├── recording_2025-10-30T14-30-00.ts (4.88GB, 30 min)           │
│      └── recording_2025-10-30T15-00-00.ts (4.88GB, 30 min)           │
│                                                                         │
│  downloads/channel-1/ (CONVERTED MP4 FILES from MediaConvert)         │
│  ├── preview/                                                          │
│  │   ├── Ch1_PVW_Thu_Oct_30.mp4 (1.2GB, HEVC quality)                │
│  │   ├── Ch1_PVW_Thu_Oct_30_quick.mp4 (2.5GB, H.264 fast)            │
│  │   └── Ch1_PVW_Fri_Oct_31.mp4 (1.2GB, HEVC quality)                │
│  │                                                                     │
│  └── program/                                                          │
│      ├── Ch1_PGM_Thu_Oct_30.mp4 (1.2GB, HEVC quality)                │
│      ├── Ch1_PGM_Thu_Oct_30_quick.mp4 (2.5GB, H.264 fast)            │
│      └── Ch1_PGM_Fri_Oct_31.mp4 (1.2GB, HEVC quality)                │
│                                                                         │
│  holding-slides/                                                       │
│  └── holding-slide.png (1920x1080) - Input loss fallback image       │
│                                                                         │
│  ⚠️ medialive/ = Live HLS playlists (rolling window, auto-deleted)    │
│  ✅ recordings/ = Permanent .ts archives (30-min segments)             │
│  ✅ downloads/ = Converted MP4 files (ready to download/share)         │
│  ✅ holding-slides/ = Input loss fallback images                       │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              ☁️ CloudFront Distribution (CDN)                          │
│              d2njmhq33zb6p4.cloudfront.net                            │
│                                                                         │
│  Origin: S3 bucket                                                     │
│  Purpose: Low-latency HLS delivery                                     │
│                                                                         │
│  Live Stream URLs:                                                     │
│  • Preview: https://d2njmhq33zb6p4.cloudfront.net/                    │
│             medialive/channel1/preview_1.m3u8                          │
│  • Program: https://d2njmhq33zb6p4.cloudfront.net/                    │
│             medialive/channel1/program_1.m3u8                          │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              🎯 Dashboard Web Interface (Port 3000)                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  DASHBOARD PAGE - Channel Control                                │ │
│  │  • Start/Stop MediaLive channels                                 │ │
│  │  • Activate/Deactivate HTML5 overlay (live switching)            │ │
│  │  • Add RTMP/SRT destinations                                     │ │
│  │  • Embedded HLS players (via CloudFront)                         │ │
│  │  • Cost monitor (running channels, hourly/daily/weekly rates)    │ │
│  │                                                                   │ │
│  │  HOLDING SLIDE SECTION (Collapsible):                            │ │
│  │  • Upload holding slide image (PNG/JPG, max 10MB)                │ │
│  │  • Preview thumbnail (320x180)                                   │ │
│  │  • Shows S3 path for MediaLive Input Loss configuration          │ │
│  │  • Auto-updates when new image uploaded (no restart needed)      │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  RECORDINGS & DOWNLOADS PAGE - Dual Tabs                         │ │
│  │                                                                   │ │
│  │  📹 RECORDINGS TAB:                                              │ │
│  │  • Lists .ts archive recordings from S3                          │ │
│  │  • Shows PVW (preview) and PGM (program) recordings              │ │
│  │  • Displays file size, date, type                                │ │
│  │                                                                   │ │
│  │  Recording Control (only visible when channel RUNNING):          │ │
│  │  • Stop & Finalize Recording button                              │ │
│  │  • Status: "● Recording in progress..." (green)                  │ │
│  │  • Hides when channel is IDLE/STOPPED                            │ │
│  │                                                                   │ │
│  │  Actions per recording:                                          │ │
│  │  • [Download .ts] - Downloads source file                        │ │
│  │  • [Convert to MP4] - Starts DUAL conversion jobs ↓              │ │
│  │    - Quick H.264 MP4 (~15-20 min, *_quick.mp4)                   │ │
│  │    - HEVC MP4 (~90 min, high quality)                            │ │
│  │  • [Delete] - Removes from S3                                    │ │
│  │  • Real-time progress bars for both conversions                  │ │
│  │                                                                   │ │
│  │  📥 DOWNLOADS TAB:                                               │ │
│  │  • Lists converted .mp4 files from S3 downloads/ folder          │ │
│  │  • Shows both quick and quality versions                         │ │
│  │  • Displays file size, codec info (H.264/HEVC)                   │ │
│  │  • Actions: [Download MP4], [Delete]                             │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 │ User clicks "Convert to MP4"
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              🎬 AWS MediaConvert - DUAL CONVERSION STRATEGY            │
│                                                                         │
│  When user clicks "Convert to MP4", TWO jobs start simultaneously:    │
│                                                                         │
│  🏃 JOB 1: QUICK H.264 CONVERSION                                      │
│  1. Input: s3://bucket/recordings/channel-1/preview/recording_*.ts    │
│  2. Transcodes to H.264 MP4:                                           │
│     • Video: H.264 @ QVBR Quality 7, MaxBitrate 8 Mbps                │
│     • Audio: AAC @ 128 kbps, CodingMode: CODING_MODE_2_0              │
│     • Acceleration: Mode 'PREFERRED' (hardware acceleration)           │
│     • Quality: SINGLE_PASS (fast)                                     │
│  3. Output: s3://bucket/downloads/channel-1/preview/                  │
│             Ch1_PVW_Thu_Oct_30_quick.mp4                               │
│  4. Time: ~15-20 minutes for 30-min recording (2.5GB output)          │
│  5. Purpose: Fast delivery for clients who need it NOW                │
│                                                                         │
│  🎨 JOB 2: HEVC HIGH QUALITY CONVERSION                                │
│  1. Input: s3://bucket/recordings/channel-1/preview/recording_*.ts    │
│  2. Transcodes to HEVC MP4:                                            │
│     • Video: H.265 (HEVC) @ QVBR Quality 8, MaxBitrate 8 Mbps         │
│     • Audio: AAC @ 128 kbps, CodingMode: CODING_MODE_2_0              │
│     • Acceleration: Mode 'PREFERRED' (hardware acceleration)           │
│     • Quality: SINGLE_PASS_HQ (high quality)                          │
│  3. Output: s3://bucket/downloads/channel-1/preview/                  │
│             Ch1_PVW_Thu_Oct_30.mp4                                     │
│  4. Time: ~90 minutes for 30-min recording (1.2GB output)             │
│  5. Purpose: Smaller, better quality for archival/distribution        │
│                                                                         │
│  Dashboard tracks both jobs independently:                             │
│  • Shows separate progress bars (Quick H.264: 45%, HEVC: 12%)         │
│  • Updates every 5 seconds                                             │
│  • Both appear in Downloads tab when complete                         │
│                                                                         │
│  ✅ Converts permanent archive recordings (not rolling window)         │
│  ✅ Recordings kept safe in recordings/ folder                         │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              ✅ FINAL DELIVERABLES                                     │
│                                                                         │
│  TWO MP4 files from each conversion:                                  │
│                                                                         │
│  1️⃣ Quick H.264 MP4 (ready in ~15-20 min)                             │
│     • File: Ch1_PVW_Thu_Oct_30_quick.mp4 (~2.5GB for 30 min)          │
│     • Codec: H.264 (widely compatible)                                │
│     • Quality: Good (QVBR 7)                                          │
│     • Use case: Immediate client delivery                            │
│                                                                         │
│  2️⃣ HEVC MP4 (ready in ~90 min)                                        │
│     • File: Ch1_PVW_Thu_Oct_30.mp4 (~1.2GB for 30 min)               │
│     • Codec: H.265/HEVC (superior compression)                        │
│     • Quality: High (QVBR 8)                                          │
│     • Use case: Archival, distribution, smaller file size            │
│                                                                         │
│  Both files:                                                           │
│  • Play in modern video players                                       │
│  • Can be downloaded and shared                                        │
│  • Stored in S3 downloads/ folder permanently                         │
│  • Listed in Downloads tab with download/delete actions               │
└────────────────────────────────────────────────────────────────────────┘
```

## IAM Roles & Permissions

- **MediaConvertRole** - Allows MediaConvert to read/write S3
  - Must have S3 read permissions for recordings/ folder
  - Must have S3 write permissions for downloads/ folder

- **MediaLiveRole** - Allows MediaLive to write to S3
  - Must have S3 write permissions for medialive/ folder (HLS)
  - Must have S3 write permissions for recordings/ folder (archive)
  - Must have S3 read permissions for holding-slides/ folder (input loss)

- **Dashboard credentials (IAM user: redcorner-medialive)** - AWS access key/secret with permissions for:
  - MediaLive (start/stop channels, describe status, manage outputs)
  - MediaConnect (create flows, manage destinations)
  - S3 (list, read, write, delete for all folders)
  - MediaConvert (create jobs, describe jobs)
  - S3 PutObject permissions for holding slide uploads

## Key Understanding Points

### HLS Rolling Window Behavior (Live Streaming)

1. **Purpose**: Live streaming playback via CloudFront CDN
2. **Auto-Deletion**: Old .ts segments are automatically deleted (keeps ~20 segments = ~3 minutes)
3. **Location**: `medialive/channel1/` folder in S3
4. **Files**: `preview_1.m3u8`, `program_1.m3u8` + rolling .ts segments
5. **DO NOT USE FOR RECORDING**: These files are constantly overwritten

### Archive Recording Workflow (Permanent Storage)

MediaLive has SEPARATE archive output groups that save permanent recordings:

1. **Archive outputs run continuously** when channel is RUNNING
2. **30-minute segments** automatically created in `recordings/channel-1/` folder
3. **Files kept permanently** (not auto-deleted like HLS rolling window)
4. **Two types**:
   - `preview/` - Raw input without overlay
   - `program/` - With HTML5 overlay applied
5. **Recording control** in dashboard stops channel and finalizes current segment

### Conversion Workflow

To convert archive recordings to MP4:

1. View `.ts` recordings in **Recordings tab**
2. **Click "Convert to MP4"** to start DUAL conversion
3. **Two MediaConvert jobs** start simultaneously:
   - Quick H.264 (~15-20 min) → `*_quick.mp4`
   - HEVC quality (~90 min) → `*.mp4`
4. **Track progress** with real-time progress bars
5. **Download from Downloads tab** when complete

### Output Groups Explained

MediaLive Channel 1 has FOUR output groups:

1. **"preview"** (HLS Output) = Raw incoming video (no overlay)
   - Files: `preview_1.m3u8`, `stream_1.m3u8` in `medialive/channel1/`
   - Purpose: Live streaming of raw input
   - Rolling window: ~3 minutes of segments

2. **"program"** (HLS Output) = Video with dynamic HTML5 overlay
   - Files: `program_1.m3u8`, `program.m3u8` in `medialive/channel1/`
   - Purpose: Live streaming with overlay
   - Overlay URL set via Schedule Actions (live switching, no channel restart)
   - Rolling window: ~3 minutes of segments

3. **"archive-preview"** (Archive Output) = Permanent recordings without overlay
   - Files: `recording_*.ts` in `recordings/channel-1/preview/`
   - Purpose: Permanent storage of raw input
   - 30-minute segments, kept permanently

4. **"archive-program"** (Archive Output) = Permanent recordings with overlay
   - Files: `recording_*.ts` in `recordings/channel-1/program/`
   - Purpose: Permanent storage with overlay
   - 30-minute segments, kept permanently

### Input Loss Behavior

When the source video feed drops:

1. MediaLive detects input loss
2. Switches to configured holding slide
3. Holding slide path: `s3://bucket/holding-slides/holding-slide.png`
4. Configured via MediaLive Input Loss Behavior settings
5. Uploadable via dashboard UI (collapsible section)
6. Auto-updates when new image uploaded (MediaLive reads from S3 on input loss)

### Player Stall Detection

The HLS player (`player.html`) monitors stream health:

1. **Timeupdate monitoring**: Tracks video position changes
2. **10-second stall threshold**: If position unchanged for 10 seconds
3. **Auto-pattern display**: Shows "Channel X - PROGRAM/PREVIEW - No stream available"
4. **Auto-retry**: Attempts to reconnect every 3 seconds
5. **Use case**: When channel stops, shows offline slide after ~40 seconds total:
   - 30 seconds of HLS buffer draining
   - 10 seconds of stall detection
   - Clean offline experience instead of frozen frame

### Dashboard UI Features

1. **Collapsible sections**: Save dashboard real estate
   - Holding slide section collapses with ▶/▼ toggle
   - Click header to expand/collapse
   - Smooth max-height transition animation

2. **Dynamic recording control visibility**:
   - Only shows when channel is RUNNING/STARTING/STOPPING
   - Hides when channel is IDLE (no confusion for users)
   - Status indicator: Green "● Recording in progress..." when active

3. **Dual tab interface** (Recordings & Downloads):
   - Recordings tab: Source .ts files with Convert button
   - Downloads tab: Converted .mp4 files
   - Clear separation of source vs final deliverables

### AWS Services Integration

```
Video Input
    ↓
MediaConnect (optional, for SRT)
    ↓
MediaLive (encodes, adds overlay, outputs HLS + Archive)
    ↓
S3 (storage: HLS rolling window + permanent recordings)
    ↓
CloudFront (CDN delivery for live streams)
    ↓
Dashboard (playback + management + recording control)
    ↓
MediaConvert (Dual .ts → MP4 conversion: Quick H.264 + HEVC)
    ↓
Downloads (Both MP4s available in Downloads tab)
```

## Important Files and Paths

### S3 Bucket Structure
- **Bucket**: `redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o`
- **HLS Live Path**: `medialive/channel1/` (rolling window)
- **Archive Recordings**: `recordings/channel-1/preview/` and `recordings/channel-1/program/`
- **Converted Downloads**: `downloads/channel-1/preview/` and `downloads/channel-1/program/`
- **Holding Slides**: `holding-slides/holding-slide.png`

### CloudFront CDN
- **Domain**: `d2njmhq33zb6p4.cloudfront.net`
- **Preview URL**: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/preview_1.m3u8`
- **Program URL**: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/program_1.m3u8`

### Lightsail Hosting Infrastructure
- **Static IP**: `15.134.99.64`
- **Domain**: `dashboard.redcorner.com.au` (DNS via Wix)
- **SSL Certificate**: Let's Encrypt (auto-renews every 90 days)
- **Reverse Proxy**: Nginx
  - Listens on ports 80 (HTTP) and 443 (HTTPS)
  - Proxies to Node.js app on localhost:3000
  - Handles SSL termination
  - Auto-redirects HTTP → HTTPS

### Dashboard URLs (Production)
- **Main Dashboard**: `https://dashboard.redcorner.com.au/dashboard.html`
- **Recordings & Downloads**: `https://dashboard.redcorner.com.au/recordings.html`
- **Multiview**: `https://dashboard.redcorner.com.au/multiview.html`
- **Player**: `https://dashboard.redcorner.com.au/player.html?channel=1` (or `?channel=program1`)
- **Login**: `https://dashboard.redcorner.com.au/` (secured with SSL)

### IAM Resources
- **MediaLive Role**: `MediaLiveRole`
- **MediaConvert Role**: `MediaConvertRole`
- **Dashboard User**: `redcorner-medialive` (IAM user with access key)

---

## Recent Features Added

### Security & Infrastructure
- ✅ **HTTPS/SSL Setup** - Let's Encrypt certificate with auto-renewal
- ✅ **Custom Domain** - dashboard.redcorner.com.au with SSL
- ✅ **Nginx Reverse Proxy** - Professional production setup
- ✅ **AWS Security** - Compromised keys rotated, account secured
- ✅ **Zero-Cache HLS Detection** - Prevents stale content loops (no "heist movie" cached footage)

### Video Processing
- ✅ **Archive Recording Outputs** - 30-min segments, permanent storage
- ✅ **Dual MediaConvert Conversion** - Quick H.264 + HEVC simultaneously
- ✅ **Hardware Acceleration** - Faster conversions with AWS acceleration
- ✅ **Separate Downloads Tab** - MP4 files separate from source recordings
- ✅ **Simplified Filename Format** - e.g., `Ch1_PGM_Thu_Oct_30.mp4`
- ✅ **Real-time Dual Conversion Progress Tracking** - Monitor both jobs independently

### User Interface
- ✅ **Professional Blue Color Scheme** - Calming blue instead of harsh red warnings
- ✅ **Collapsible Dashboard Sections** - Cost Monitor, Holding Slide, Destinations, Overlays
- ✅ **Tab-Style Type Selector** - Easy RTMP/SRT selection (replaced hard-to-see radio buttons)
- ✅ **Compact Button Styling** - Green (activate) / Red (remove) / Blue (info)
- ✅ **Dynamic Recording Control Visibility** - Only shows when channel active

### Player Features
- ✅ **HLS Playlist Staleness Detection** - PROGRAM: 12s, PREVIEW: 20s thresholds
- ✅ **Server-Side Channel Status Verification** - Authoritative state checking
- ✅ **Zero Blind Retries** - Only reconnects when channel confirmed RUNNING
- ✅ **Clean Offline Display** - Shows "No stream available" when channel stops

### Content Management
- ✅ **Holding Slide Upload** - Input loss fallback with thumbnail preview
- ✅ **Auto-Update Holding Slide** - MediaLive reads from S3 on input loss

---

## Security Notes

### AWS Account Security (Oct 2025)
- **Issue**: Access keys accidentally exposed to public GitHub repository (Oct 26-29)
- **Resolution**: Keys rotated Oct 29, repository made private, AWS support case closed
- **Prevention**:
  - `.env` properly in `.gitignore`
  - Repository set to private
  - Regular key rotation implemented

### SSL Certificate Management
- **Provider**: Let's Encrypt (free, trusted)
- **Domain**: dashboard.redcorner.com.au
- **Auto-Renewal**: Certbot handles renewal automatically
- **Expiry**: 90 days (renews at 60 days automatically)
- **Location**: `/etc/letsencrypt/live/dashboard.redcorner.com.au/`

---

**Document created**: 2025-10-30
**Last updated**: 2025-10-30 (HTTPS setup, security updates, UI improvements)
**Purpose**: Complete reference for Red Corner AWS MediaLive streaming architecture
**Note**: Keep this for when things break (because they will)
**Status**: Channel 1 fully configured and operational. Channels 2-5 not yet configured.
