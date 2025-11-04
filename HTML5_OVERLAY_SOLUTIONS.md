# HTML5 Overlay Solutions for Ant Media Server

## Current AWS MediaLive Setup (What You Have Now)

### AWS MediaLive Motion Graphics Overlay
Your current AWS setup uses **Motion Graphics** feature:

**How it works:**
1. Create HTML5 graphics (scores, timers, graphics) in a separate file
2. Upload to S3 bucket
3. AWS MediaLive loads HTML5 content as overlay layer
4. **Dynamically change overlays** without restarting stream
5. Real-time updates via S3 file updates

**Key Advantage:**
- Live, dynamic overlay changes while stream is running
- No stream interruption
- HTML/CSS/JavaScript flexibility

**Cost:**
- Included in MediaLive pricing (~$1,600+/month total)

---

## The Challenge with Ant Media Server

**Out-of-the-box Ant Media does NOT have built-in dynamic HTML5 overlay support.**

This is the main feature gap compared to AWS MediaLive for your use case.

---

## Solutions for Ant Media Server

### ✅ Solution 1: Stamp Plugin (Recommended - Official)

**What is it?**
- **Third-party commercial plugin** by StreamToolbox
- Official Ant Media marketplace plugin
- REST API-controlled dynamic overlays
- Renders text, images, tickers, effects

**Features:**
- ✅ Dynamic text overlays (scores, timers, captions)
- ✅ Image overlays (logos, graphics)
- ✅ Ticker/scrolling text
- ✅ Visual effects (drop shadow, fade-in/out, transitions)
- ✅ REST API control (update without restarting stream)
- ✅ Multiple overlay layers
- ✅ Position control (x, y coordinates)
- ✅ Opacity, scaling, rotation

**Pricing:**
- **$299 one-time** per Ant Media Server instance
- Source: https://streamtoolbox.com/stamp/

**Use Cases:**
- Sports scores and timers
- Stock tickers
- Live captions/subtitles
- Speaker names
- Voting results
- Clock/countdown
- Social media handles

**Installation:**
1. Purchase from https://antmedia.io/marketplace/stamp-app/
2. Download plugin file
3. Upload to Ant Media Server via dashboard
4. Restart Ant Media service
5. Configure via REST API

**Example REST API Call:**
```bash
# Add text overlay
curl -X POST "http://134.199.150.238:5080/LiveApp/v2/broadcasts/YOUR_STREAM_ID/stamp" \
-H "Content-Type: application/json" \
-d '{
  "type": "text",
  "content": "Red Corner - Live",
  "x": 50,
  "y": 50,
  "fontSize": 48,
  "fontColor": "#FFFFFF",
  "backgroundColor": "#FF0000",
  "opacity": 0.8
}'

# Add image overlay
curl -X POST "http://134.199.150.238:5080/LiveApp/v2/broadcasts/YOUR_STREAM_ID/stamp" \
-H "Content-Type: application/json" \
-d '{
  "type": "image",
  "url": "https://yoursite.com/logo.png",
  "x": 1600,
  "y": 50,
  "width": 200,
  "height": 100,
  "opacity": 1.0
}'

# Update overlay dynamically
curl -X PUT "http://134.199.150.238:5080/LiveApp/v2/broadcasts/YOUR_STREAM_ID/stamp/STAMP_ID" \
-H "Content-Type: application/json" \
-d '{
  "content": "Score: 3-2"
}'

# Remove overlay
curl -X DELETE "http://134.199.150.238:5080/LiveApp/v2/broadcasts/YOUR_STREAM_ID/stamp/STAMP_ID"
```

**Limitations:**
- ⚠️ Not full HTML5/CSS/JavaScript (text + images only)
- ⚠️ Additional cost ($299)
- ⚠️ Not as flexible as AWS Motion Graphics

**Best For:**
- ✅ Sports graphics (scores, timers)
- ✅ News tickers
- ✅ Live captions
- ✅ Logo overlays
- ✅ Most Red Corner use cases

**Documentation:**
- https://streamtoolbox.com/ams-stamp-reference/

---

### ✅ Solution 2: OBS Studio Intermediary

**What is it?**
Use OBS Studio as a middle layer between encoder and Ant Media

