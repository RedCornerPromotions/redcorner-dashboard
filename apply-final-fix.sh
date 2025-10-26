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

# Fix 2: Remove FEC blocks using Python (safer than sed)
echo "≥ùÌ†ΩÌ Removing FEC blocks..."
python3 << 'PYEND'
with open('aws-medialive-manager.js', 'r') as f:
    lines = f.readlines()

# Find and remove FEC blocks (working backwards)
new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    if i < skip_until:
        continue
    
    if 'FecOutputSettings: {' in line:
        # Found FEC block start, skip next 4 lines
        skip_until = i + 4
        # Fix the previous line's comma
        if new_lines and new_lines[-1].rstrip().endswith('},'):
            new_lines[-1] = new_lines[-1].replace('},', '}')
        continue
    
    new_lines.append(line)

with open('aws-medialive-manager.js', 'w') as f:
    f.writelines(new_lines)
print("≥ù‚úÖ FEC removed")
PYEND

# Fix 3: Add overlay functions before closing brace
echo "Ì†ΩÌ Adding overlay functions..."
LAST_LINE=$(wc -l < aws-medialive-manager.js)
INSERT_LINE=$((LAST_LINE - 1))

# Create functions file
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

# Insert functions
head -n $INSERT_LINE aws-medialive-manager.js > /tmp/manager-temp.js
cat /tmp/overlay-funcs.js >> /tmp/manager-temp.js
tail -n 1 aws-medialive-manager.js >> /tmp/manager-temp.js
mv /tmp/manager-temp.js aws-medialive-manager.js

# Fix 4: Add credentials to dashboard.js (only if missing)
echo "≥ùÌ†ΩÌ Fixing dashboard.js credentials..."
grep -q "credentials.*include" public/dashboard.js || {
    sed -i '167s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard.js
    sed -i '186s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard.js
}

# Fix 5: Add credentials to dashboard-destinations.js (only if missing)
echo "≥ùÌ†ΩÌ Fixing dashboard-destinations.js credentials..."
sed -i '17s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard-destinations.js
sed -i '52s/method: '\''POST'\'',/method: '\''POST'\'', credentials: '\''include'\'',/' public/dashboard-destinations.js

# Verify syntax
echo ""
echo "≥ùÌ†ΩÌ Verifying syntax..."
node -c aws-medialive-manager.js && echo "¥ç‚úÖ aws-medialive-manager.js OK" || { echo "‚ùå Syntax error!"; exit 1; }

# Verify changes
echo ""
echo "Ì†ΩÌ Verifying changes..."
grep -q "BatchUpdateScheduleCommand" aws-medialive-manager.js && echo "¥ç‚úÖ Import added" || echo "‚ùå Import missing"
grep -c "activateOverlayDynamic" aws-medialive-manager.js | grep -q "2" && echo "‚úÖ Overlay functions added" || echo "‚ùå Functions missing"
grep "FecOutputSettings" aws-medialive-manager.js && echo "‚ùå FEC still present" || echo "‚úÖ FEC removed"
grep -c "credentials.*include" public/dashboard.js | grep -q "[2-4]" && echo "‚úÖ Dashboard credentials OK" || echo "‚ö†Ô∏è  Dashboard credentials partial"

# Restart server
echo ""
echo "Ì†ΩÌ Restarting server..."
pm2 restart redcorner-dashboard

sleep 3
pm2 status | grep redcorner

echo ""
echo "¥Ñ‚úÖ COMPLETE! Check dashboard at http://3.25.93.114:3000"
echo ""
echo "Test checklist:"
echo "  [ ] Login works"
echo "  [ ] Start channel works"
echo "  [ ] Activate overlay works (with URL filled in)"
echo "  [ ] Configure RTMP works"
echo "  [ ] Configure SRT works (without FEC error)"
