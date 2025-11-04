# AWS MediaLive vs Ant Media Server - Cost & Feature Comparison

## Executive Summary

**Current Setup (AWS MediaLive):**
- Monthly cost: **~$500-2000+** depending on usage
- Pay-per-hour for active channels
- Requires multiple AWS services (MediaLive, MediaConnect, S3, CloudFront)
- Enterprise-grade reliability and scale

**Proposed Setup (Ant Media Server on Digital Ocean):**
- Monthly cost: **~$99-199** (Digital Ocean + Ant Media license)
- Flat monthly fee regardless of usage
- Single server, single dashboard
- Enterprise features with self-hosting control

**Potential Savings: $400-1800+ per month (60-90% cost reduction)**

---

## Cost Breakdown

### AWS MediaLive Current Costs

#### MediaLive Channel Pricing (Sydney Region)
| Service | Price | Usage (5 channels) | Monthly Cost |
|---------|-------|-------------------|--------------|
| MediaLive HD Input | $2.40/hour | 5 channels × 24/7 | $864/month |
| MediaLive HD Output (Standard) | $1.80/hour | 5 streams | $648/month |
| Data Transfer Out | $0.114/GB | ~500GB | $57/month |
| **MediaLive Subtotal** | | | **~$1,569/month** |

#### Additional AWS Services
| Service | Purpose | Monthly Cost |
|---------|---------|--------------|
| S3 Storage | HLS segment storage | $23/TB |
| CloudFront | CDN delivery | $0.114/GB + requests |
| MediaConnect | SRT input (if used) | $0.08/hour per input |
| Lambda | Overlay management | $0-5 |
| **AWS Total** | | **$1,600-2,000+/month** |

**Note:** Costs increase with:
- More channels running
- Higher resolution (4K)
- Longer uptime
- More viewers (bandwidth)

### Ant Media Server Costs

#### Digital Ocean (Current Server)
| Resource | Specs | Monthly Cost |
|----------|-------|--------------|
| Droplet | 8GB RAM / 4 vCPU / 150GB SSD | $48/month |
| Bandwidth | 5TB included | $0 |
| Additional Storage | 100GB volumes | $10/month |
| **DO Subtotal** | | **$58/month** |

#### Ant Media License
| License Type | Cost | Best For |
|--------------|------|----------|
| Monthly | $99/month | Trial/short-term |
| Annual | $999/year ($83/month) | 1-year commitment |
| Triannual | $2,499/3 years ($69/month) | Long-term savings |
| **Perpetual** | **$4,999 one-time** | **Permanent license** |

#### Total Monthly Cost (Ant Media)
| Configuration | Monthly Cost |
|---------------|--------------|
| DO + Monthly License | **$157/month** |
| DO + Annual License (amortized) | **$141/month** |
| DO + Perpetual License (amortized over 3 years) | **$197/month** |
| DO + Perpetual License (amortized over 5 years) | **$141/month** |

### Cost Comparison Summary

| Scenario | AWS MediaLive | Ant Media | Monthly Savings |
|----------|---------------|-----------|-----------------|
| 5 Channels, 24/7 | $1,600-2,000 | $141-157 | **$1,443-1,859** |
| 5 Channels, 12h/day | $800-1,000 | $141-157 | **$643-859** |
| 10 Channels, 24/7 | $3,200-4,000 | $141-157* | **$3,043-3,859** |

*With Ant Media, you pay the same regardless of channel count (limited by server resources)

### Annual Cost Comparison

| Setup | Year 1 | Year 2 | Year 3 | 3-Year Total |
|-------|--------|--------|--------|--------------|
| AWS MediaLive (5ch, 24/7) | $19,200 | $19,200 | $19,200 | **$57,600** |
| Ant Media Annual | $1,695 | $1,695 | $1,695 | **$5,085** |
| Ant Media Perpetual | $5,695 | $696 | $696 | **$7,087** |
| **Savings vs AWS** | **$13,505** | **$17,505** | **$17,505** | **$50,513** |

---

## Feature Comparison

### Input Protocols

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| SRT | ✅ (via MediaConnect, extra cost) | ✅ Built-in, included |
| RTMP | ✅ Push/Pull | ✅ Push/Pull |
| RTSP | ✅ Pull | ✅ Pull |
| WebRTC | ❌ | ✅ Ultra-low latency |
| HLS Pull | ✅ | ✅ |
| UDP/RTP | ✅ | ✅ |

### Output Formats

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| HLS | ✅ Industry standard | ✅ Industry standard |
| CMAF | ✅ | ✅ |
| DASH | ✅ | ✅ |
| RTMP Push | ✅ Multi-destination | ✅ Unlimited destinations |
| WebRTC | ❌ | ✅ Sub-second latency |
| MP4 Recording | ✅ (via S3) | ✅ Local/S3 |

### Transcoding & Quality

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| Adaptive Bitrate (ABR) | ✅ | ✅ Enterprise only |
| Multi-bitrate profiles | ✅ Unlimited | ✅ Configurable |
| H.264 | ✅ | ✅ |
| H.265/HEVC | ✅ Additional cost | ✅ Included |
| GPU Acceleration | ✅ | ✅ NVIDIA/Intel |
| Custom encoding | ✅ | ✅ |
| Resolution | Up to 4K | Up to 4K |