**How it works:**
```
Hardware Encoder (SRT)
    → OBS Studio (receives SRT, adds browser source overlay)
    → Ant Media (receives from OBS via SRT/RTMP)
    → CASTR/YouTube/Facebook
```

**OBS Studio Features:**
- ✅ Full HTML5 browser source support
- ✅ Change overlays live without restarting
- ✅ CSS/JavaScript animations
- ✅ Multiple scenes and transitions
- ✅ Free and open-source

**Setup Steps:**
1. Install OBS Studio on a dedicated PC/VM
2. Add **Media Source** → SRT input from hardware encoder
3. Add **Browser Source** → Load your HTML5 overlay URL
4. Configure OBS to output to Ant Media via SRT/RTMP
5. Update overlays by refreshing browser source or changing URL

**OBS Browser Source:**
```javascript
// Example HTML5 overlay (hosted on web server)
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; background: transparent; }
  #scoreboard {
    position: absolute;
    top: 50px;
    right: 50px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 20px;
    font-size: 48px;
    font-family: Arial;
  }
</style>
</head>
<body>
  <div id="scoreboard">Score: <span id="score">0-0</span></div>
  <script>
    // Fetch score from API every 2 seconds
    setInterval(() => {
      fetch('https://yourapi.com/score')
        .then(r => r.json())
        .then(data => {
          document.getElementById('score').textContent = data.score;
        });
    }, 2000);
  </script>
</body>
</html>
```

**Pros:**
- ✅ Full HTML5/CSS/JS flexibility (same as AWS)
- ✅ Free solution
- ✅ Advanced scene switching
- ✅ Chroma key, filters, effects
- ✅ Multi-source compositing

**Cons:**
- ❌ Adds complexity (another system to manage)
- ❌ Single point of failure
- ❌ Requires dedicated PC/server
- ❌ Manual failover setup needed
- ❌ Additional latency (~1-2 seconds)

**Reliability Solutions:**
- Run OBS on redundant servers
- Use OBS automation tools (obs-websocket)
- Monitor OBS with watchdog scripts
- Auto-restart on failure

**Best For:**
- ✅ Complex HTML5 overlays
- ✅ Multiple scenes/transitions
- ✅ Full AWS feature parity
- ✅ When $299 Stamp plugin isn't enough

**Cost:**
- Software: Free
- Server: $20-48/month (Digital Ocean droplet)
- Total: **$20-48/month**

---

### ✅ Solution 3: FFmpeg Custom Overlay Pipeline

**What is it?**
Use FFmpeg to burn overlays into stream before Ant Media

**How it works:**
```
Hardware Encoder (SRT)
    → FFmpeg (receives SRT, burns overlay, outputs SRT)
    → Ant Media
    → Multi-destination
```

**FFmpeg Capabilities:**
- Text overlays via `drawtext` filter
- Image overlays via `overlay` filter
- Dynamic updates via file monitoring

**Example - Dynamic Text Overlay:**
```bash
# Create text file for overlay
echo "Red Corner - Live Event" > /tmp/overlay.txt

# FFmpeg command
ffmpeg -i srt://134.199.150.238:20000?mode=listener \
  -vf "drawtext=textfile=/tmp/overlay.txt:reload=1:x=50:y=50:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5" \
  -c:v libx264 -preset veryfast -b:v 5000k \
  -c:a copy \
  -f mpegts "srt://134.199.150.238:4200?streamid=channel1"

# Update overlay (FFmpeg auto-reloads file)
echo "Score: 3-2" > /tmp/overlay.txt
```

**Example - Image Overlay:**
```bash
ffmpeg -i srt://input \
  -loop 1 -i /path/to/logo.png \
  -filter_complex "[0:v][1:v]overlay=W-w-50:50" \
  -c:v libx264 -preset veryfast \
  -f mpegts "srt://output"
```

**Dynamic Image Updates:**
```bash
# FFmpeg monitors image file and reloads on change
ffmpeg -i srt://input \
  -loop 1 -f image2 -r 1 -i /tmp/overlay.png \
  -filter_complex "[0:v][1:v]overlay=W-w-50:50" \
  -c:v libx264 \
  -f mpegts "srt://output"

# Update overlay
cp new_scoreboard.png /tmp/overlay.png
```

