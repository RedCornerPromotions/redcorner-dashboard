require('dotenv').config();
const { MediaLiveClient, DescribeChannelCommand, DescribeScheduleCommand } = require("@aws-sdk/client-medialive");

const client = new MediaLiveClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function checkChannelConfig() {
    const channelId = process.env.AWS_CHANNEL_1_ID || "6773999";

    console.log('==========================================');
    console.log('AWS MediaLive Channel Configuration Check');
    console.log('==========================================');
    console.log('Channel ID:', channelId);
    console.log('Region:', process.env.AWS_REGION || "ap-southeast-2");
    console.log('==========================================\n');

    try {
        // Get channel configuration
        const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
        const channel = await client.send(describeCmd);

        console.log('CHANNEL STATE:', channel.State);
        console.log('CHANNEL NAME:', channel.Name);
        console.log('\n==========================================');
        console.log('MOTION GRAPHICS CONFIGURATION:');
        console.log('==========================================');

        const motionGraphics = channel.EncoderSettings?.MotionGraphicsConfiguration;

        if (motionGraphics) {
            console.log('‚úÖ Motion Graphics is CONFIGURED');
            console.log('\nSettings:');
            console.log(JSON.stringify(motionGraphics, null, 2));

            if (motionGraphics.MotionGraphicsSettings?.HtmlMotionGraphicsSettings) {
                const htmlSettings = motionGraphics.MotionGraphicsSettings.HtmlMotionGraphicsSettings;
                console.log('\nÌ†ΩÌ HTML Overlay URL:', htmlSettings.Uri || 'NOT SET');
            }

            if (motionGraphics.MotionGraphicsInsertion) {
                console.log('≥åÌ†ΩÌ Insertion Mode:', motionGraphics.MotionGraphicsInsertion);
            }
        } else {
            console.log('≥å‚ùå Motion Graphics is NOT CONFIGURED');
            console.log('\nThis is the problem! The channel was created without Motion Graphics support.');
            console.log('You need to:');
            console.log('1. Stop the channel');
            console.log('2. Update channel configuration to add Motion Graphics');
            console.log('3. Restart the channel');
        }

        // Check schedule actions
        console.log('\n==========================================');
        console.log('SCHEDULE ACTIONS:');
        console.log('==========================================');

        try {
            const scheduleCmd = new DescribeScheduleCommand({
                ChannelId: channelId,
                MaxResults: 10
            });
            const schedule = await client.send(scheduleCmd);

            if (schedule.ScheduleActions && schedule.ScheduleActions.length > 0) {
                console.log(`Found ${schedule.ScheduleActions.length} schedule actions:\n`);
                schedule.ScheduleActions.forEach((action, i) => {
                    console.log(`${i + 1}. ${action.ActionName}`);
                    if (action.ScheduleActionSettings?.MotionGraphicsImageActivateSettings) {
                        console.log('   Type: Activate Overlay');
                        console.log('   URL:', action.ScheduleActionSettings.MotionGraphicsImageActivateSettings.Url);
                    } else if (action.ScheduleActionSettings?.MotionGraphicsImageDeactivateSettings) {
                        console.log('   Type: Deactivate Overlay');
                    }
                });
            } else {
                console.log('No schedule actions found');
            }
        } catch (scheduleErr) {
            console.log('Could not fetch schedule:', scheduleErr.message);
        }

        // Check outputs
        console.log('\n==========================================');
        console.log('OUTPUTS:');
        console.log('==========================================');

        if (channel.EncoderSettings?.OutputGroups) {
            channel.EncoderSettings.OutputGroups.forEach((group, i) => {
                console.log(`\nOutput Group ${i + 1}:`);
                console.log('Type:', group.OutputGroupSettings?.HlsGroupSettings ? 'HLS' : 'Other');

                if (group.Outputs) {
                    group.Outputs.forEach((output, j) => {
                        console.log(`  Output ${j + 1}:`, output.OutputName || 'Unnamed');
                    });
                }
            });
        }

        console.log('\n==========================================');
        console.log('DIAGNOSIS:');
        console.log('==========================================');

        if (!motionGraphics) {
            console.log('‚ùå PROBLEM: Channel does not have Motion Graphics configured');
            console.log('\nÌ†ΩÌ SOLUTION:');
            console.log('Run this command to fix:');
            console.log('  node fix-motion-graphics.js');
            console.log('\nThis will:');
            console.log('1. Check if channel is IDLE (stop it if needed)');
            console.log('2. Add Motion Graphics configuration to encoder settings');
            console.log('3. You can then start the channel and use dynamic overlay switching');
        } else if (!motionGraphics.MotionGraphicsSettings?.HtmlMotionGraphicsSettings?.Uri) {
            console.log('≥ã‚ö†Ô∏è  Motion Graphics configured but no URL set');
            console.log('Use the dashboard "Activate Overlay" button to set a URL');
        } else {
            console.log('‚úÖ Motion Graphics properly configured!');
            console.log('\nIf overlay still not showing, check:');
            console.log('1. Is the overlay URL accessible?');
            console.log('2. Is it HTTPS (not HTTP)?');
            console.log('3. Does the URL load in a browser?');
            console.log('4. Check Program output stream (not Preview)');
        }

    } catch (error) {
        console.error('\n‚ùå ERROR:', error.message);
        console.error('\nFull error:', error);
    }
}

checkChannelConfig();
