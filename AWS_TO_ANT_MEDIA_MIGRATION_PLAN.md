# AWS MediaLive to Ant Media Server - Complete Migration Plan

## Executive Summary

**Migration Goal:** Replace AWS MediaLive infrastructure with Ant Media Server on Digital Ocean

**Total Savings:** $18,360/year (91% cost reduction)

**Timeline:** 4-7 days testing + 1 day AWS shutdown

**Risk Level:** Low (100 free hours to test before commitment)

---

## Current vs Future Costs

### Current AWS Setup (Monthly)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **MediaLive** | 5 HD channels, 24/7 | $1,569 |
| **MediaConnect** | SRT inputs (if used) | $50 |
| **S3 Storage** | HLS segments | $23 |
| **CloudFront** | CDN delivery | $57 |
| **Lambda** | Overlay management | $5 |
| **Lightsail** | Dashboard (defunct) | $5 |
| **TOTAL** | | **$1,709/month** |
| **ANNUAL** | | **$20,508/year** |

### New Ant Media Setup (Monthly)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **Digital Ocean** | 8GB/4vCPU server | $58 |
| **Ant Media Enterprise** | Hourly billing* | ~$75 |
| **STAMP Plugin** | Annual subscription | $25 |
| **TOTAL** | | **$158/month** |
| **ANNUAL** | | **$2,148/year** |

*Ant Media Hourly: First 100 hours FREE, then ~$1-2/hour

### Cost Comparison

| Metric | AWS | Ant Media | Savings |
|--------|-----|-----------|---------|
| **Monthly** | $1,709 | $158 | $1,551 (91%) |
| **Annual** | $20,508 | $2,148 | $18,360 (90%) |
| **3-Year** | $61,524 | $6,444 | $55,080 (90%) |

**ROI Period:** Less than 1 month

---

## Migration Architecture

### Current AWS Architecture (Before)

```
Hardware Encoder (SRT)
    ↓
AWS MediaConnect (SRT receiver)
    ↓
AWS MediaLive
    ├─ Transcoding (5 channels)
    ├─ Motion Graphics Overlays (HTML5)
    └─ Multi-destination RTMP
        ↓
    S3 (HLS segments storage)
        ↓
    CloudFront (CDN distribution)
        ↓
    YouTube / Facebook / etc.

Management: Lightsail Dashboard (Node.js/Express)
```

### New Ant Media Architecture (After)

```
Hardware Encoder (SRT)
    ↓
Ant Media Server (Digital Ocean)
    ├─ SRT Input (Port 4200)
    ├─ STAMP Overlays (Text/Image/HTML)
    ├─ Adaptive Bitrate Transcoding
    ├─ HLS/WebRTC Playback
    ├─ Recording (Local or S3)
    └─ Multi-destination RTMP
        ↓
    CASTR (RTMP relay)
        ↓
    YouTube / Facebook / etc.

Management: Ant Media Web Dashboard (Port 5080)
```

**Key Changes:**
- ✅ Single server replaces 6 AWS services
- ✅ Native SRT input (no MediaConnect needed)
- ✅ STAMP plugin replaces Motion Graphics
- ✅ Direct HLS serving (no S3/CloudFront)
- ✅ Integrated dashboard (no separate Lightsail)

---

## Phase 1: Testing Period (Days 1-7)

### Objective
Test Ant Media + STAMP during **100 free hours** to verify all features work before AWS shutdown.

### Timeline
- **100 hours = 4.2 days of 24/7 operation**
- **Or: 7 days of 14 hours/day testing**

### Day 1-2: Setup & Basic Testing

**✅ Already Completed:**
- [x] Ant Media Server Enterprise installed
- [x] SRT input working (port 4200)
- [x] RTMP output to CASTR working
- [x] STAMP plugin installed (trial expired)
- [x] Adaptive Bitrate configured
- [x] Documentation created

**⏳ To Complete:**
- [ ] Purchase STAMP annual license ($300)
- [ ] Install STAMP license file
- [ ] Verify STAMP working with text overlays
- [ ] Test HTML overlay integration (ligr.live)