### Streaming Features

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| Multi-destination | ✅ | ✅ Unlimited |
| HTML5 Overlays | ✅ (via Motion Graphics) | ⚠️ Pre-encoding overlays |
| Live Recording | ✅ to S3 | ✅ Local/Cloud |
| DVR/Timeshift | ✅ | ✅ |
| Live Thumbnail | ✅ | ✅ |
| Closed Captions | ✅ | ✅ |
| Audio-only streams | ✅ | ✅ |

### Reliability & Scale

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| Uptime SLA | 99.99% | Self-managed |
| Auto-failover | ✅ Redundant pipelines | ✅ Clustering (Enterprise) |
| Geographic distribution | ✅ Global | ✅ Manual deployment |
| Load balancing | ✅ Automatic | ✅ Origin-edge setup |
| CDN integration | ✅ CloudFront | ✅ Any CDN |
| Max concurrent viewers | Unlimited (with CloudFront) | Unlimited (with CDN) |

### Management & Monitoring

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| Web Dashboard | ✅ AWS Console | ✅ Built-in UI |
| REST API | ✅ | ✅ |
| Real-time monitoring | ✅ CloudWatch | ✅ Built-in |
| Alerts | ✅ SNS/CloudWatch | ✅ Webhooks |
| Stream analytics | ✅ | ✅ |
| Viewer statistics | ⚠️ Via CloudFront | ✅ Real-time |
| Cost tracking | ✅ Billing dashboard | N/A (flat fee) |

### Security

| Feature | AWS MediaLive | Ant Media Server |
|---------|---------------|------------------|
| SSL/TLS | ✅ | ✅ |
| Token authentication | ✅ | ✅ |
| IP whitelist | ✅ Security groups | ✅ |
| Encryption at rest | ✅ | ✅ |
| DRM | ✅ Additional services | ✅ Plugins |
| Geographic restrictions | ✅ | ✅ |

---

## Use Case Analysis

### Your Current Requirements (Red Corner)

| Requirement | AWS MediaLive | Ant Media Server | Winner |
|-------------|---------------|------------------|--------|
| **5 live channels** | ✅ $1,600+/mo | ✅ $141-157/mo | 🏆 Ant Media (cost) |
| **SRT input from encoders** | ✅ Requires MediaConnect | ✅ Built-in | 🏆 Ant Media (simpler) |
| **Multi-destination (YouTube/FB)** | ✅ | ✅ | ⚠️ Tie |
| **HLS playback** | ✅ | ✅ | ⚠️ Tie |
| **HTML5 dynamic overlays** | ✅ Advanced | ⚠️ Pre-encoding required | 🏆 AWS (feature) |
| **Cost tracking** | ✅ Real-time | N/A | 🏆 AWS (visibility) |
| **Recording** | ✅ | ✅ | ⚠️ Tie |
| **Low latency** | 6-10 seconds (HLS) | 0.5s (WebRTC), 2-6s (HLS) | 🏆 Ant Media |

### Overall Score: Ant Media 4, AWS 2, Tie 3

**Recommendation:** Ant Media meets all critical requirements at 92% lower cost. Only limitation is dynamic HTML5 overlays.

---

## Migration Complexity

### From AWS MediaLive to Ant Media

| Task | Difficulty | Time Required |
|------|------------|---------------|
| Install Ant Media | ✅ Easy | 15 minutes |
| Configure SRT inputs | ✅ Easy | 30 minutes |
| Setup RTMP destinations | ✅ Easy | 15 minutes per endpoint |
| Replicate overlay workflow | 🟨 Medium | 2-4 hours (redesign) |
| Test all channels | 🟨 Medium | 2-4 hours |
| Migrate recordings | 🟨 Medium | Depends on volume |
| Update monitoring | ✅ Easy | 1 hour |
| **Total Migration Time** | | **1-2 days** |

### Overlay Workaround Options

Since dynamic HTML5 overlays are a key feature of your AWS setup:

**Option 1: Pre-encoding Overlays**
- Hardware encoders apply graphics
- No server-side overlay needed
- Works with Ant Media as-is

**Option 2: OBS Studio Intermediary**
- OBS receives SRT from encoder
- OBS applies browser source overlays
- OBS outputs to Ant Media
- ⚠️ Adds complexity, single point of failure

**Option 3: Hybrid Approach**
- Keep 1 AWS MediaLive channel for overlay-heavy streams
- Use Ant Media for other 4 channels
- Reduces AWS costs by 80%

**Option 4: Custom Overlay Plugin**
- Ant Media supports custom plugins
- Develop FFmpeg overlay integration
- 🟨 Requires development work

---

## Pros & Cons

### AWS MediaLive

**Pros:**
- ✅ Enterprise-grade reliability (99.99% SLA)
- ✅ Fully managed, no server maintenance
- ✅ Scales automatically
- ✅ Advanced HTML5 overlay support
- ✅ Integrated AWS ecosystem
- ✅ Global infrastructure
- ✅ 24/7 AWS support

