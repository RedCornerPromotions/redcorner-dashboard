#!/usr/bin/env node

/**
 * Quick Cost Status Checker
 *
 * Run this anytime to see:
 * - Which channels are running (costing money)
 * - Active MediaConnect flows (costing money)
 * - Current hourly burn rate
 *
 * Usage: node check-costs.js
 */

require('dotenv').config();
const { MediaLiveClient, DescribeChannelCommand } = require("@aws-sdk/client-medialive");
const { MediaConnectClient, ListFlowsCommand } = require("@aws-sdk/client-mediaconnect");

const liveClient = new MediaLiveClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const connectClient = new MediaConnectClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Channel IDs from .env
const channelMap = {
    1: process.env.CHANNEL_1_ID,
    2: process.env.CHANNEL_2_ID,
    3: process.env.CHANNEL_3_ID,
    4: process.env.CHANNEL_4_ID,
    5: process.env.CHANNEL_5_ID
};

async function main() {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('           RED CORNER - AWS COST STATUS CHECK');
    console.log('════════════════════════════════════════════════════════\n');

    let runningChannels = 0;
    let idleChannels = 0;
    let hourlyCost = 0;

    // Check MediaLive channels
    console.log('📺 MEDIALIVE CHANNELS:\n');

    for (let i = 1; i <= 5; i++) {
        const channelId = channelMap[i];
        if (!channelId) {
            console.log(`   Channel ${i}: Not configured`);
            continue;
        }

        try {
            const command = new DescribeChannelCommand({ ChannelId: channelId });
            const response = await liveClient.send(command);
            const state = response.State;

            if (state === 'RUNNING') {
                console.log(`   Channel ${i}: 🔴 RUNNING (💸 ~$115/hour)`);
                runningChannels++;
                hourlyCost += 115;
            } else if (state === 'IDLE') {
                console.log(`   Channel ${i}: ⚪ IDLE (💵 $0.02/hour)`);
                idleChannels++;
                hourlyCost += 0.02;
            } else {
                console.log(`   Channel ${i}: ${state}`);
            }
        } catch (error) {
            console.log(`   Channel ${i}: Error - ${error.message}`);
        }
    }

    // Check MediaConnect flows
    console.log('\n🌐 MEDIACONNECT FLOWS:\n');

    try {
        const command = new ListFlowsCommand({});
        const response = await connectClient.send(command);
        const flows = response.Flows || [];

        if (flows.length === 0) {
            console.log('   ✅ No active flows (not being billed)');
        } else {
            console.log(`   ⚠️  ${flows.length} ACTIVE FLOW(S) FOUND:\n`);
            flows.forEach(f => {
                console.log(`      • ${f.Name} - ${f.Status}`);
            });
            const flowCost = flows.length * 0.045;
            hourlyCost += flowCost;
            console.log(`\n   💸 MediaConnect cost: $${flowCost.toFixed(2)}/hour`);
            console.log(`   ⚠️  These should auto-delete when channels stop!`);
        }
    } catch (error) {
        console.log(`   Error checking flows: ${error.message}`);
    }

    // Summary
    console.log('\n════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`   Running Channels: ${runningChannels}`);
    console.log(`   Idle Channels: ${idleChannels}\n`);

    console.log(`   💰 CURRENT BURN RATE:`);
    console.log(`      Per Hour:   $${hourlyCost.toFixed(2)}`);
    console.log(`      Per Day:    $${(hourlyCost * 24).toFixed(2)}`);
    console.log(`      Per Week:   $${(hourlyCost * 24 * 7).toFixed(2)}`);
    console.log(`      Per Month:  $${(hourlyCost * 24 * 30).toFixed(2)}\n`);

    if (runningChannels > 0) {
        console.log('   ⚠️  You have channels RUNNING - stop them when not streaming!');
    } else {
        console.log('   ✅ All channels stopped - good job!');
    }

    console.log('\n════════════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