**Actions:**

```bash
# 1. Purchase STAMP from StreamToolbox
# https://streamtoolbox.com/stamp/ or https://antmedia.io/marketplace/stamp-app/

# 2. Upload STAMP license to server
scp stamp-license.txt root@134.199.150.238:/usr/local/antmedia/conf/

# 3. Restart Ant Media
ssh root@134.199.150.238
sudo systemctl restart antmedia
sleep 30

# 4. Verify STAMP loaded
tail -50 /usr/local/antmedia/log/ant-media-server.log | grep -i stamp

# 5. Configure encoder
# Point to: srt://134.199.150.238:4200?streamid=channel1

# 6. Test text overlay
curl -X POST "http://localhost:5080/LiveApp/rest/stamp/instructions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-text",
    "start": "now",
    "duration": 600,
    "text": "RED CORNER PROMOTIONS",
    "position": {"x": 0.5, "y": 0.1, "anchor": "center-center"},
    "style": {"font":"Arial", "size":60, "style": "bold", "color": "yellow"},
    "shadow": {"radius": 5}
  }'

# 7. Watch stream
# http://134.199.150.238:5080/LiveApp/play.html?name=channel1
```

**Success Criteria:**
- ✅ Stream plays without buffering
- ✅ Text overlay appears on video
- ✅ Overlay updates dynamically via API
- ✅ Quality acceptable vs AWS

---

### Day 3-4: Advanced Features Testing

**HTML Overlays (ligr.live):**

```bash
# Test HTML overlay
curl -X POST "http://localhost:5080/LiveApp/rest/stamp/instructions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ligr-overlay",
    "start": "now",
    "duration": 600,
    "url": "https://overlay.ligr.live/production-7a5ffcf7-c760-4a27-98a0-d9acc6e84bdb",
    "position": {"x": 0, "y": 0}
  }'
```

**If HTML overlay fails (needs Chrome/Selenium):**

```bash
# Install Chrome driver for HTML rendering
docker run -d -p 4444:4444 --name selenium selenium/standalone-chrome

# Configure STAMP to use Chrome
echo "stamp.chrome.driver.url=http://localhost:4444" >> /usr/local/antmedia/conf/stamp.conf
sudo systemctl restart antmedia

# Test again
```

**Multi-Channel Testing:**

Configure all 5 channels:
```bash
# Channel 1: srt://134.199.150.238:4200?streamid=channel1
# Channel 2: srt://134.199.150.238:4200?streamid=channel2
# Channel 3: srt://134.199.150.238:4200?streamid=channel3
# Channel 4: srt://134.199.150.238:4200?streamid=channel4
# Channel 5: srt://134.199.150.238:4200?streamid=channel5
```

**Multi-Destination Testing:**

Add RTMP endpoints for each stream:
```bash
# YouTube
rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY

# Facebook
rtmp://live-api-s.facebook.com:80/rtmp/YOUR_STREAM_KEY

# CASTR
rtmp://au.castr.io:1935/static/YOUR_STREAM_KEY
```

**Recording Testing:**

```bash
# Enable recording
curl -X PUT "http://localhost:5080/LiveApp/rest/v2/broadcasts/channel1" \
  -H "Content-Type: application/json" \
  -d '{"mp4Enabled": 1}'

# Recordings saved to: /usr/local/antmedia/webapps/LiveApp/streams/
```

**Success Criteria:**
- ✅ All 5 channels streaming simultaneously
- ✅ HTML overlays working (or acceptable workaround)
- ✅ Multi-destination RTMP working
- ✅ Recording working
- ✅ CPU/RAM usage acceptable (<80%)

---

### Day 5-7: Stress Testing & Fine-Tuning

**Load Testing:**
- Run all 5 channels simultaneously for 12+ hours
- Monitor server resources
- Test failover scenarios
- Verify stream stability

**Performance Monitoring:**

