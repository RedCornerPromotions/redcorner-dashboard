// Add these functions to the AWSMediaLiveManager class in aws-medialive-manager.js

    async activateOverlayDynamic(channelNumber, overlayUrl) {
        try {
            const channelId = this.channels[`channel${channelNumber}`];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log(`[AWS] Activating overlay dynamically on channel ${channelNumber}: ${overlayUrl}`);

            // Use Schedule Actions to activate motion graphics overlay on a RUNNING channel
            const command = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: `activate-overlay-${Date.now()}`,
                        ScheduleActionStartSettings: {
                            ImmediateModeScheduleActionStartSettings: {}
                        },
                        ScheduleActionSettings: {
                            MotionGraphicsImageActivateSettings: {
                                Url: overlayUrl,
                                Duration: 86400000 // 24 hours in milliseconds
                            }
                        }
                    }]
                }
            });

            await this.client.send(command);
            console.log(`[AWS] Overlay activated on channel ${channelNumber}`);
            
            return { 
                success: true, 
                message: 'Overlay activated successfully',
                url: overlayUrl 
            };
        } catch (error) {
            console.error(`[AWS] Error activating overlay:`, error);
            return { 
                success: false, 
                message: error.message || 'Failed to activate overlay' 
            };
        }
    }

    async deactivateOverlayDynamic(channelNumber) {
        try {
            const channelId = this.channels[`channel${channelNumber}`];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log(`[AWS] Deactivating overlay dynamically on channel ${channelNumber}`);

            // Use Schedule Actions to deactivate motion graphics overlay
            const command = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: `deactivate-overlay-${Date.now()}`,
                        ScheduleActionStartSettings: {
                            ImmediateModeScheduleActionStartSettings: {}
                        },
                        ScheduleActionSettings: {
                            MotionGraphicsImageDeactivateSettings: {}
                        }
                    }]
                }
            });

            await this.client.send(command);
            console.log(`[AWS] Overlay deactivated on channel ${channelNumber}`);
            
            return { 
                success: true, 
                message: 'Overlay deactivated successfully' 
            };
        } catch (error) {
            console.error(`[AWS] Error deactivating overlay:`, error);
            return { 
                success: false, 
                message: error.message || 'Failed to deactivate overlay' 
            };
        }
    }
