#!/bin/bash
set -e

echo "Ì†ΩÌ Applying complete fix..."

# Backup everything
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp aws-medialive-manager.js aws-medialive-manager.js.backup-FINAL-$TIMESTAMP
cp public/dashboard.js public/dashboard.js.backup-FINAL-$TIMESTAMP
cp public/dashboard-destinations.js public/dashboard-destinations.js.backup-FINAL-$TIMESTAMP

echo "¥ß‚úÖ Backups created: *-FINAL-$TIMESTAMP"

# Fix 1: Add BatchUpdateScheduleCommand to imports
echo "Ì†ΩÌ Adding BatchUpdateScheduleCommand import..."
sed -i '1s/UpdateChannelCommand/UpdateChannelCommand, BatchUpdateScheduleCommand/' aws-medialive-manager.js

# Fix 2: Remove FEC blocks using Python with proper encoding
echo "≥ùÌ†ΩÌ Removing FEC blocks..."
python3 << 'PYEND'
# -*- coding: utf-8 -*-
with open('aws-medialive-manager.js', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Find and remove FEC blocks
new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    if i < skip_until:
        continue
    
    if 'FecOutputSettings: {' in line:
        skip_until = i + 4
        if new_lines and new_lines[-1].rstrip().endswith('},'):
            new_lines[-1] = new_lines[-1].replace('},', '}')
        continue
    
    new_lines.append(line)

with open('aws-medialive-manager.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("FEC removed")
PYEND

# Fix 3: Add overlay functions before closing brace
echo "≥ùÌ†ΩÌ Adding overlay functions..."
LAST_LINE=$(wc -l < aws-medialive-manager.js)
INSERT_LINE=$((LAST_LINE - 1))

cat > /tmp/overlay-funcs.js << 'JSEND'

    async activateOverlayDynamic(channelNumber, overlayUrl) {
        try {
            const channelId = this.channelMap[channelNumber];
            if (!channelId) {
                return { success: false, message: 'Channel not configured' };
            }

            console.log('[AWS] Activating overlay dynamically on channel ' + channelNumber + ': ' + overlayUrl);

            const command = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: 'activate-overlay-' + Date.now(),
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
            console.log('[AWS] Overlay activated on channel ' + channelNumber);
            
            return { 
                success: true, 
                message: 'Overlay activated successfully',
                url: overlayUrl 
            };
        } catch (error) {
            console.error('[AWS] Error activating overlay:', error);
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

            console.log('[AWS] Deactivating overlay dynamically on channel ' + channelNumber);

            const command = new BatchUpdateScheduleCommand({
                ChannelId: channelId,
                Creates: {
                    ScheduleActions: [{
                        ActionName: 'deactivate-overlay-' + Date.now(),
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
            console.log('[AWS] Overlay deactivated on channel ' + channelNumber);
            
            return { 
                success: true, 
                message: 'Overlay deactivated successfully' 
            };
        } catch (error) {
            console.error('[AWS] Error deactivating overlay:', error);
            return { 
                success: false, 
                message: error.message || 'Failed to deactivate overlay' 
            };
        }
    }
JSEND

head -n $INSERT_LINE aws-medialive-manager.js > /tmp/manager-temp.js
cat /tmp/overlay-funcs.js >> /tmp/manager-temp.js
tail -n 1 aws-medialive-manager.js >> /tmp/manager-temp.js
mv /tmp/manager-temp.js aws-medialive-manager.js

# Fix 4: Add credentials to dashboard files
echo "≥ùÌ†ΩÌ Fixing credentials..."
sed -i '17s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard-destinations.js
sed -i '52s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard-destinations.js

# Verify syntax
echo ""
echo "≥ùÌ†ΩÌ Verifying syntax..."
node -c aws-medialive-manager.js && echo "¥ç‚úÖ Syntax OK" || { echo "‚ùå Syntax error!"; exit 1; }

# Verify changes
echo ""
echo "Ì†ΩÌ Verifying changes..."
grep -q "BatchUpdateScheduleCommand" aws-medialive-manager.js && echo "¥ç‚úÖ Import added"
grep -c "activateOverlayDynamic" aws-medialive-manager.js
grep "FecOutputSettings" aws-medialive-manager.js || echo "‚úÖ FEC removed"

# Restart
echo ""
echo "Ì†ΩÌ Restarting..."
pm2 restart redcorner-dashboard

sleep 3
pm2 status | grep redcorner

echo ""
echo "¥Ñ‚úÖ DONE! Test at http://3.25.93.114:3000"
