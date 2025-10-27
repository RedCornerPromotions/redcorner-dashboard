const EventEmitter = require("events");
const Channel = require("./channel");

class StreamManager extends EventEmitter {
    constructor() {
        super();
        
        // Create 5 fixed channels
        this.channels = new Map();
        for (let i = 1; i <= 5; i++) {
            const channel = new Channel(i);
            this.channels.set(i, channel);
            
            // Forward channel events
            channel.on('preview-started', () => this.emit('channel-preview-started', i));
            channel.on('preview-stopped', () => this.emit('channel-preview-stopped', i));
            channel.on('destination-started', (destId) => this.emit('channel-destination-started', i, destId));
            channel.on('destination-stopped', (destId) => this.emit('channel-destination-stopped', i, destId));
        }
        
        console.log("StreamManager initialized with 5 channels");
        this.printChannelInfo();
    }
    
    printChannelInfo() {
        console.log("\n=== CHANNEL INPUT ENDPOINTS ===");
        for (let i = 1; i <= 5; i++) {
            const channel = this.channels.get(i);
            console.log("\nChannel " + i + ":");
            console.log("  SRT:  " + channel.config.srt);
            console.log("  RTMP: " + channel.config.rtmp);
            console.log("  RTSP: " + channel.config.rtsp);
        }
        console.log("\n================================\n");
    }
    
    getChannel(channelNumber) {
        return this.channels.get(channelNumber);
    }
    
    getAllChannels() {
        const status = {};
        for (const [num, channel] of this.channels) {
            status["channel" + num] = channel.getStatus();
        }
        return status;
    }
    
    getSystemStatus() {
        const channels = this.getAllChannels();
        let activeChannels = 0;
        let totalStreams = 0;

        for (const ch of Object.values(channels)) {
            if (ch.isPreviewRunning) activeChannels++;
            // Count active streaming destinations
            if (ch.destinations) {
                totalStreams += ch.destinations.filter(d => d.isStreaming).length;
            }
        }

        return {
            totalChannels: 5,
            activeChannels: activeChannels,
            totalStreams: totalStreams,
            channels: channels
        };
    }
}

module.exports = StreamManager;