**Pros:**
- ✅ Free and open-source
- ✅ Powerful filtering capabilities
- ✅ Can reload text files dynamically
- ✅ Low-level control

**Cons:**
- ❌ Complex setup and scripting
- ❌ Limited to text and static images
- ❌ No browser/HTML5 rendering
- ❌ Requires FFmpeg expertise
- ❌ Manual process management

**Best For:**
- ✅ Simple text overlays (timecode, labels)
- ✅ Static logo watermarks
- ✅ Budget-conscious setups
- ✅ Technical teams comfortable with FFmpeg

**Cost:**
- Software: Free
- Server: Can run on existing Ant Media server
- Total: **$0**

---

### ✅ Solution 4: Hardware Encoder Built-in Graphics

**What is it?**
Use your hardware encoder's built-in graphics/overlay features

**Supported Encoders:**
- Pearl encoders (Epiphan)
- Teradek Prism/Core
- Matrox Monarch
- LiveU Solo/LU800
- NewTek TriCaster

**Features (encoder-dependent):**
- Text overlays
- Logo/image overlays
- Lower-thirds
- Timers/clocks
- Some support web-based graphics

**Pros:**
- ✅ No server-side processing needed
- ✅ Graphics burned before transmission
- ✅ No impact on Ant Media resources
- ✅ Encoder manages graphics

**Cons:**
- ❌ Requires supported hardware encoder
- ❌ Limited to encoder capabilities
- ❌ Not centrally managed
- ❌ May require physical access to encoder

**Best For:**
- ✅ Simple, static overlays
- ✅ Logo watermarks
- ✅ When encoder already has the feature
- ✅ Distributed production setups

**Cost:**
- Included with encoder hardware
- Total: **$0 additional**

---

### ✅ Solution 5: Hybrid Approach (AWS + Ant Media)

**What is it?**
Keep 1 AWS MediaLive channel for overlay-heavy content, migrate rest to Ant Media

**How it works:**
```
Overlay-Heavy Stream (1 channel)
    → AWS MediaLive (HTML5 overlays)
    → YouTube/Facebook

Simple Streams (4 channels)
    → Ant Media Server (no overlays or Stamp plugin)
    → CASTR/YouTube/Facebook
```

**Cost Breakdown:**
| Service | Channels | Monthly Cost |
|---------|----------|--------------|
| AWS MediaLive | 1 | $320-400 |
| Ant Media | 4 | $141-157 |
| **Total** | **5** | **$461-557** |

**Savings vs Full AWS:**
- Current: $1,600-2,000/month
- Hybrid: $461-557/month
- **Savings: $1,043-1,443/month (71% reduction)**

**Pros:**
- ✅ Keep AWS HTML5 overlay capability where needed
- ✅ Still save 71% on costs
- ✅ Gradual migration path
- ✅ Test Ant Media with lower risk

**Cons:**
- ❌ Manage two systems
- ❌ Still paying AWS (but much less)
- ❌ Split infrastructure

**Best For:**
- ✅ Risk-averse migration
- ✅ Only 1-2 streams need complex overlays
- ✅ Testing Ant Media before full commitment

---

### ⚠️ Solution 6: Custom Plugin Development

**What is it?**
Develop a custom Ant Media plugin for HTML5 overlay rendering

**Approach:**
- Fork Ant Media Server (open source)
- Integrate headless browser (Puppeteer, Playwright)
- Render HTML5 to video frames
- Burn into transcoding pipeline

**Requirements:**
- Java development expertise
- FFmpeg integration knowledge
- Browser automation experience
- Server performance optimization

**Pros:**
- ✅ Full HTML5/CSS/JavaScript support
- ✅ Exact AWS parity
- ✅ Customizable to your needs
- ✅ One-time development cost

**Cons:**
- ❌ High development cost ($5,000-15,000+)
- ❌ Ongoing maintenance burden
- ❌ Complex to build and test
- ❌ May not be production-ready quickly

**Best For:**
- ✅ Long-term strategic investment
- ✅ Unique overlay requirements
- ✅ In-house development team
- ✅ Multiple servers to deploy to

