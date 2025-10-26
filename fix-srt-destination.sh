#!/bin/bash
set -e

echo "Ì†ΩÌ Fixing SRT destination configuration..."

# Backup
cp aws-medialive-manager.js aws-medialive-manager.js.backup-srt-$(date +%Y%m%d-%H%M%S)
echo "¥ß‚úÖ Backup created"

# Create a Python script to do the fix (easier than sed for multi-line)
cat > /tmp/fix_srt.py << 'PYSCRIPT'
import re

with open('aws-medialive-manager.js', 'r') as f:
    content = f.read()

# Fix 1: Remove FEC settings completely (lines 344-350)
old_fec = '''                        },
                        FecOutputSettings: {
                            ColumnDepth: 4,
                            IncludeFec: 'COLUMN',
                            RowLength: 5
                        }'''

new_fec = '''                        }'''

content = content.replace(old_fec, new_fec)

# Fix 2: Get actual video/audio descriptions from config instead of hardcoded values
old_descriptions = '''                },
                VideoDescriptionName: 'video_1',
                AudioDescriptionNames: ['audio_1']'''

new_descriptions = '''                },
                VideoDescriptionName: currentConfig.EncoderSettings.VideoDescriptions[0]?.Name || 'video',
                AudioDescriptionNames: currentConfig.EncoderSettings.AudioDescriptions?.map(a => a.Name) || []'''

content = content.replace(old_descriptions, new_descriptions)

# Fix 3: Use proper SRT URL format
old_url = '''                Url: `udp://${host}:${port}?pkt_size=1316&mode=caller&streamid=${encodeURIComponent(streamId)}`'''

new_url = '''                Url: `${srtUrl}?mode=caller${streamId ? '&streamid=' + encodeURIComponent(streamId) : ''}`'''

content = content.replace(old_url, new_url)

with open('aws-medialive-manager.js', 'w') as f:
    f.write(content)

print("‚úÖ Fixed SRT configuration")
PYSCRIPT

python3 /tmp/fix_srt.py

# Verify syntax
echo "Ì†ΩÌ Checking syntax..."
node -c aws-medialive-manager.js && echo "¥ç‚úÖ Syntax OK" || (echo "‚ùå Syntax error!" && exit 1)

# Show what changed
echo ""
echo "Ì†ΩÌ Changes made:"
echo "1. Removed FEC settings (incompatible with SRT)"
echo "2. Using actual video/audio descriptions from channel config"
echo "3. Fixed SRT URL format"

# Restart
echo ""
echo "≥ãÌ†ΩÌ Restarting server..."
pm2 restart redcorner-dashboard

sleep 2
pm2 logs redcorner-dashboard --lines 5 --nostream

echo ""
echo "¥Ñ‚úÖ Fix complete! Try adding an SRT destination now."