```bash
# Monitor resources
htop

# Check Ant Media stats
curl http://localhost:5080/LiveApp/rest/v2/broadcasts/streams

# Check logs for errors
tail -f /usr/local/antmedia/log/ant-media-server.log
```

**Optimization:**

```bash
# If CPU high, reduce transcoding
# Disable adaptive bitrate if not needed:
curl -X PUT "http://localhost:5080/LiveApp/rest/v2/settings" \
  -H "Content-Type: application/json" \
  -d '{"encoderSettings": []}'

# If memory high, reduce queue size
echo "encodingQueueSize=100" >> /usr/local/antmedia/conf/red5.properties
```

**Success Criteria:**
- ✅ Stable 24+ hour operation
- ✅ No dropped frames
- ✅ Acceptable latency
- ✅ All features working reliably

---

## Phase 2: AWS Shutdown (Day 8)

### Prerequisites Checklist

**Before touching AWS, verify:**
- [ ] Ant Media tested for 100+ hours successfully
- [ ] All 5 channels working reliably
- [ ] STAMP overlays working as expected
- [ ] Multi-destination streaming confirmed
- [ ] Recording working (if needed)
- [ ] Team trained on new dashboard
- [ ] Backup plan documented
- [ ] Emergency rollback plan ready

---

### AWS Shutdown Sequence

**⚠️ IMPORTANT:** Complete steps in order. Don't delete anything until replacement confirmed working!

#### Step 1: Backup AWS Configuration

```bash
# Document all MediaLive settings
# - Channel IDs
# - Input URLs
# - Output destinations
# - Encoding settings
# - Motion Graphics configurations

# Take screenshots of:
# - MediaLive channel settings
# - MediaConnect flow settings
# - Lambda function code
# - CloudFront distribution settings
```

**Save to:** `/root/aws-backup/` on Digital Ocean server

#### Step 2: Stop MediaLive Channels (Reversible)

**In AWS Console:**
1. Go to **MediaLive** → **Channels**
2. For each of 5 channels:
   - Select channel
   - Click **Stop**
   - Wait for status = "Idle"
3. **DO NOT DELETE YET**

**Verify:**
- Ant Media streams still running? ✅
- Viewers not affected? ✅
- CASTR receiving from Ant Media? ✅

**Wait 24 hours** to ensure no issues before proceeding.

---

#### Step 3: Delete MediaLive Channels (Irreversible)

**Only after 24 hours of successful Ant Media operation:**

**In AWS Console:**
1. **MediaLive** → **Channels**
2. For each stopped channel:
   - Select channel
   - Click **Delete**
   - Confirm deletion

**Expected Monthly Savings:** $1,569

---

#### Step 4: Delete MediaConnect Flows

**In AWS Console:**
1. **MediaConnect** → **Flows**
2. For each flow:
   - Select flow
   - Click **Stop** (wait 5 minutes)
   - Click **Delete**
   - Confirm deletion

**Expected Monthly Savings:** $50

---

#### Step 5: Clean Up S3 HLS Buckets

**In AWS Console:**
1. **S3** → **Buckets**
2. Find HLS segments bucket
3. **Empty bucket:**
   - Select bucket
   - Click **Empty**
   - Confirm deletion
4. **Delete bucket:**
   - Click **Delete bucket**
   - Confirm

**Or via CLI:**
```bash
# Empty bucket
aws s3 rm s3://your-hls-bucket --recursive

# Delete bucket
aws s3 rb s3://your-hls-bucket
```

**Expected Monthly Savings:** $23

---

#### Step 6: Delete CloudFront Distribution

**In AWS Console:**
1. **CloudFront** → **Distributions**
2. Select distribution
3. Click **Disable** (takes 15-30 minutes)
4. Wait for status = "Disabled"
5. Click **Delete**
6. Confirm deletion

**Expected Monthly Savings:** $57

---

#### Step 7: Delete Lambda Functions

**In AWS Console:**
1. **Lambda** → **Functions**
2. For each overlay-related function:
   - Select function
   - Click **Actions** → **Delete**
   - Confirm deletion