**Cost:**
- Development: $5,000-15,000
- Maintenance: $1,000-2,000/year
- Total: **$5,000-15,000 upfront**

---

## Comparison Matrix

| Solution | Cost | Complexity | AWS Parity | Dynamic Updates | HTML5/JS Support | Recommendation |
|----------|------|------------|------------|-----------------|------------------|----------------|
| **Stamp Plugin** | $299 | ⭐⭐ Easy | ⚠️ 70% | ✅ Yes (API) | ❌ Text/Images only | ⭐⭐⭐⭐⭐ **Best** |
| **OBS Studio** | $0-48/mo | ⭐⭐⭐ Medium | ✅ 100% | ✅ Yes | ✅ Full | ⭐⭐⭐⭐ Great |
| **FFmpeg** | $0 | ⭐⭐⭐⭐ Hard | ⚠️ 40% | ⚠️ Limited | ❌ No | ⭐⭐⭐ Good |
| **Encoder Built-in** | $0 | ⭐ Easy | ⚠️ 30% | ⚠️ Varies | ❌ No | ⭐⭐⭐ Good |
| **Hybrid AWS+AMS** | $461/mo | ⭐⭐ Easy | ✅ 100% | ✅ Yes | ✅ Full | ⭐⭐⭐⭐ Great |
| **Custom Plugin** | $5k-15k | ⭐⭐⭐⭐⭐ Expert | ✅ 100% | ✅ Yes | ✅ Full | ⭐⭐ Niche |

---

## Recommended Approach for Red Corner

### Phase 1: Trial Period (Now - Nov 17)

**Test Stamp Plugin:**
1. Purchase Stamp plugin ($299)
2. Install on your Ant Media trial server
3. Test with 1-2 streams
4. Evaluate if text/image overlays meet your needs
5. Test REST API integration with your workflow

**Parallel Test OBS:**
1. Install OBS Studio on spare PC/VM
2. Configure SRT input from one encoder
3. Add browser source with HTML5 overlay
4. Output to Ant Media test stream
5. Compare quality and reliability

**Total Trial Investment: $299 (Stamp only, OBS is free)**

### Phase 2: Decision Point (Nov 17)

**Option A: Stamp Plugin Sufficient (70% of use cases)**
- **Cost:** $141/mo (Ant Media) + $299 one-time (Stamp) = **$141/mo ongoing**
- **Savings:** $1,459/mo vs AWS
- **Features:** 70% of AWS overlay capability
- **Complexity:** Low

**Option B: OBS Studio Required (100% parity)**
- **Cost:** $141/mo (Ant Media) + $48/mo (OBS server) = **$189/mo**
- **Savings:** $1,411/mo vs AWS
- **Features:** 100% of AWS overlay capability
- **Complexity:** Medium
- **Add Stamp for redundancy:** $189/mo + $299 one-time

**Option C: Hybrid Approach (safest)**
- **Cost:** $320/mo (1 AWS channel) + $141/mo (Ant Media) = **$461/mo**
- **Savings:** $1,139/mo vs AWS
- **Features:** 100% AWS on 1 channel, basic on 4 channels
- **Complexity:** Medium

### Phase 3: Production Migration

**Recommended: Start with Option A (Stamp)**
1. Purchase Stamp plugin
2. Migrate 3-4 simple overlay streams to Ant Media
3. Keep 1-2 complex streams on AWS temporarily
4. After 30 days, evaluate:
   - If Stamp works: migrate all to Ant Media
   - If need more: add OBS or stay hybrid

---

## Example: Red Corner Scoreboard Implementation

### Current AWS Setup
```html
<!-- Hosted on S3, loaded by MediaLive -->
<!DOCTYPE html>
<html>
<head>
<style>
  #scoreboard {
    background: rgba(255, 0, 0, 0.8);
    color: white;
    padding: 20px;
    font-size: 60px;
    font-family: 'Arial Black';
  }
</style>
</head>
<body>
  <div id="scoreboard">
    <span id="fighter1">Fighter 1: 0</span> |
    <span id="fighter2">Fighter 2: 0</span> |
    <span id="round">Round 1</span> |
    <span id="time">3:00</span>
  </div>
  <script>
    // Update every second from API
    setInterval(() => {
      fetch('/api/score').then(r => r.json()).then(data => {
        document.getElementById('fighter1').textContent = `${data.f1_name}: ${data.f1_score}`;
        document.getElementById('fighter2').textContent = `${data.f2_name}: ${data.f2_score}`;
        document.getElementById('round').textContent = `Round ${data.round}`;
        document.getElementById('time').textContent = data.time;
      });
    }, 1000);
  </script>
</body>
</html>
```