**Cons:**
- ❌ Very expensive ($1,600-2,000+/month)
- ❌ Complex pricing (hard to predict)
- ❌ Costs increase with usage
- ❌ Requires multiple AWS services
- ❌ Vendor lock-in
- ❌ Overkill for small-medium operations

### Ant Media Server

**Pros:**
- ✅ 92% cost savings vs AWS
- ✅ Predictable flat monthly fee
- ✅ Full control over infrastructure
- ✅ No vendor lock-in
- ✅ Rich feature set (WebRTC, SRT, etc.)
- ✅ Active community
- ✅ Can scale horizontally with clustering
- ✅ Perpetual license option

**Cons:**
- ❌ Self-hosted (you manage the server)
- ❌ No built-in dynamic HTML5 overlays
- ❌ Single point of failure (without clustering)
- ❌ Limited to server resources
- ❌ Support depends on license level
- ❌ Requires technical expertise

---

## Scaling Scenarios

### If Your Needs Grow

#### AWS MediaLive
| Scenario | Monthly Cost |
|----------|--------------|
| 5 channels → 10 channels | $1,600 → **$3,200** |
| HD → 4K | $1,600 → **$4,800+** |
| Add 5TB bandwidth | +$570/month |
| **Scaling Cost:** | **Linear increase** |

#### Ant Media Server
| Scenario | Monthly Cost | Action Required |
|----------|--------------|-----------------|
| 5 channels → 10 channels | $141 → **$141** | Monitor CPU usage |
| HD → 4K | $141 → **$282** | Add 2nd server + license |
| Add 5TB bandwidth | +$50 (DO bandwidth) | |
| **Scaling Cost:** | **Minimal until server limit** |

**Breakeven Point:** Ant Media cheaper until ~30+ channels or specialized AWS features needed.

---

## Risk Assessment

### AWS MediaLive Risks
- **Cost Overruns:** Unexpected bandwidth spikes
- **Vendor Lock-in:** Hard to migrate away
- **Service Changes:** AWS can modify pricing/features

### Ant Media Server Risks
- **Server Failure:** Single point of failure (mitigate with DO snapshots/backups)
- **Maintenance:** You handle updates and security
- **Support:** Community support vs AWS premium support
- **Scaling Limits:** Server resources limit capacity

### Mitigation Strategies
1. **Daily automated backups** (Digital Ocean snapshots)
2. **Monitoring alerts** (CPU, RAM, disk, streams)
3. **Standby server** (powered off, bring online if needed)
4. **Clustering** (2+ servers for redundancy, Enterprise feature)
5. **CDN integration** (CloudFlare, CloudFront for delivery)

---

## Decision Matrix

| Factor | Weight | AWS Score | Ant Media Score |
|--------|--------|-----------|-----------------|
| **Cost** | 30% | 2/10 | 10/10 |
| **Features** | 25% | 9/10 | 8/10 |
| **Reliability** | 20% | 10/10 | 7/10 |
| **Ease of Use** | 15% | 7/10 | 8/10 |
| **Scalability** | 10% | 10/10 | 7/10 |
| **Weighted Total** | | **7.25/10** | **8.35/10** |

**Winner: Ant Media Server** (for Red Corner's use case)

---

## Recommendations

### Short-term (14-day trial)
1. ✅ **Keep AWS MediaLive running** (don't cancel yet)
2. ✅ **Run Ant Media in parallel** for testing
3. ✅ Test all features thoroughly
4. ✅ Compare stream quality side-by-side
5. ✅ Monitor server performance under load
6. ✅ Identify any missing features

### Medium-term (After trial)
If Ant Media meets needs:
1. **Migrate 4 channels to Ant Media**
2. **Keep 1 AWS channel** for overlay-heavy content
3. **Reduce AWS costs by 80%**
4. **Purchase Annual Ant Media license** ($999/year)
5. **Setup automated backups**

### Long-term (6-12 months)
1. **Evaluate full migration** (all channels to Ant Media)
2. **Consider clustering** (2 servers for redundancy)
3. **Develop custom overlay solution** if needed
4. **Purchase perpetual license** ($4,999 one-time)

---

## Conclusion

**For Red Corner's use case (5 channels, SRT input, multi-destination), Ant Media Server offers:**

- ✅ **92% cost savings** ($1,600+ → $141/month)
- ✅ **All critical features** (SRT, multi-destination, HLS, recording)
- ✅ **Better latency** (WebRTC option)
- ✅ **Predictable costs** (flat monthly fee)
- ⚠️ **Trade-off:** Dynamic HTML5 overlays require workaround

**Recommended Action:**
1. Complete 14-day trial
2. Test all workflows
3. Migrate 80% of channels to Ant Media
4. Keep AWS for overlay-dependent streams
5. Re-evaluate full migration after 3 months

**ROI Timeline:**
- Monthly savings: **$1,443-1,859**
- Annual savings: **$17,316-22,308**
- Ant Media license pays for itself in: **<1 month**

---

**Document Version:** 1.0
**Date:** November 3, 2025
**Author:** Technical Analysis
**Next Review:** After 14-day trial completion
