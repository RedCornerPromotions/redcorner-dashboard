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
│  │  3️⃣ "program-recording" (?) - Possible archive output            │ │
│  │     └─ Status: Unknown if active                                 │ │
│  │                                                                   │ │
│  │  ADDITIONAL OUTPUTS (dynamic):                                   │ │
│  │  • RTMP (YouTube/Facebook) - added on demand                     │ │
│  │  • UDP to MediaConnect - for SRT destinations                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HLS segments written continuously
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   📦 S3 Bucket (Origin)                                │
│  redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o        │
│                                                                         │
│  medialive/channel1/                                                   │
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
│  ├── program.m3u8              - Legacy/alternate program             │
│  │                                                                     │
│  └── [CONVERTED FILES from MediaConvert]                              │
│      ├── Ch1_Program_Wed_Oct_29_2025.mp4 (150MB)                     │
│      └── Ch1_Preview_Fri_Oct_25_2025.mp4 (200MB)                     │
│                                                                         │
│  ⚠️ .m3u8 playlists constantly updated by MediaLive                   │
│  ⚠️ Old .ts segments AUTO-DELETED (not archived)                      │
│  ⚠️ This is LIVE streaming storage, not recording storage             │
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
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  RECORDINGS PAGE - S3 File Browser                               │ │
│  │                                                                   │ │
│  │  Lists .m3u8 files from S3:                                      │ │
│  │  ✅ Ch1_Preview_Wed_Oct_29_2025.m3u8 (459B)                      │ │
│  │  ❓ Ch1_Program_Wed_Oct_29_2025.m3u8 (459B) - if overlay active  │ │
│  │                                                                   │ │
│  │  Actions per file:                                               │ │
│  │  • [Download] - Downloads .m3u8 (won't play standalone)          │ │
│  │  • [Convert to MP4] - Triggers MediaConvert job ↓                │ │
│  │  • [Delete] - Removes from S3                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 │ User clicks "Convert to MP4"
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              🎬 AWS MediaConvert                                       │
│                                                                         │
│  Conversion Job:                                                       │
│  1. Input: s3://bucket/medialive/channel1/preview_1.m3u8              │
│  2. Reads .m3u8 + fetches ALL referenced .ts segments                 │
│  3. Transcodes to single MP4:                                          │
│     • Video: H.265 (HEVC) @ 5 Mbps                                    │
│     • Audio: AAC @ 128 kbps                                            │
│  4. Output: s3://bucket/medialive/channel1/                           │
│             Ch1_Preview_Wed_Oct_29_2025.mp4                            │
│  5. Dashboard polls job status until complete                         │
│                                                                         │
│  ⚠️ Can only convert CURRENT segments in rolling window!              │
│  ⚠️ Old recordings deleted - cannot recover                            │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              ✅ FINAL DELIVERABLE                                      │
│                                                                         │
│  Single MP4 file (150-200MB for 3 min video)                          │
│  • Plays in any video player                                           │
│  • Can be downloaded and shared                                        │
│  • Stored in S3 permanently (until manually deleted)                  │
└────────────────────────────────────────────────────────────────────────┘
```

## IAM Roles & Permissions

- **MediaConvertRole** - Allows MediaConvert to read/write S3
- **MediaLiveRole** - Allows MediaLive to write to S3
- **Dashboard credentials** - AWS access key/secret with permissions for:
  - MediaLive
  - MediaConnect
  - S3
  - MediaConvert

## Key Understanding Points

### HLS Rolling Window Behavior

1. **Not True Recordings**: MediaLive HLS outputs are LIVE playlists
2. **Auto-Deletion**: Old .ts segments are automatically deleted (keeps ~20 segments = ~3 minutes)
3. **Your "3-minute recording from last night" is GONE**: Overwritten by new segments

### Recording Workflow

To save recordings permanently:

1. **While channel is running**, the `.m3u8` files show the current rolling window
2. **Click "Convert to MP4"** while segments still exist
3. **MediaConvert** creates permanent MP4 file from current segments
4. **Result**: Downloadable MP4 that plays anywhere

### Output Groups Explained

- **"preview"** = Raw incoming video (no overlay)
  - Files: `preview_1.m3u8`, `stream_1.m3u8`

- **"program"** = Video with dynamic HTML5 overlay applied
  - Files: `program_1.m3u8`, `program.m3u8`
  - Overlay URL set via Schedule Actions (live switching, no channel restart)

- **"program-recording"** = Possible archive output (status unknown)

### Current Issue

**Why only preview showing in dashboard:**
- API found: `preview_1.m3u8` ✅
- Missing: `program_1.m3u8` ❓

**Possible reasons:**
1. Program output not recording (overlay not active)
2. File exists but filtered out by code
3. File was deleted/rotated

### AWS Services Integration

```
Video Input
    ↓
MediaConnect (optional, for SRT)
    ↓
MediaLive (encodes, adds overlay, outputs HLS)
    ↓
S3 (storage, rolling window)
    ↓
CloudFront (CDN delivery)
    ↓
Dashboard (playback + management)
    ↓
MediaConvert (HLS → MP4 on demand)
```

## Important Files

- **Bucket**: `redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o`
- **CloudFront**: `d2njmhq33zb6p4.cloudfront.net`
- **HLS Path**: `medialive/channel1/`
- **Preview URL**: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/preview_1.m3u8`
- **Program URL**: `https://d2njmhq33zb6p4.cloudfront.net/medialive/channel1/program_1.m3u8`

---

**Document created**: 2025-10-30
**Purpose**: Reference for Red Corner AWS MediaLive streaming architecture
**Note**: Keep this for when things break (because they will)
