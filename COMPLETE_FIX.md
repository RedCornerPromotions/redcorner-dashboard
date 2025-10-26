# Complete Fix Plan

## Files to modify:
1. aws-medialive-manager.js
2. public/dashboard.js  
3. public/dashboard-destinations.js

## Changes to aws-medialive-manager.js:

### 1. Line 1 - Add import
BEFORE: const { MediaLiveClient, StartChannelCommand, StopChannelCommand, DescribeChannelCommand, UpdateChannelCommand } = require("@aws-sdk/client-medialive");
AFTER:  const { MediaLiveClient, StartChannelCommand, StopChannelCommand, DescribeChannelCommand, UpdateChannelCommand, BatchUpdateScheduleCommand } = require("@aws-sdk/client-medialive");

### 2. Remove FEC blocks (2 locations)
- Delete lines with FecOutputSettings { ... }
- Fix trailing commas

### 3. Add before line 760 (closing brace):
- activateOverlayDynamic(channelNumber, overlayUrl) function
- deactivateOverlayDynamic(channelNumber) function

## Changes to public/dashboard.js:
- Line 167, 186: Add credentials: 'include'

## Changes to public/dashboard-destinations.js:
- Line 17, 52: Add credentials: 'include'

