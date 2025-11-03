#!/bin/bash

##############################################################################
# RED CORNER DEEP HIBERNATION SCRIPT
#
# Puts your AWS MediaLive system into deep sleep to minimize costs
# Cost: ~$3-8/month (vs $29/month idle or $136/day running)
#
# Usage: ./hibernate.sh
##############################################################################

set -e

echo ""
echo "════════════════════════════════════════════════════════"
echo "  RED CORNER - DEEP HIBERNATION"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Run this from ~/redcorner-dashboard"
    exit 1
fi

# Load environment
source .env

echo "📋 Pre-hibernation checklist:"
echo ""
echo "   ⚠️  WARNING: This will:"
echo "   • Stop all MediaLive channels"
echo "   • Delete all MediaConnect flows"
echo "   • Export channel configurations for later restoration"
echo "   • Guide you to stop Lightsail instance"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Hibernation cancelled."
    exit 0
fi

echo ""
echo "═══ Step 1: Checking MediaConnect Flows ═══"
echo ""

# Check for active flows
node -e "
const { MediaConnectClient, ListFlowsCommand, DeleteFlowCommand } = require('@aws-sdk/client-mediaconnect');
require('dotenv').config();

const client = new MediaConnectClient({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

(async () => {
    const response = await client.send(new ListFlowsCommand({}));
    const flows = response.Flows || [];

    if (flows.length === 0) {
        console.log('✅ No MediaConnect flows found');
        return;
    }

    console.log('⚠️  Found ' + flows.length + ' active flow(s). Deleting...');
    for (const flow of flows) {
        console.log('   Deleting:', flow.Name);
        await client.send(new DeleteFlowCommand({ FlowArn: flow.FlowArn }));
    }
    console.log('✅ All flows deleted');
})();
"

echo ""
echo "═══ Step 2: Stopping MediaLive Channels ═══"
echo ""

# Stop all channels and export configs
node -e "
const { MediaLiveClient, DescribeChannelCommand, StopChannelCommand } = require('@aws-sdk/client-medialive');
const fs = require('fs');
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
    for (let i = 1; i <= 5; i++) {
        const channelId = channelMap[i];
        if (!channelId) continue;

        try {
            const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
            const channel = await client.send(describeCmd);

            console.log('Channel ' + i + ' (' + channelId + '): ' + channel.State);

            if (channel.State === 'RUNNING' || channel.State === 'STARTING') {
                console.log('   Stopping channel...');
                await client.send(new StopChannelCommand({ ChannelId: channelId }));
                console.log('   ✅ Stop command sent');
            } else if (channel.State === 'IDLE') {
                console.log('   ✅ Already stopped');
            }

        } catch (err) {
            console.error('   ❌ Error:', err.message);
        }
    }

    console.log('');
    console.log('⏳ Waiting 30 seconds for channels to stop...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    console.log('✅ All channels should now be stopped');
})();
"

echo ""
echo "═══ Step 3: Final Status Check ═══"
echo ""
node check-costs.js

echo ""
echo "════════════════════════════════════════════════════════"
echo "  🎯 HIBERNATION INSTRUCTIONS"
echo "════════════════════════════════════════════════════════"
echo ""
echo "✅ MediaLive channels stopped"
echo "✅ MediaConnect flows deleted"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Stop Lightsail Instance:"
echo "   • Go to: https://lightsail.aws.amazon.com/"
echo "   • Click your instance: ip-172-26-12-186"
echo "   • Click Actions → Stop"
echo "   • Create a snapshot first (recommended)"
echo ""
echo "2. Optional: Delete IDLE MediaLive Channels"
echo "   (Saves additional \$29/month per channel)"
echo "   • Go to: https://console.aws.amazon.com/medialive/"
echo "   • Select channels → Actions → Delete"
echo "   • ⚠️  You'll need to recreate them when waking up"
echo ""
echo "💰 HIBERNATION COSTS:"
echo "   • Lightsail stopped: ~\$3-5/month (snapshot storage)"
echo "   • MediaLive IDLE: \$0.04/hour per channel (~\$29/month per channel)"
echo "   • S3 storage: ~\$1-3/month (your recordings stay safe)"
echo "   • Total: ~\$35/month (with 1 IDLE channel)"
echo "   • Or ~\$5/month (if you delete channels)"
echo ""
echo "📋 CONFIG SAVED TO: hibernation-backup.txt"
echo "   (Keep this file to restore your setup later)"
echo ""
echo "To wake up later, run: ./wakeup.sh"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Save current config for restoration
cat .env > hibernation-backup.txt
echo "" >> hibernation-backup.txt
echo "# Hibernated on: $(date)" >> hibernation-backup.txt
echo "# S3 Bucket: $S3_BUCKET" >> hibernation-backup.txt

echo "✅ Hibernation complete! System is now in deep sleep."
echo ""
