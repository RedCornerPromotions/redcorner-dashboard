#!/usr/bin/env node

/**
 * AWS Cost Alert Monitor
 *
 * Checks for running channels and MediaConnect flows.
 * Sends email alert if anything is left running.
 *
 * Usage: node cost-alert-monitor.js
 */

require('dotenv').config();
const { MediaLiveClient, DescribeChannelCommand } = require("@aws-sdk/client-medialive");
const { MediaConnectClient, ListFlowsCommand } = require("@aws-sdk/client-mediaconnect");
const nodemailer = require('nodemailer');

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

const channelMap = {
    1: process.env.CHANNEL_1_ID,
    2: process.env.CHANNEL_2_ID,
    3: process.env.CHANNEL_3_ID,
    4: process.env.CHANNEL_4_ID,
    5: process.env.CHANNEL_5_ID
};

async function checkStatus() {
    const runningChannels = [];
    const activeFlows = [];
    let hourlyCost = 0;

    // Check MediaLive channels
    for (let i = 1; i <= 5; i++) {
        const channelId = channelMap[i];
        if (!channelId) continue;

        try {
            const command = new DescribeChannelCommand({ ChannelId: channelId });
            const response = await liveClient.send(command);

            if (response.State === 'RUNNING') {
                runningChannels.push(`Channel ${i}`);
                hourlyCost += 115;
            }
        } catch (error) {
            console.error(`Error checking channel ${i}:`, error.message);
        }
    }

    // Check MediaConnect flows
    try {
        const command = new ListFlowsCommand({});
        const response = await connectClient.send(command);
        const flows = response.Flows || [];

        flows.forEach(flow => {
            activeFlows.push(flow.Name);
            hourlyCost += 0.045;
        });
    } catch (error) {
        console.error('Error checking flows:', error.message);
    }

    return {
        runningChannels,
        activeFlows,
        hourlyCost,
        hasIssues: runningChannels.length > 0 || activeFlows.length > 0
    };
}

async function sendAlert(status) {
    const { runningChannels, activeFlows, hourlyCost } = status;

    // Email configuration from .env
    const transporter = nodemailer.createTransport({
        host: process.env.ALERT_EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.ALERT_EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.ALERT_EMAIL_USER,
            pass: process.env.ALERT_EMAIL_PASSWORD
        }
    });

    const dailyCost = (hourlyCost * 24).toFixed(2);
    const weeklyCost = (hourlyCost * 24 * 7).toFixed(2);

    let message = `⚠️ AWS COST ALERT - Red Corner Dashboard\n\n`;
    message += `Timestamp: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}\n\n`;

    if (runningChannels.length > 0) {
        message += `🔴 RUNNING CHANNELS (${runningChannels.length}):\n`;
        runningChannels.forEach(ch => {
            message += `   • ${ch} - $115/hour\n`;
        });
        message += `\n`;
    }

    if (activeFlows.length > 0) {
        message += `⚠️ ACTIVE MEDIACONNECT FLOWS (${activeFlows.length}):\n`;
        activeFlows.forEach(flow => {
            message += `   • ${flow} - $0.045/hour\n`;
        });
        message += `\nThese flows should auto-delete when channels stop!\n`;
        message += `Check for bugs or manually delete at: https://dashboard.redcorner.com.au\n\n`;
    }

    message += `💸 CURRENT BURN RATE:\n`;
    message += `   Per Hour: $${hourlyCost.toFixed(2)}\n`;
    message += `   Per Day: $${dailyCost}\n`;
    message += `   Per Week: $${weeklyCost}\n\n`;

    message += `Action required:\n`;
    message += `1. Go to https://dashboard.redcorner.com.au\n`;
    message += `2. Stop any running channels\n`;
    message += `3. Delete any MediaConnect flows (red banner button)\n\n`;

    message += `This is an automated alert from your Red Corner Dashboard cost monitor.\n`;

    const htmlMessage = message.replace(/\n/g, '<br>').replace(/•/g, '&bull;');

    try {
        await transporter.sendMail({
            from: `"Red Corner Alert" <${process.env.ALERT_EMAIL_USER}>`,
            to: process.env.ALERT_EMAIL_TO,
            subject: `⚠️ AWS Cost Alert: ${runningChannels.length} Channel(s) Running`,
            text: message,
            html: `<pre style="font-family: monospace; background: #f5f5f5; padding: 20px; border-left: 5px solid #dc2626;">${htmlMessage}</pre>`
        });

        console.log(`✅ Alert email sent to ${process.env.ALERT_EMAIL_TO}`);
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw error;
    }
}

async function main() {
    console.log(`[${new Date().toISOString()}] Running cost monitor check...`);

    const status = await checkStatus();

    if (status.hasIssues) {
        console.log('⚠️ Issues detected! Sending alert email...');
        console.log(`   Running channels: ${status.runningChannels.length}`);
        console.log(`   Active flows: ${status.activeFlows.length}`);
        console.log(`   Hourly cost: $${status.hourlyCost.toFixed(2)}`);

        if (!process.env.ALERT_EMAIL_USER || !process.env.ALERT_EMAIL_TO) {
            console.error('❌ Email not configured! Add to .env:');
            console.error('   ALERT_EMAIL_USER=your-email@gmail.com');
            console.error('   ALERT_EMAIL_PASSWORD=your-app-password');
            console.error('   ALERT_EMAIL_TO=your-phone-email@carrier.com');
            process.exit(1);
        }

        await sendAlert(status);
    } else {
        console.log('✅ All clear - no channels running, no active flows');
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