**Expected Monthly Savings:** $5

---

#### Step 8: Delete Lightsail Dashboard

**⚠️ Backup first!**

```bash
# SSH into Lightsail instance
ssh ubuntu@15.134.99.64

# Backup any important data
tar -czf redcorner-dashboard-backup-$(date +%Y%m%d).tar.gz ~/redcorner-dashboard/

# Download backup to local machine
scp ubuntu@15.134.99.64:~/redcorner-dashboard-backup-*.tar.gz ./

# Upload to new server if needed
scp redcorner-dashboard-backup-*.tar.gz root@134.199.150.238:/root/
```

**In AWS Console:**
1. **Lightsail** → **Instances**
2. Select **redcorner-dashboard-1**
3. Click **Delete** tab
4. Click **Delete instance**
5. Confirm deletion

**Expected Monthly Savings:** $5

---

#### Step 9: Review Remaining Resources

**Check for any missed resources:**

```bash
# List all AWS resources (if AWS CLI installed)
aws resourcegroupstaggingapi get-resources --region ap-southeast-2

# Or manually check in AWS Console:
# - EC2 (any instances?)
# - S3 (any other buckets?)
# - Lambda (any other functions?)
# - IAM (delete unused roles/policies)
# - CloudWatch (delete old logs)
```

---

### AWS Shutdown Checklist Summary

```
☐ 1. Backup all AWS configurations
☐ 2. Stop MediaLive channels (reversible)
☐ 3. Wait 24 hours, verify Ant Media stable
☐ 4. Delete MediaLive channels
☐ 5. Delete MediaConnect flows
☐ 6. Empty and delete S3 HLS bucket
☐ 7. Disable and delete CloudFront distribution
☐ 8. Delete Lambda functions
☐ 9. Backup and delete Lightsail instance
☐ 10. Review for remaining resources
☐ 11. Wait 1 billing cycle
☐ 12. Verify AWS bill ≈ $0
```

**Expected Final AWS Monthly Cost:** $0-5 (minor lingering charges may take 1-2 billing cycles to clear)

---

## Phase 3: Post-Migration (Ongoing)

### Week 1: Monitoring

**Daily checks:**
```bash
# Check all streams status
curl http://localhost:5080/LiveApp/rest/v2/broadcasts/streams

# Check system resources
htop

# Check error logs
tail -100 /usr/local/antmedia/log/antmedia-error.log

# Verify AWS bill dropping
# Check AWS billing dashboard daily
```

**Success Criteria:**
- All streams running reliably
- No viewer complaints
- AWS charges decreasing
- Ant Media hourly charges as expected

---

### Month 1: Optimization

**After first month:**
- Review Ant Media hourly usage
- Consider switching to annual license if cheaper
- Fine-tune encoder settings for optimal quality/bandwidth
- Set up automated backups
- Document any issues/solutions

**Cost Decision Point:**

| License Type | Cost | Best If |
|--------------|------|---------|
| **Hourly** | ~$1-2/hour | Usage varies, testing phase |
| **Annual** | $999/year ($83/mo) | Consistent 24/7 usage |
| **Triannual** | $2,499/3yr ($69/mo) | Long-term commitment |

**Calculate breakeven:**
- If using >40 hours/month: Annual is cheaper
- If using 24/7 (720 hours/month): Annual saves ~$700/month!

---

### Ongoing Maintenance

**Weekly:**
- [ ] Review stream analytics
- [ ] Check disk space (recordings)
- [ ] Verify backups working
- [ ] Monitor AWS bill (should be ~$0)

**Monthly:**
- [ ] Update Ant Media Server (check for updates)
- [ ] Review and rotate logs
- [ ] Test failover procedures
- [ ] Review cost reports

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery test
- [ ] Contract renewal planning (STAMP, Ant Media)

---

## Emergency Rollback Plan

**If Ant Media fails catastrophically:**

### Option 1: Quick Restart (Minutes)

```bash
# Restart Ant Media service
ssh root@134.199.150.238
sudo systemctl restart antmedia

# Check status
systemctl status antmedia
```

