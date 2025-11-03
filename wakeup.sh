#!/bin/bash

##############################################################################
# RED CORNER WAKE-UP SCRIPT
#
# Wakes your AWS MediaLive system from hibernation
#
# Usage: ./wakeup.sh
##############################################################################

set -e

echo ""
echo "════════════════════════════════════════════════════════"
echo "  RED CORNER - WAKE UP FROM HIBERNATION"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Run this from ~/redcorner-dashboard"
    exit 1
fi

# Check if already running
if pm2 list | grep -q "redcorner-dashboard.*online"; then
    echo "✅ Dashboard is already running"
else
    echo "📝 Starting dashboard..."
    pm2 start server.js --name redcorner-dashboard
    sleep 3
fi

echo ""
echo "═══ Step 1: Checking Lightsail Instance ═══"
echo ""
echo "⚠️  IMPORTANT: Start your Lightsail instance first!"
echo ""
echo "1. Go to: https://lightsail.aws.amazon.com/"
echo "2. Click your instance: ip-172-26-12-186"
echo "3. Click Actions → Start"
echo "4. Wait for it to show 'Running' (2-3 minutes)"
echo ""
read -p "Is Lightsail instance running? (yes/no): " lightsail_ready

if [ "$lightsail_ready" != "yes" ]; then
    echo "Start Lightsail first, then run this script again."
    exit 0
fi

echo ""
echo "═══ Step 2: Checking MediaLive Channels ═══"
echo ""

node -e "
const { MediaLiveClient, DescribeChannelCommand } = require('@aws-sdk/client-medialive');
require('dotenv').config();

const client = new MediaLiveClient({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const channelMap = {
    1: process.env.CHANNEL_1_ID,
    2: process.env.CHANNEL_2_ID,
    3: process.env.CHANNEL_3_ID,
    4: process.env.CHANNEL_4_ID,
    5: process.env.CHANNEL_5_ID
};

(async () => {
    let foundChannels = 0;

    for (let i = 1; i <= 5; i++) {
        const channelId = channelMap[i];
        if (!channelId) continue;

        try {
            const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
            const channel = await client.send(describeCmd);

            console.log('✅ Channel ' + i + ': ' + channel.State + ' (' + channelId + ')');
            foundChannels++;

        } catch (err) {
            if (err.name === 'NotFoundException') {
                console.log('❌ Channel ' + i + ' was deleted during hibernation');
            } else {
                console.error('⚠️  Channel ' + i + ' error:', err.message);
            }
        }
    }

    if (foundChannels === 0) {
        console.log('');
        console.log('⚠️  No MediaLive channels found!');
        console.log('   You will need to recreate them manually in AWS Console.');
        console.log('   Or restore from CloudFormation template if you have one.');
    }
})();
"

echo ""
echo "═══ Step 3: System Status ═══"
echo ""
node check-costs.js

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ WAKE-UP COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 Dashboard: https://dashboard.redcorner.com.au"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Login to dashboard"
echo "2. Check channel status"
echo "3. Configure destinations if needed"
echo "4. Start streaming!"
echo ""
echo "💰 ACTIVE COSTS:"
echo "   • Lightsail running: ~\$5-10/month"
echo "   • MediaLive IDLE: \$0.04/hour per channel (~\$29/month)"
echo "   • MediaLive RUNNING: \$5.67/hour per channel (~\$136/day)"
echo "   • Only charged when actually streaming!"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
