#!/bin/bash
set -e

echo "Ì†ΩÌ Fixing missing overlay functions..."

# Backup
cp aws-medialive-manager.js aws-medialive-manager.js.backup-$(date +%Y%m%d-%H%M%S)
echo "¥ß‚úÖ Backup created"

# Step 1: Fix the imports on line 1
echo "Ì†ΩÌ Adding BatchUpdateScheduleCommand to imports..."
sed -i '1s/UpdateChannelCommand/UpdateChannelCommand, BatchUpdateScheduleCommand/' aws-medialive-manager.js

# Step 2: Insert the two new functions before the closing brace (line 758)
echo "≥ùÌ†ΩÌ Adding activateOverlayDynamic and deactivateOverlayDynamic functions..."

# Create a temp file with the new functions
cat > /tmp/new-functions.txt << 'EOF'

    async activateOverlayDynamic(channelNumber, overlayUrl) {
        try {
            const channelId = this.channelMap[channelNumber];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log(`[AWS] Activating overlay dynamically on channel ${channelNumber}: ${overlayUrl}`);

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
                                Duration: 86400000
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
            const channelId = this.channelMap[channelNumber];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log(`[AWS] Deactivating overlay dynamically on channel ${channelNumber}`);

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
EOF

# Insert before line 758 (the closing brace)
head -n 757 aws-medialive-manager.js > /tmp/manager-new.js
cat /tmp/new-functions.txt >> /tmp/manager-new.js
tail -n +758 aws-medialive-manager.js >> /tmp/manager-new.js
mv /tmp/manager-new.js aws-medialive-manager.js

echo "≥ù‚úÖ Functions added"

# Step 3: Verify the syntax
echo "Ì†ΩÌ Checking syntax..."
node -c aws-medialive-manager.js && echo "¥ç‚úÖ Syntax OK" || echo "‚ùå Syntax error - check the file"

# Step 4: Show what was added
echo ""
echo "Ì†ΩÌ Added functions:"
grep -n "activateOverlayDynamic\|deactivateOverlayDynamic" aws-medialive-manager.js

# Step 5: Restart PM2
echo ""
echo "≥ãÌ†ΩÌ Restarting PM2..."
pm2 restart redcorner-dashboard

echo ""
echo "¥Ñ‚úÖ Fix complete!"
echo ""
echo "Ì†æÌ Test by:"
echo "1. Login at http://3.25.93.114:3000/"
echo "2. Try activating an overlay"
echo ""
echo "∑™Ì†ΩÌ Check logs: pm2 logs redcorner-dashboard"