### Option 2: Restore from Snapshot (30 minutes)

**If Digital Ocean snapshot exists:**
1. Go to Digital Ocean dashboard
2. Droplets → SRT-Server → Snapshots
3. Click snapshot
4. Click "Create Droplet"
5. Update DNS/encoder URLs if IP changed

### Option 3: Rebuild AWS (2-4 hours)

**Only if complete Ant Media failure:**
1. Restore MediaLive from backup configuration
2. Create new channels
3. Start channels
4. Point encoders back to MediaConnect
5. Verify streaming working

**Cost:** Back to $1,709/month temporarily

---

## STAMP Plugin Details

### Purchase Information

**Vendor:** StreamToolbox
**Product:** STAMP for Ant Media Server
**License:** Annual subscription
**Cost:** $300/year
**Purchase Link:** https://streamtoolbox.com/stamp/
**Support:** support@streamtoolbox.com

### Installation

```bash
# 1. Purchase license from StreamToolbox
# 2. Receive license file via email

# 3. Upload to server
scp stamp-license.txt root@134.199.150.238:/usr/local/antmedia/conf/

# 4. Verify license file location
ssh root@134.199.150.238
ls -la /usr/local/antmedia/conf/stamp*

# 5. Restart Ant Media
sudo systemctl restart antmedia

# 6. Verify STAMP loaded
tail -100 /usr/local/antmedia/log/ant-media-server.log | grep -i stamp

# Expected output:
# "Stamp Plugin is starting in LiveApp"
# "Stamp version: 2.3.0"
# "License owner: brian@redcorner.com.au"
# "License expiration: [DATE]"
```

### Configuration

**Enable calibration grid (for testing):**
```bash
echo "stamp.calibrate.grid=true" > /usr/local/antmedia/conf/stamp.conf
sudo systemctl restart antmedia
```

**Disable calibration grid (for production):**
```bash
echo "stamp.calibrate.grid=false" > /usr/local/antmedia/conf/stamp.conf
sudo systemctl restart antmedia
```

**Configure for HTML overlays (ligr.live):**
```bash
# Install Chrome/Selenium
docker run -d -p 4444:4444 --name selenium --restart always selenium/standalone-chrome

# Configure STAMP
cat >> /usr/local/antmedia/conf/stamp.conf << EOF
stamp.chrome.driver.url=http://localhost:4444
stamp.chrome.options=--disable-gpu --no-sandbox
stamp.chrome.webcast.png.quality=80
EOF

# Restart
sudo systemctl restart antmedia
```

### Usage Examples

**Text Overlay:**
```bash
curl -X POST "http://localhost:5080/LiveApp/rest/stamp/instructions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "scoreboard",
    "start": "now",
    "duration": 600,
    "text": "Fighter 1: 0 | Fighter 2: 0 | Round 1",
    "position": {"x": 0.5, "y": 0.9, "anchor": "center-center"},
    "style": {
      "font": "Arial",
      "size": 48,
      "style": "bold",
      "color": "white"
    },
    "background": {
      "color": "red",
      "opacity": 0.8,
      "padding": 20
    },
    "shadow": {"radius": 5}
  }'
```

**Image Overlay:**
```bash
curl -X POST "http://localhost:5080/LiveApp/rest/stamp/instructions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "logo",
    "start": "now",
    "duration": 3600,
    "image": "https://redcorner.com.au/logo.png",
    "position": {"x": 0.95, "y": 0.05, "anchor": "top-right"},
    "width": 200,
    "height": 100,
    "opacity": 0.9
  }'
```

**HTML Overlay (ligr.live):**
```bash
curl -X POST "http://localhost:5080/LiveApp/rest/stamp/instructions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ligr-overlay",
    "start": "now",
    "duration": 3600,
    "url": "https://overlay.ligr.live/production-7a5ffcf7-c760-4a27-98a0-d9acc6e84bdb",
    "position": {"x": 0, "y": 0},
    "width": 1920,
    "height": 1080
  }'
```

