const { MediaLiveClient, StartChannelCommand, StopChannelCommand, DescribeChannelCommand, UpdateChannelCommand, BatchUpdateScheduleCommand } = require("@aws-sdk/client-medialive");
const { MediaConnectClient, CreateFlowCommand, DeleteFlowCommand, AddFlowOutputsCommand, DescribeFlowCommand } = require("@aws-sdk/client-mediaconnect");

class AWSMediaLiveManager {
    constructor() {
        this.client = new MediaLiveClient({
            region: process.env.AWS_REGION || "ap-southeast-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        this.mediaConnectClient = new MediaConnectClient({
            region: process.env.AWS_REGION || "ap-southeast-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        this.channelMap = {
            1: process.env.AWS_CHANNEL_1_ID || null,
            2: process.env.AWS_CHANNEL_2_ID || null,
            3: process.env.AWS_CHANNEL_3_ID || null,
            4: process.env.AWS_CHANNEL_4_ID || null,
            5: process.env.AWS_CHANNEL_5_ID || null
        };

        this.channelNames = {
            1: process.env.CHANNEL_1_NAME || "Channel 1",
            2: process.env.CHANNEL_2_NAME || "Channel 2",
            3: process.env.CHANNEL_3_NAME || "Channel 3",
            4: process.env.CHANNEL_4_NAME || "Channel 4",
            5: process.env.CHANNEL_5_NAME || "Channel 5"
        };

        this.mediaConnectFlows = {};

        this.costPerChannelHour = 2.0;

        console.log('[AWS MediaLive Manager] Initialized with MediaConnect support');
        const configured = Object.values(this.channelMap).filter(id => id).length;
        console.log(`[AWS MediaLive Manager] Channels configured: ${configured}`);
    }

    async startChannel(channelNumber) {
        const channelId = this.channelMap[channelNumber];
        if (!channelId) {
            return { success: false, error: `Channel ${channelNumber} not configured` };
        }
        try {
            const command = new StartChannelCommand({ ChannelId: channelId });
            await this.client.send(command);
            console.log(`[AWS] Started channel ${channelNumber} (${channelId})`);
            return { success: true, channelNumber, channelId, state: 'STARTING' };
        } catch (error) {
            console.error(`[AWS] Error starting channel ${channelNumber}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async stopChannel(channelNumber) {
        const channelId = this.channelMap[channelNumber];
        if (!channelId) {
            return { success: false, error: `Channel ${channelNumber} not configured` };
        }
        try {
            const command = new StopChannelCommand({ ChannelId: channelId });
            await this.client.send(command);
            console.log(`[AWS] Stopped channel ${channelNumber} (${channelId})`);
            return { success: true, channelNumber, channelId, state: 'STOPPING' };
        } catch (error) {
            console.error(`[AWS] Error stopping channel ${channelNumber}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async getChannelStatus(channelNumber) {
        const channelId = this.channelMap[channelNumber];
        if (!channelId) {
            return {
                success: false, state: 'NOT_CONFIGURED',
                channelNumber, name: this.channelNames[channelNumber]
            };
        }
        try {
            const command = new DescribeChannelCommand({ ChannelId: channelId });
            const response = await this.client.send(command);
            return {
                success: true, channelNumber, channelId,
                name: this.channelNames[channelNumber],
                state: response.State || 'UNKNOWN',
                pipelinesRunning: response.PipelinesRunningCount || 0
            };
        } catch (error) {
            return {
                success: false, error: error.message,
                state: 'ERROR', channelNumber,
                name: this.channelNames[channelNumber]
            };
        }
    }

    async updateOverlay(channelNumber, enabled, overlayUrl = '') {
        const channelId = this.channelMap[channelNumber];
        if (!channelId) {
            return { success: false, error: `Channel ${channelNumber} not configured` };
        }

        try {
            const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
            const currentConfig = await this.client.send(describeCmd);

            if (currentConfig.State !== 'IDLE') {
                return {
                    success: false,
                    error: `Channel must be IDLE. Current: ${currentConfig.State}. Stop channel first.`
                };
            }

            const encoderSettings = currentConfig.EncoderSettings;

            if (!encoderSettings.GlobalConfiguration) {
                encoderSettings.GlobalConfiguration = {};
            }

            if (enabled && overlayUrl) {
                encoderSettings.GlobalConfiguration.MotionGraphicsConfiguration = {
                    MotionGraphicsInsertion: 'ENABLED',
                    MotionGraphicsSettings: {
                        HtmlMotionGraphicsSettings: {
                            Uri: overlayUrl
                        }
                    }
                };
            } else {
                encoderSettings.GlobalConfiguration.MotionGraphicsConfiguration = {
                    MotionGraphicsInsertion: 'DISABLED'
                };
            }

            const updateCommand = new UpdateChannelCommand({
                ChannelId: channelId,
                EncoderSettings: encoderSettings,
                InputAttachments: currentConfig.InputAttachments,
                Destinations: currentConfig.Destinations
            });

            await this.client.send(updateCommand);

            console.log(`[AWS] Updated overlay for channel ${channelNumber}: ${enabled ? overlayUrl : 'disabled'}`);

            return {
                success: true,
                channelNumber,
                overlayEnabled: enabled,
                overlayUrl: enabled ? overlayUrl : null
            };
        } catch (error) {
            console.error(`[AWS] Error updating overlay:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async getEstimatedCost() {
        let runningCount = 0;
        for (let i = 1; i <= 5; i++) {
            const status = await this.getChannelStatus(i);
            if (status.state === 'RUNNING') runningCount++;
        }
        return {
            runningChannels: runningCount,
            costPerHour: runningCount * this.costPerChannelHour,
            costPerDay: runningCount * this.costPerChannelHour * 24,
            costPerWeek: runningCount * this.costPerChannelHour * 24 * 7
        };
    }

    async configureRTMPDestination(channelNumber, rtmpUrl, streamKey, destinationName = 'Temp-RTMP') {
        const channelId = this.channelMap[channelNumber];

        if (!channelId) {
            return {
                success: false,
                error: `Channel ${channelNumber} not configured`
            };
        }

        try {
            const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
            const currentConfig = await this.client.send(describeCmd);

            if (currentConfig.State !== 'IDLE') {
                return {
                    success: false,
                    error: `Channel must be IDLE to configure destination. Current state: ${currentConfig.State}`
                };
            }

            const destinations = currentConfig.Destinations || [];
            const outputGroups = currentConfig.EncoderSettings.OutputGroups || [];

            const filteredOutputGroups = outputGroups.filter(og => {
                const name = og.Name || '';
                return name === 'preview' || name === 'program' || name === 'program-recording';
            });

            const rtmpOutputGroup = {
                Name: destinationName,
                OutputGroupSettings: {
                    RtmpGroupSettings: {
                        AuthenticationScheme: 'COMMON',
                        CacheFullBehavior: 'DISCONNECT_IMMEDIATELY',
                        CacheLength: 30,
                        CaptionData: 'ALL',
                        RestartDelay: 15
                    }
                },
                Outputs: [{
                    OutputName: 'rtmp-output',
                    OutputSettings: {
                        RtmpOutputSettings: {
                            CertificateMode: 'SELF_SIGNED',
                            ConnectionRetryInterval: 2,
                            NumRetries: 10,
                            Destination: {
                                DestinationRefId: 'rtmp-destination'
                            }
                        }
                    },
                    VideoDescriptionName: currentConfig.EncoderSettings.VideoDescriptions[1].Name,
                    AudioDescriptionNames: currentConfig.EncoderSettings.AudioDescriptions.map(a => a.Name)
                }]
            };

            filteredOutputGroups.push(rtmpOutputGroup);

            const rtmpDestination = {
                Id: 'rtmp-destination',
                Settings: [{
                    Url: `${rtmpUrl}/${streamKey}`
                }]
            };

            const updatedDestinations = destinations.filter(d => d.Id !== 'rtmp-destination');
            updatedDestinations.push(rtmpDestination);

            const updateCommand = new UpdateChannelCommand({
                ChannelId: channelId,
                Destinations: updatedDestinations,
                EncoderSettings: {
                    ...currentConfig.EncoderSettings,
                    OutputGroups: filteredOutputGroups
                }
            });

            await this.client.send(updateCommand);

            console.log(`[AWS MediaLive] Configured RTMP destination for channel ${channelNumber}: ${rtmpUrl}`);

            return {
                success: true,
                channelNumber,
                destinationType: 'RTMP',
                destinationName,
                url: rtmpUrl
            };

        } catch (error) {
            console.error(`[AWS MediaLive] Error configuring RTMP destination for channel ${channelNumber}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async configureSRTDestination(channelNumber, srtUrl, streamId, destinationName = 'Temp-SRT') {
        const channelId = this.channelMap[channelNumber];

        if (!channelId) {
            return {
                success: false,
                error: `Channel ${channelNumber} not configured`
            };
        }

        try {
            console.log(`[MediaConnect] Creating flow for SRT destination...`);

            const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
            const currentConfig = await this.client.send(describeCmd);

            if (currentConfig.State !== 'IDLE') {
                return {
                    success: false,
                    error: `Channel must be IDLE to configure destination. Current state: ${currentConfig.State}`
                };
            }

            const srtMatch = srtUrl.match(/srt:\/\/([^:]+):(\d+)/);
            if (!srtMatch) {
                return {
                    success: false,
                    error: 'Invalid SRT URL format. Expected: srt://host:port'
                };
            }

            const [, srtHost, srtPort] = srtMatch;

            const flowName = `redcorner-ch${channelNumber}-srt-${Date.now()}`;

            const createFlowCommand = new CreateFlowCommand({
                Name: flowName,
                Source: {
                    Name: 'MediaLive-UDP',
                    Protocol: 'rtp',
                    WhitelistCidr: '0.0.0.0/0'
                }
            });

            const flowResponse = await this.mediaConnectClient.send(createFlowCommand);
            const flowArn = flowResponse.Flow.FlowArn;
            const sourceIngestPort = flowResponse.Flow.Source.IngestPort;

            console.log(`[MediaConnect] Flow created: ${flowArn}`);
            console.log(`[MediaConnect] Ingest port: ${sourceIngestPort}`);

            this.mediaConnectFlows[channelNumber] = flowArn;

            const addOutputCommand = new AddFlowOutputsCommand({
                FlowArn: flowArn,
                Outputs: [{
                    Name: 'SRT-Output',
                    Protocol: 'srt-caller',
                    Destination: srtHost,
                    Port: parseInt(srtPort),
                    SrtSettings: {
                        SourceId: streamId
                    }
                }]
            });

            await this.mediaConnectClient.send(addOutputCommand);
            console.log(`[MediaConnect] SRT output added to flow`);

            const destinations = currentConfig.Destinations || [];
            const outputGroups = currentConfig.EncoderSettings.OutputGroups || [];

            const filteredOutputGroups = outputGroups.filter(og => {
                const name = og.Name || '';
                return name === 'preview' || name === 'program' || name === 'program-recording';
            });

            const udpOutputGroup = {
                Name: destinationName,
                OutputGroupSettings: {
                    UdpGroupSettings: {
                        TimedMetadataId3Frame: 'PRIV',
                        TimedMetadataId3Period: 10
                    }
                },
                Outputs: [{
                    OutputName: 'udp-to-mediaconnect',
                    OutputSettings: {
                        UdpOutputSettings: {
                            Destination: {
                                DestinationRefId: 'mediaconnect-destination'
                            },
                            ContainerSettings: {
                                M2tsSettings: {
                                    AudioBufferModel: 'ATSC',
                                    AudioFramesPerPes: 2,
                                    AudioStreamType: 'DVB',
                                    Bitrate: 8000000,
                                    BufferModel: 'MULTIPLEX',
                                    CcDescriptor: 'DISABLED',
                                    EbpPlacement: 'VIDEO_AND_AUDIO_PIDS',
                                    NielsenId3Behavior: 'NO_PASSTHROUGH',
                                    PcrControl: 'PCR_EVERY_PES_PACKET',
                                    PmtInterval: 100,
                                    ProgramNum: 1,
                                    RateMode: 'CBR',
                                    SegmentationStyle: 'MAINTAIN_CADENCE',
                                    TimedMetadataBehavior: 'NO_PASSTHROUGH'
                                }
                            }
                        }
                    },
                    VideoDescriptionName: currentConfig.EncoderSettings.VideoDescriptions[1].Name,
                    AudioDescriptionNames: currentConfig.EncoderSettings.AudioDescriptions.map(a => a.Name)
                }]
            };

            filteredOutputGroups.push(udpOutputGroup);

            const mediaConnectDestination = {
                Id: 'mediaconnect-destination',
                Settings: [{
                    Url: `rtp://127.0.0.1:${sourceIngestPort}`
                }]
            };

            const updatedDestinations = destinations.filter(d => 
                d.Id !== 'srt-destination' && d.Id !== 'mediaconnect-destination'
            );
            updatedDestinations.push(mediaConnectDestination);

            const updateCommand = new UpdateChannelCommand({
                ChannelId: channelId,
                Destinations: updatedDestinations,
                EncoderSettings: {
                    ...currentConfig.EncoderSettings,
                    OutputGroups: filteredOutputGroups
                }
            });

            await this.client.send(updateCommand);

            console.log(`[AWS] Configured MediaLive → MediaConnect → SRT for channel ${channelNumber}`);

            return {
                success: true,
                channelNumber,
                destinationType: 'SRT (via MediaConnect)',
                destinationName,
                url: srtUrl,
                flowArn: flowArn
            };

        } catch (error) {
            console.error(`[AWS] Error configuring SRT destination:`, error.message);
            
            if (this.mediaConnectFlows[channelNumber]) {
                try {
                    await this.mediaConnectClient.send(new DeleteFlowCommand({
                        FlowArn: this.mediaConnectFlows[channelNumber]
                    }));
                    delete this.mediaConnectFlows[channelNumber];
                } catch (cleanupError) {
                    console.error(`[MediaConnect] Error cleaning up flow:`, cleanupError.message);
                }
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    async removeDestination(channelNumber) {
        const channelId = this.channelMap[channelNumber];

        if (!channelId) {
            return {
                success: false,
                error: `Channel ${channelNumber} not configured`
            };
        }

        try {
            const describeCmd = new DescribeChannelCommand({ ChannelId: channelId });
            const currentConfig = await this.client.send(describeCmd);

            if (currentConfig.State !== 'IDLE') {
                return {
                    success: false,
                    error: `Channel must be IDLE to remove destination. Current state: ${currentConfig.State}`
                };
            }

            if (this.mediaConnectFlows[channelNumber]) {
                console.log(`[MediaConnect] Deleting flow for channel ${channelNumber}...`);
                try {
                    await this.mediaConnectClient.send(new DeleteFlowCommand({
                        FlowArn: this.mediaConnectFlows[channelNumber]
                    }));
                    console.log(`[MediaConnect] Flow deleted`);
                } catch (error) {
                    console.error(`[MediaConnect] Error deleting flow:`, error.message);
                }
                delete this.mediaConnectFlows[channelNumber];
            }

            const outputGroups = currentConfig.EncoderSettings.OutputGroups || [];

            const filteredOutputGroups = outputGroups.filter(og => {
                const name = og.Name || '';
                return name === 'preview' || name === 'program' || name === 'program-recording';
            });

            const destinations = currentConfig.Destinations || [];

            const filteredDestinations = destinations.filter(d =>
                d.Id !== 'rtmp-destination' && d.Id !== 'srt-destination' && d.Id !== 'mediaconnect-destination'
            );

            const updateCommand = new UpdateChannelCommand({
                ChannelId: channelId,
                Destinations: filteredDestinations,
                EncoderSettings: {
                    ...currentConfig.EncoderSettings,
                    OutputGroups: filteredOutputGroups
                }
            });

            await this.client.send(updateCommand);

            console.log(`[AWS MediaLive] Removed destination for channel ${channelNumber}`);

            return {
                success: true,
                channelNumber,
                message: 'Destination removed successfully'
            };

        } catch (error) {
            console.error(`[AWS MediaLive] Error removing destination for channel ${channelNumber}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async activateOverlayDynamic(channelNumber, overlayUrl) {
        try {
            const channelId = this.channelMap[channelNumber];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log('[AWS] Activating overlay on channel ' + channelNumber);

            const command = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: 'activate-overlay-' + Date.now(),
                        ScheduleActionStartSettings: { ImmediateModeScheduleActionStartSettings: {} },
                        ScheduleActionSettings: {
                            MotionGraphicsImageActivateSettings: {
                                Url: overlayUrl,
                                Duration: 86400000
                            }
                        }
                    }]
                }
            });

            await this.client.send(command);

            return { success: true, message: 'Overlay activated', url: overlayUrl };
        } catch (error) {
            console.error('[AWS] Error:', error);
            return { success: false, message: error.message };
        }
    }

    async deactivateOverlayDynamic(channelNumber) {
        try {
            const channelId = this.channelMap[channelNumber];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log('[AWS] Deactivating overlay on channel ' + channelNumber);

            const command = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: 'deactivate-overlay-' + Date.now(),
                        ScheduleActionStartSettings: { ImmediateModeScheduleActionStartSettings: {} },
                        ScheduleActionSettings: {
                            MotionGraphicsImageDeactivateSettings: {}
                        }
                    }]
                }
            });

            await this.client.send(command);

            return { success: true, message: 'Overlay deactivated' };
        } catch (error) {
            console.error('[AWS] Error:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = AWSMediaLiveManager;
