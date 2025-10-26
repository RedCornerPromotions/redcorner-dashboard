require('dotenv').config();
const { MediaLiveClient, BatchUpdateScheduleCommand, DescribeScheduleCommand } = require("@aws-sdk/client-medialive");

const client = new MediaLiveClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function testHtmlOverlay() {
    const channelId = process.env.AWS_CHANNEL_1_ID || "6773999";
    const testUrl = "https://www.google.com"; // Simple test URL

    console.log('Testing HTML Motion Graphics activation...');
    console.log('Channel ID:', channelId);
    console.log('Test URL:', testUrl);
    console.log('');

    try {
        const actionName = `test-html-overlay-${Date.now()}`;

        // Try method 1: MotionGraphicsImageActivateSettings (for images)
        console.log('Attempting: MotionGraphicsImageActivateSettings...');
        try {
            const command1 = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: actionName + '-image',
                        ScheduleActionStartSettings: {
                            ImmediateModeScheduleActionStartSettings: {}
                        },
                        ScheduleActionSettings: {
                            MotionGraphicsImageActivateSettings: {
                                Url: testUrl,
                                Duration: 300000 // 5 minutes
                            }
                        }
                    }]
                }
            });

            await client.send(command1);
            console.log('✅ SUCCESS with MotionGraphicsImageActivateSettings');
            console.log('This means HTML overlays CAN be activated via schedule actions!');
            
            // Check if it was created
            const scheduleCmd = new DescribeScheduleCommand({ ChannelId: channelId, MaxResults: 5 });
            const schedule = await client.send(scheduleCmd);
            console.log('\nSchedule actions now:', schedule.ScheduleActions?.length || 0);
            
        } catch (err) {
            console.log('❌ FAILED with MotionGraphicsImageActivateSettings');
            console.log('Error:', err.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testHtmlOverlay();
