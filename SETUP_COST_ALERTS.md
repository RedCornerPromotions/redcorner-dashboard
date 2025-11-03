# Cost Alert Email Setup

This guide shows you how to set up automatic email/SMS alerts when AWS resources are left running.

## What It Does

The cost monitor runs on a schedule (via cron) and sends you an email/SMS if:
- Any MediaLive channels are RUNNING
- Any MediaConnect flows are active
- Costing you money

## Setup Steps

### 1. Install nodemailer

```bash
cd ~/redcorner-dashboard
npm install nodemailer
```

### 2. Get Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. App name: "Red Corner Alerts"
4. Click "Create"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Add Email Settings to .env

```bash
nano ~/redcorner-dashboard/.env
```

Add these lines at the bottom:

```bash
# Cost Alert Email Settings
ALERT_EMAIL_HOST=smtp.gmail.com
ALERT_EMAIL_PORT=587
ALERT_EMAIL_USER=your-email@gmail.com
ALERT_EMAIL_PASSWORD=your-16-char-app-password
ALERT_EMAIL_TO=your-email@gmail.com
```

**For SMS alerts instead of email:**
Replace `ALERT_EMAIL_TO` with your carrier's SMS-to-email gateway:

- **Telstra**: `04xxxxxxxx@sms.telstra.com`
- **Optus**: `04xxxxxxxx@optusmobile.com.au`
- **Vodafone**: `04xxxxxxxx@vodafone.com.au`

Or send to both:
```bash
ALERT_EMAIL_TO=your-email@gmail.com,04xxxxxxxx@sms.telstra.com
```

### 4. Test the Alert

```bash
cd ~/redcorner-dashboard
node cost-alert-monitor.js
```

If channels are running or flows are active, you'll get an email/SMS immediately.

If nothing is running, you'll see:
```
✅ All clear - no channels running, no active flows
```

### 5. Set Up Cron Job (Auto-Check)

Edit your crontab:

```bash
crontab -e
```

Add these lines (checks at 6pm, 10pm, and midnight Sydney time):

```bash
# Red Corner cost alerts - check for running channels
0 18,22,0 * * * cd /home/ubuntu/redcorner-dashboard && /usr/bin/node cost-alert-monitor.js >> /tmp/cost-monitor.log 2>&1
```

**Or check every hour:**

```bash
0 * * * * cd /home/ubuntu/redcorner-dashboard && /usr/bin/node cost-alert-monitor.js >> /tmp/cost-monitor.log 2>&1
```

Save and exit (Ctrl+X, Y, Enter).

### 6. Verify Cron is Running

```bash
# List your cron jobs
crontab -l

# Check the log file after the scheduled time
cat /tmp/cost-monitor.log
```

## Example Alert Email/SMS

```
⚠️ AWS COST ALERT - Red Corner Dashboard

Timestamp: 30/10/2025, 10:00:00 PM

🔴 RUNNING CHANNELS (1):
   • Channel 1 - $115/hour

💸 CURRENT BURN RATE:
   Per Hour: $115.00
   Per Day: $2,760.00
   Per Week: $19,320.00

Action required:
1. Go to https://dashboard.redcorner.com.au
2. Stop any running channels
3. Delete any MediaConnect flows (red banner button)
```

## Customizing Alert Times

Common cron schedules:

```bash
# Every hour
0 * * * * cd /home/ubuntu/redcorner-dashboard && /usr/bin/node cost-alert-monitor.js

# Every day at 6pm
0 18 * * * cd /home/ubuntu/redcorner-dashboard && /usr/bin/node cost-alert-monitor.js

# Weekdays at 5pm and 11pm
0 17,23 * * 1-5 cd /home/ubuntu/redcorner-dashboard && /usr/bin/node cost-alert-monitor.js

# Every 30 minutes
*/30 * * * * cd /home/ubuntu/redcorner-dashboard && /usr/bin/node cost-alert-monitor.js
```

## Troubleshooting

**No email received?**

1. Check credentials:
   ```bash
   cat ~/redcorner-dashboard/.env | grep ALERT_EMAIL
   ```

2. Test Gmail login:
   ```bash
   node -e "
   const nodemailer = require('nodemailer');
   require('dotenv').config();
   const t = nodemailer.createTransport({
       host: 'smtp.gmail.com',
       port: 587,
       auth: {
           user: process.env.ALERT_EMAIL_USER,
           pass: process.env.ALERT_EMAIL_PASSWORD
       }
   });
   t.verify((err, success) => {
       if (err) console.error('Error:', err);
       else console.log('✅ SMTP connection successful!');
   });
   "
   ```

3. Check cron log:
   ```bash
   cat /tmp/cost-monitor.log
   ```

**Getting rate limited?**

Gmail has sending limits (~500 emails/day). If you're checking every hour, you'll be fine. If checking every minute, you'll hit limits.

## Disabling Alerts

```bash
# Comment out the cron job
crontab -e
# Add # at the start of the line
# 0 18,22,0 * * * cd /home/ubuntu/redcorner-dashboard...
```

## Security Note

The Gmail app password in `.env` is sensitive. Make sure:
- `.env` is in `.gitignore` (it already is)
- Never commit `.env` to git
- Rotate the app password if compromised