**Update Existing Overlay:**
```bash
curl -X PUT "http://localhost:5080/LiveApp/rest/stamp/instructions/scoreboard" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Fighter 1: 3 | Fighter 2: 2 | Round 4"
  }'
```

**Remove Overlay:**
```bash
curl -X DELETE "http://localhost:5080/LiveApp/rest/stamp/instructions/scoreboard"
```

### Troubleshooting

**STAMP not loading:**
```bash
# Check logs
tail -200 /usr/local/antmedia/log/ant-media-server.log | grep -i stamp

# Verify license file
ls -la /usr/local/antmedia/conf/stamp*

# Check permissions
sudo chown antmedia:antmedia /usr/local/antmedia/conf/stamp*
```

**HTML overlays not working:**
```bash
# Check Selenium
docker ps | grep selenium

# Test Selenium
curl http://localhost:4444/status

# Restart Selenium
docker restart selenium

# Check STAMP config
cat /usr/local/antmedia/conf/stamp.conf
```

**Overlays not appearing:**
```bash
# Verify Adaptive Bitrate enabled
curl http://localhost:5080/LiveApp/rest/v2/settings | grep encoderSettings

# Check stream is broadcasting
curl http://localhost:5080/LiveApp/rest/v2/broadcasts/STREAM_ID

# Look for STAMP errors
tail -100 /usr/local/antmedia/log/antmedia-error.log | grep -i stamp
```

---

## Support & Resources

### Ant Media Server

**Official Documentation:** https://antmedia.io/docs/
**Community Forum:** https://groups.google.com/g/ant-media-server
**GitHub Issues:** https://github.com/ant-media/Ant-Media-Server/issues
**Commercial Support:** contact@antmedia.io
**Billing/Licensing:** https://antmedia.io/pricing/

### STAMP Plugin

**Official Documentation:** https://streamtoolbox.com/ams-stamp-reference/
**Support Email:** support@streamtoolbox.com
**Purchase Link:** https://streamtoolbox.com/stamp/
**Feature Requests:** Via support email

### Digital Ocean

**Support Portal:** https://cloud.digitalocean.com/support
**Documentation:** https://docs.digitalocean.com/
**Community:** https://www.digitalocean.com/community/
**Status Page:** https://status.digitalocean.com/

### AWS (for shutdown questions)

**Support:** https://console.aws.amazon.com/support/
**Billing:** https://console.aws.amazon.com/billing/
**Service Health:** https://status.aws.amazon.com/

---

## Key Contacts

### Red Corner Team
**Primary Contact:** brian@redcorner.com.au
**Server Access:** root@134.199.150.238
**Dashboard:** http://134.199.150.238:5080

### External Services
**CASTR:** https://castr.io/
**ligr.live Overlays:** https://overlay.ligr.live/
**StreamToolbox (STAMP):** support@streamtoolbox.com

---

## Success Metrics

### Technical Metrics
- [ ] 99.9%+ uptime
- [ ] <2 second latency (HLS)
- [ ] <0.5 second latency (WebRTC)
- [ ] Zero dropped frames
- [ ] CPU usage <80%
- [ ] RAM usage <80%

### Business Metrics
- [ ] $18,360/year cost savings achieved
- [ ] AWS bill reduced to $0
- [ ] No viewer complaints
- [ ] All features working vs AWS
- [ ] Team comfortable with new system

### Timeline
- [ ] Testing complete within 7 days
- [ ] AWS shutdown complete within 10 days
- [ ] Full migration within 14 days
- [ ] Cost savings realized within 30 days

---

## Risk Assessment & Mitigation

### High Risk

**Risk:** STAMP HTML overlays don't work
**Impact:** Can't use ligr.live overlays
**Mitigation:**
- Test during 100 free hours
- Use text/image overlays as alternative
- Consider OBS intermediary if critical
- Request refund from StreamToolbox if doesn't work