### Ant Media + Stamp Plugin Equivalent
```bash
# Create scoreboard overlay
curl -X POST "http://134.199.150.238:5080/LiveApp/v2/broadcasts/fight1/stamp" \
-H "Content-Type: application/json" \
-d '{
  "type": "text",
  "content": "Fighter 1: 0 | Fighter 2: 0 | Round 1 | 3:00",
  "x": 50,
  "y": 50,
  "fontSize": 60,
  "fontFamily": "Arial Black",
  "fontColor": "#FFFFFF",
  "backgroundColor": "#FF0000",
  "opacity": 0.8,
  "padding": 20
}'

# Update scoreboard (call from your scoring system)
curl -X PUT "http://134.199.150.238:5080/LiveApp/v2/broadcasts/fight1/stamp/STAMP_ID" \
-H "Content-Type: application/json" \
-d '{
  "content": "John Doe: 2 | Jane Smith: 1 | Round 2 | 2:45"
}'
```

**Pros:**
- ✅ Same visual result
- ✅ REST API integration (similar workflow)
- ✅ Dynamic updates without restart

**Cons:**
- ⚠️ Less flexible formatting (single text string vs HTML elements)
- ⚠️ No JavaScript logic (must format on server-side)

### Ant Media + OBS Studio Equivalent
```javascript
// Exact same HTML as AWS, hosted on web server
// OBS loads as Browser Source
// 100% identical functionality
```

**Pros:**
- ✅ Exact same HTML/CSS/JS code
- ✅ Zero migration effort for overlays
- ✅ Full JavaScript logic preserved

**Cons:**
- ⚠️ Requires OBS server

---

## Next Steps

### Immediate (This Week)
1. **Purchase Stamp Plugin** ($299) from https://antmedia.io/marketplace/stamp-app/
2. **Install on your trial server**
3. **Test with one stream:**
   - Create simple text overlay
   - Update it dynamically via API
   - Verify it meets your needs

### Short-term (During Trial)
1. **Test OBS Studio** (free) as backup plan
2. **Document your overlay requirements:**
   - How complex are your HTML5 overlays?
   - How often do they update?
   - Could they be simplified to text+images?
3. **Calculate ROI:**
   - Stamp: $299 one-time + $141/mo = **breakeven in 1 month**
   - OBS: $48/mo + $141/mo = **breakeven in 1 month**
   - Either way, massive savings vs AWS

### Decision Point (Nov 17)
Based on trial results, choose:
- **Stamp Only** - If text/image overlays sufficient
- **Stamp + OBS** - If need occasional HTML5 complexity
- **Hybrid** - If critical streams require AWS reliability

---

## Documentation & Resources

### Stamp Plugin
- **Product Page:** https://antmedia.io/marketplace/stamp-app/
- **Documentation:** https://streamtoolbox.com/ams-stamp-reference/
- **Vendor:** StreamToolbox.com
- **Support:** support@streamtoolbox.com
- **Price:** $299 one-time per server

### OBS Studio
- **Download:** https://obsproject.com/
- **Documentation:** https://obsproject.com/wiki/
- **Automation:** https://github.com/obsproject/obs-websocket
- **Price:** Free (open source)

### FFmpeg
- **Documentation:** https://ffmpeg.org/documentation.html
- **Overlay Filter:** https://ffmpeg.org/ffmpeg-filters.html#overlay
- **DrawText Filter:** https://ffmpeg.org/ffmpeg-filters.html#drawtext
- **Price:** Free (open source)

---

**Document Version:** 1.0
**Created:** November 4, 2025
**For:** Red Corner Ant Media Trial
**Trial Ends:** November 17, 2025
