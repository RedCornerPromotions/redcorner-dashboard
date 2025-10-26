require('dotenv').config();
const { MediaLiveClient, BatchUpdateScheduleCommand } = require("@aws-sdk/client-medialive");

const client = new MediaLiveClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function activateLigr() {
    const channelId = process.env.AWS_CHANNEL_1_ID || "6773999";
    const ligrUrl = "https://overlay.ligr.live/preview-32430145-c71a-448d-ab3d-1771acce8854";

    console.log('Step 1: Removing current overlay...');
    
    try {
        // Deactivate current overlay
        const deactivateCmd = new BatchUpdateScheduleCommand({
            ChannelId: channelId,
            Creates: {
                ScheduleActions: [{
                    ActionName: `deactivate-${Date.now()}`,
                    ScheduleActionStartSettings: {
                        ImmediateModeScheduleActionStartSettings: {}
                    },
                    ScheduleActionSettings: {
                        MotionGraphicsImageDeactivateSettings: {}
                    }
                }]
            }
        });

        await client.send(deactivateCmd);
        console.log('‚úÖ Previous overlay removed');
        
        // Wait 3 seconds
        console.log('\nWaiting 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Step 2: Activating LIGR overlay...');
        console.log('URL:', ligrUrl);

        // Activate LIGR overlay
        const activateCmd = new BatchUpdateScheduleCommand({
            ChannelId: channelId,
            Creates: {
                ScheduleActions: [{
                    ActionName: `ligr-overlay-${Date.now()}`,
                    ScheduleActionStartSettings: {
                        ImmediateModeScheduleActionStartSettings: {}
                    },
                    ScheduleActionSettings: {
                        MotionGraphicsImageActivateSettings: {
                            Url: ligrUrl,
                            Duration: 86400000 // 24 hours
                        }
                    }
                }]
            }
        });

        await client.send(activateCmd);
        console.log('‚úÖ LIGR overlay activated!');
        console.log('\nÌ†ºÌ SUCCESS!');
        console.log('Wait 5-10 seconds, then check your Program stream.');
        console.log('You should see your LIGR scoreboard overlay!');
        console.log('\nProgram stream:');
        console.log('https://redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o.s3.ap-southeast-2.amazonaws.com/medialive/channel1/program.m3u8');
        
    } catch (error) {
        console.error('\næâ‚ùå Error:', error.message);
        console.error('Full error:', error);
    }
}

activateLigr();