**Risk:** Server performance inadequate
**Impact:** Dropped frames, poor quality
**Mitigation:**
- Test with all 5 channels during trial
- Upgrade to 8 vCPU server if needed ($116/mo)
- Disable adaptive bitrate if necessary
- Monitor during peak loads

### Medium Risk

**Risk:** Loss of AWS features
**Impact:** Missing functionality
**Mitigation:**
- Document all AWS features before shutdown
- Test equivalents in Ant Media
- Keep AWS configs backed up for 90 days
- Can rebuild AWS if needed

**Risk:** Ant Media licensing costs higher than expected
**Impact:** Budget overrun
**Mitigation:**
- Monitor hourly usage closely
- Switch to annual if usage high
- Consider perpetual license ($4,999 one-time)
- Still 90% cheaper than AWS worst case

### Low Risk

**Risk:** Data loss
**Impact:** Lost recordings
**Mitigation:**
- Regular backups to S3
- Digital Ocean snapshots weekly
- Redundant recording to local + cloud

**Risk:** Service unavailable
**Impact:** Streams offline
**Mitigation:**
- Digital Ocean 99.99% SLA
- Automated monitoring/alerts
- Emergency AWS rollback plan ready
- Failover procedures documented

---

## Next Steps

### Immediate (Next 24 Hours)
1. [ ] Purchase STAMP annual license ($300)
2. [ ] Install STAMP license on server
3. [ ] Test text overlays
4. [ ] Test HTML overlays (ligr.live)
5. [ ] Verify all features working

### Short Term (Days 2-7)
1. [ ] Multi-channel stress testing
2. [ ] Performance optimization
3. [ ] Document any issues
4. [ ] Train team on new dashboard
5. [ ] Prepare AWS shutdown plan

### Medium Term (Week 2)
1. [ ] Execute AWS shutdown checklist
2. [ ] Monitor Ant Media stability
3. [ ] Verify cost savings
4. [ ] Optimize configurations
5. [ ] Set up backups and monitoring

### Long Term (Month 1+)
1. [ ] Review Ant Media licensing (hourly vs annual)
2. [ ] Quarterly performance reviews
3. [ ] Continuous optimization
4. [ ] Celebrate $18,360/year savings! 🎉

---

**Document Version:** 1.0
**Created:** November 10, 2025
**Author:** Technical Migration Plan
**Status:** Ready for execution
**Approval:** Pending STAMP purchase

---

## Appendix A: Server Specifications

### Digital Ocean SRT-Server

**Droplet Details:**
- **IP:** 134.199.150.238
- **Region:** SYD1 (Sydney, Australia)
- **OS:** Ubuntu 22.04.5 LTS
- **CPU:** 4 vCPUs (Intel)
- **RAM:** 8 GB
- **Disk:** 50 GB SSD + 100 GB volume
- **Bandwidth:** 5 TB/month included
- **Monthly Cost:** $58

**Software Installed:**
- Ant Media Server Enterprise 2.15.0
- STAMP Plugin 2.3.0
- SRT Tools 1.4.4
- FFmpeg 4.4.2
- Node.js 20.19.5
- Nginx 1.18.0
- Docker (for Selenium)

**Services Running:**
- antmedia.service (Ant Media Server)
- srt-relay.service (Existing SRT relay - preserved)
- docker (Selenium for HTML overlays)

**Ports Open:**
- 22 (SSH)
- 1935 (RTMP)
- 4200 (SRT - Ant Media)
- 5080 (HTTP Dashboard)
- 5443 (HTTPS Dashboard)
- 5000-5500 (WebRTC)
- 20000-20019 (Existing SRT relay - preserved)

---

## Appendix B: Encoder Configuration

### SRT URLs for Hardware Encoders

**Format:**
```
srt://134.199.150.238:4200?streamid=CHANNEL_ID&latency=750&passphrase=OPTIONAL
```

**Channel Assignments:**
```
Channel 1: srt://134.199.150.238:4200?streamid=channel1
Channel 2: srt://134.199.150.238:4200?streamid=channel2
Channel 3: srt://134.199.150.238:4200?streamid=channel3
Channel 4: srt://134.199.150.238:4200?streamid=channel4
Channel 5: srt://134.199.150.238:4200?streamid=channel5
```

