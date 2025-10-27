const { MediaLiveClient, DescribeChannelCommand } = require("@aws-sdk/client-medialive");
require('dotenv').config();

const client = new MediaLiveClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function checkDestinations() {
    const channelId = process.env.AWS_CHANNEL_1_ID;
    const cmd = new DescribeChannelCommand({ ChannelId: channelId });
    const config = await client.send(cmd);
    
    console.log('=== CURRENT DESTINATIONS ===');
    console.log(JSON.stringify(config.Destinations, null, 2));
    
    console.log('\n=== OUTPUT GROUPS ===');
    config.EncoderSettings.OutputGroups.forEach((og, i) => {
        console.log(`${i}. ${og.Name}`);
        og.Outputs.forEach(output => {
            if (output.OutputSettings.UdpOutputSettings || output.OutputSettings.RtmpOutputSettings) {
                const dest = output.OutputSettings.UdpOutputSettings?.Destination || 
                            output.OutputSettings.RtmpOutputSettings?.Destination;
                console.log(`   References: ${dest?.DestinationRefId || 'none'}`);
            }
        });
    });
}

checkDestinations().catch(console.error);
