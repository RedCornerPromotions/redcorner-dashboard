#!/bin/bash
set -e

echo "Ì†ΩÌ Applying comprehensive fixes..."

# Backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp aws-medialive-manager.js aws-medialive-manager.js.backup-$TIMESTAMP
cp public/dashboard.js public/dashboard.js.backup-$TIMESTAMP
cp public/dashboard-destinations.js public/dashboard-destinations.js.backup-$TIMESTAMP

echo "¥ß‚úÖ Backups created with timestamp: $TIMESTAMP"

# Fix 1: Change srt:// to udp:// in URL (lines 364 and 659)
echo "Ì†ΩÌ Fixing SRT URL protocol..."
sed -i '364s|Url: `${srtUrl}|Url: `udp://${host}:${port}|' aws-medialive-manager.js
sed -i '659s|Url: `${srtUrl}|Url: `udp://${host}:${port}|' aws-medialive-manager.js

# Fix 2: Remove FEC settings (find and remove FEC blocks)
echo "≥ùÌ†ΩÌ Removing FEC settings..."
python3 << 'PYEND'
with open('aws-medialive-manager.js', 'r') as f:
    content = f.read()

# Remove FEC settings
content = content.replace('''                        },
                        FecOutputSettings: {
                            ColumnDepth: 4,
                            IncludeFec: 'COLUMN',
                            RowLength: 5
                        }''', '''                        }''')

with open('aws-medialive-manager.js', 'w') as f:
    f.write(content)
PYEND

# Fix 3: Fix video/audio description names (use actual config instead of hardcoded)
echo "≥ùÌ†ΩÌ Fixing video/audio descriptions..."
sed -i "s/VideoDescriptionName: 'video_1'/VideoDescriptionName: currentConfig.EncoderSettings.VideoDescriptions[0]?.Name || 'video'/g" aws-medialive-manager.js
sed -i "s/AudioDescriptionNames: \['audio_1'\]/AudioDescriptionNames: currentConfig.EncoderSettings.AudioDescriptions?.map(a => a.Name) || []/g" aws-medialive-manager.js

# Fix 4: Add missing overlay functions
echo "≥ùÌ†ΩÌ Adding overlay dynamic functions..."
# Find line before closing brace (should be around line 757)
LINE=$(grep -n "^}$" aws-medialive-manager.js | tail -1 | cut -d: -f1)
INSERTLINE=$((LINE - 1))

# Create temp file with new functions
cat > /tmp/overlay-functions.txt << 'FUNCEND'

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
FUNCEND

# Insert functions before closing brace
head -n $INSERTLINE aws-medialive-manager.js > /tmp/manager-new.js
cat /tmp/overlay-functions.txt >> /tmp/manager-new.js
tail -n +$LINE aws-medialive-manager.js >> /tmp/manager-new.js
mv /tmp/manager-new.js aws-medialive-manager.js

# Fix 5: Add BatchUpdateScheduleCommand to imports
echo "≥ùÌ†ΩÌ Adding BatchUpdateScheduleCommand import..."
sed -i '1s/UpdateChannelCommand/UpdateChannelCommand, BatchUpdateScheduleCommand/' aws-medialive-manager.js

# Fix 6: Add credentials to dashboard fetch calls
echo "≥ùÌ†ΩÌ Adding credentials to fetch calls..."
sed -i '167s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard.js
sed -i '186s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard.js
sed -i '17s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard-destinations.js
sed -i '52s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard-destinations.js

# Verify syntax
echo "≥ùÌ†ΩÌ Checking syntax..."
node -c aws-medialive-manager.js && echo "¥ç‚úÖ aws-medialive-manager.js syntax OK" || { echo "‚ùå Syntax error!"; exit 1; }

# Restart PM2
echo "Ì†ΩÌ Restarting server..."
pm2 restart redcorner-dashboard

sleep 3

# Check if running
pm2 list | grep redcorner-dashboard

echo ""
echo "¥Ñ‚úÖ All fixes applied!"
echo ""
echo "Fixed issues:"
echo "  ‚úÖ Added activateOverlayDynamic and deactivateOverlayDynamic functions"
echo "  ‚úÖ Changed SRT URLs from srt:// to udp://"
echo "  ‚úÖ Removed FEC settings"
echo "  ‚úÖ Fixed video/audio description references"
echo "  ‚úÖ Added credentials: 'include' to all fetch calls"
echo "  ‚úÖ Added BatchUpdateScheduleCommand import"
echo ""
echo "Test now:"
echo "  1. Refresh browser (Ctrl+Shift+R)"
echo "  2. Try activating an overlay"
echo "  3. Try configuring SRT destination"
