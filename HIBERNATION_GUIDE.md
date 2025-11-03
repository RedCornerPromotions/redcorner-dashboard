# Red Corner - Deep Hibernation Guide

When you don't need the streaming system for weeks or months, put it into **deep hibernation** to minimize AWS costs.

## 💰 Cost Comparison

| State | Monthly Cost | When to Use |
|-------|--------------|-------------|
| **Running** | $4,080+ | Actively streaming |
| **IDLE (awake)** | $35-45 | Ready for instant streaming |
| **Deep Hibernation** | $3-8 | Off-season (weeks/months) |

**Savings: $30-40/month during hibernation!**

---

## 🛌 How to Hibernate (End of Season)

### Step 1: Run Hibernation Script

SSH into your Lightsail server:

```bash
cd ~/redcorner-dashboard
chmod +x hibernate.sh
./hibernate.sh
```

This script will:
- ✅ Stop all MediaLive channels
- ✅ Delete MediaConnect flows (stop billing)
- ✅ Export your configuration to `hibernation-backup.txt`
- ✅ Show you final status and next steps

### Step 2: Stop Lightsail Instance

Go to AWS Lightsail Console:
1. https://lightsail.aws.amazon.com/
2. Click your instance: **ip-172-26-12-186**
3. **RECOMMENDED:** Click "Snapshots" → Create snapshot first (backup)
4. Click **Actions** → **Stop**
5. Wait for "Stopped" status

**Your dashboard will go offline** (https://dashboard.redcorner.com.au won't work)

### Step 3 (Optional): Delete IDLE Channels

To save an additional **$29/month per channel**:

1. Go to MediaLive Console: https://console.aws.amazon.com/medialive/
2. Select your channels
3. Click **Actions** → **Delete**

⚠️ **WARNING:** You'll need to manually recreate channels when waking up (or use CloudFormation template)

**If you skip this step:** Channels stay IDLE and cost $29/month but can be instantly restarted.

---

## ⏰ How to Wake Up (Start of Season)

### Step 1: Start Lightsail Instance

1. Go to: https://lightsail.aws.amazon.com/
2. Click your instance: **ip-172-26-12-186**
3. Click **Actions** → **Start**
4. Wait 2-3 minutes for "Running" status
5. Note the new IP address if it changed

### Step 2: SSH into Server

```bash
ssh ubuntu@15.134.99.64
# (or new IP if it changed)
```

### Step 3: Run Wake-Up Script

```bash
cd ~/redcorner-dashboard
chmod +x wakeup.sh
./wakeup.sh
```

This will:
- ✅ Start PM2 dashboard server
- ✅ Check MediaLive channel status
- ✅ Show you current costs
- ✅ Guide you through any needed setup

### Step 4: Access Dashboard

Go to: https://dashboard.redcorner.com.au

If domain doesn't work (IP changed):
1. Update DNS A record to new Lightsail IP
2. Or access via: `http://NEW-IP:3000`

### Step 5: Start Streaming

1. Configure destinations (RTMP/SRT)
2. Click "Start Channel"
3. Wait 30 seconds
4. Stream should be live!

---

## 📋 What Stays vs Goes During Hibernation

### ✅ Stays Safe (No Data Loss)
- **S3 Recordings** - All your .ts and .mp4 files stay intact
- **Recording Settings** - Your custom filename prefixes
- **Channel Configuration** - Saved in .env and hibernation-backup.txt
- **Lightsail Snapshots** - If you created them before stopping

### ⚠️ Needs Reconfiguration After Wake
- **Stream Destinations** - Need to re-add RTMP/SRT URLs
- **Holding Slide** - Stays in S3, automatically available
- **Overlays** - Need to reconfigure URLs (if using)

### ❌ Deleted During Hibernation
- **MediaConnect Flows** - Auto-deleted (to stop billing)
- **MediaLive Channels** - Only if you manually deleted them in Step 3

---

## 🔧 Troubleshooting

### "Dashboard won't load after wake-up"

**Check DNS:**
```bash
nslookup dashboard.redcorner.com.au
```

If IP is wrong, update your Wix DNS A record to new Lightsail IP.

**Check PM2:**
```bash
pm2 status
pm2 restart redcorner-dashboard
pm2 logs
```

### "Channel won't start"

1. Check AWS MediaLive console - is channel there?
2. If deleted, you'll need to recreate it (or use CloudFormation)
3. Check `.env` file - are `CHANNEL_X_ID` values correct?

### "SSL certificate expired"

If hibernated for 90+ days:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### "Lightsail IP changed"

Update DNS:
1. Go to Wix DNS settings
2. Update A record: `dashboard.redcorner.com.au` → new IP
3. Wait 5-10 minutes for DNS propagation

---

## 💡 Best Practices

### Before Hibernating:
- ✅ Finish all ongoing recordings
- ✅ Convert any .ts files you need to MP4
- ✅ Download important recordings to local storage
- ✅ Create Lightsail snapshot (backup)
- ✅ Document any custom configurations

### During Hibernation:
- ✅ Check AWS billing monthly (should be ~$3-8/month)
- ✅ Keep `hibernation-backup.txt` file safe
- ⚠️ If you get unexpected charges, check for orphaned resources

### After Waking:
- ✅ Test streaming before game day
- ✅ Verify destinations work
- ✅ Check recording quality
- ✅ Update any software if needed

---

## 🚨 Emergency Fast Wake-Up

If you need to stream urgently:

1. **Start Lightsail** (2 minutes)
2. **SSH in and run wakeup.sh** (1 minute)
3. **Open dashboard and start channel** (30 seconds)
4. **Configure destination and stream** (2 minutes)

**Total: ~6 minutes from cold start to live streaming**

(Assuming channels weren't deleted during hibernation)

---

## 📞 Support Checklist

If something goes wrong:

1. Run cost checker:
   ```bash
   node check-costs.js
   ```

2. Check PM2 logs:
   ```bash
   pm2 logs redcorner-dashboard --lines 50
   ```

3. Check MediaLive channels exist:
   - Go to AWS MediaLive Console
   - Verify your channels are there

4. Check S3 bucket access:
   ```bash
   node find-mp4-files.js
   ```

5. Test dashboard access:
   - Try: https://dashboard.redcorner.com.au
   - Try: http://[Lightsail-IP]:3000

---

## 🎯 Next: Ant Media Server

Once you're comfortable with AWS hibernation, consider testing **Ant Media Server** as a replacement:

- **Flat cost:** ~$50-150/month (vs $136/day AWS)
- **No hibernation needed:** Always ready to go
- **Self-hosted:** Full control
- **14-day trial ready:** License key in your email

This could eliminate the need for hibernation altogether!

---

**Questions?** Check the main documentation:
- [USER_GUIDE.md](USER_GUIDE.md) - How to use the dashboard
- [ARCHITECTURE.md](ARCHITECTURE.md) - How the system works
- [README.md](README.md) - Quick start guide