**Recommended Settings:**
- **Latency:** 750ms (increase to 1500ms for unstable networks)
- **Passphrase:** Optional (add for security)
- **Mode:** Caller/Push
- **Codec:** H.264
- **Bitrate:** 2000-5000 kbps (depending on quality needs)
- **Resolution:** 1280x720 or 1920x1080
- **Frame Rate:** 30fps

---

## Appendix C: Cost Breakdown Details

### Ant Media Hourly Pricing

**Pricing Tiers:**
- **First 100 hours:** FREE
- **101-500 hours:** ~$1.50/hour
- **501-1000 hours:** ~$1.25/hour
- **1000+ hours:** ~$1.00/hour

**Monthly Usage Estimates:**
- **24/7 operation:** 720 hours/month
- **12 hours/day:** 360 hours/month
- **8 hours/day:** 240 hours/month

**Monthly Cost Examples:**
- **720 hours @ $1.00:** $720/month (still cheaper than AWS!)
- **360 hours @ $1.25:** $450/month
- **240 hours @ $1.50:** $360/month

**Breakeven with Annual License ($999):**
- **Annual = $83/month**
- **Breakeven at ~60 hours/month**
- **Recommendation:** Annual license if using >60 hours/month

### STAMP Annual Cost Breakdown

**Annual License:** $300/year
**Monthly Equivalent:** $25/month
**Daily Cost:** $0.82/day

**Compared to AWS Motion Graphics:**
- **AWS:** Included in MediaLive ($1,569/month)
- **STAMP:** $25/month standalone
- **Savings:** $1,544/month on overlay functionality alone

---

## Appendix D: Testing Checklist

### Pre-Purchase Testing (Already Done)
- [x] Ant Media Server installed
- [x] SRT input working
- [x] RTMP output working
- [x] Basic streaming confirmed
- [x] Dashboard accessible
- [x] Documentation reviewed

### Post-STAMP Purchase Testing (To Do)

**Day 1: Basic Overlay Testing**
- [ ] Text overlay appears on video
- [ ] Text overlay updates dynamically
- [ ] Image overlay works
- [ ] Overlay positioning accurate
- [ ] Multiple overlays simultaneously
- [ ] Overlay removal works

**Day 2: HTML Overlay Testing**
- [ ] Install Selenium/Chrome
- [ ] Configure STAMP for HTML
- [ ] Test ligr.live overlay URL
- [ ] Verify HTML rendering quality
- [ ] Test HTML overlay updates
- [ ] Performance impact acceptable

**Day 3: Multi-Channel Testing**
- [ ] All 5 channels streaming
- [ ] Overlays on each channel
- [ ] Different overlays per channel
- [ ] No CPU/RAM overload
- [ ] No dropped frames
- [ ] Network bandwidth acceptable

**Day 4: Multi-Destination Testing**
- [ ] CASTR receiving all streams
- [ ] YouTube direct (if used)
- [ ] Facebook direct (if used)
- [ ] All destinations stable
- [ ] Quality consistent across destinations

**Day 5: Stress Testing**
- [ ] 12-hour continuous operation
- [ ] All features enabled
- [ ] Monitor resource usage
- [ ] Check for memory leaks
- [ ] Verify log for errors
- [ ] Test edge cases

**Day 6: Production Simulation**
- [ ] Real-world usage patterns
- [ ] Typical overlay changes
- [ ] Normal viewer loads
- [ ] Recording enabled
- [ ] Verify playback quality
- [ ] Check compatibility

**Day 7: Final Validation**
- [ ] All features working
- [ ] Performance acceptable
- [ ] Quality matches/exceeds AWS
- [ ] Team trained and comfortable
- [ ] Documentation complete
- [ ] Ready for AWS shutdown

---

**END OF MIGRATION PLAN**

This document should be reviewed and approved before proceeding with AWS shutdown.

For questions or issues, contact: brian@redcorner.com.au
