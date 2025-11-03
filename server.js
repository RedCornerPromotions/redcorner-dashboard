require('dotenv').config();
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const AWSMediaLiveManager = require('./aws-medialive-manager');

const app = express();
const PORT = process.env.PORT || 3000;

const awsManager = new AWSMediaLiveManager();

app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'red-corner-aws-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts' }
});

function requireAuth(req, res, next) {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'redcorner2025';
    if (username === validUsername && password === validPassword) {
        req.session.authenticated = true;
        req.session.username = username;
        return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

app.post('/api/channel/:num/start', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    if (channelNum < 1 || channelNum > 5) return res.status(400).json({ error: 'Invalid channel' });
    const result = await awsManager.startChannel(channelNum);
    res.json(result);
});

app.post('/api/channel/:num/stop', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    if (channelNum < 1 || channelNum > 5) return res.status(400).json({ error: 'Invalid channel' });
    const result = await awsManager.stopChannel(channelNum);
    res.json(result);
});

app.get('/api/channel/:num/status', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    if (channelNum < 1 || channelNum > 5) return res.status(400).json({ error: 'Invalid channel' });
    const result = await awsManager.getChannelStatus(channelNum);
    res.json(result);
});

app.post('/api/channel/:num/overlay', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    const { enabled, url } = req.body;
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    const result = await awsManager.setOverlay(channelNum, enabled, url);
    res.json(result);
});

// Dynamic overlay activation (NEW - works on RUNNING channels)
app.post('/api/channel/:num/overlay/activate', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    const { url } = req.body;
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    if (!url) {
        return res.status(400).json({ error: 'Overlay URL is required' });
    }
    const result = await awsManager.activateOverlayDynamic(channelNum, url);
    res.json(result);
});

// Dynamic overlay deactivation (NEW - works on RUNNING channels)
app.post('/api/channel/:num/overlay/deactivate', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    const result = await awsManager.deactivateOverlayDynamic(channelNum);
    res.json(result);
});

// Configure RTMP destination (NEW - channel must be IDLE)
app.post('/api/channel/:num/destination/rtmp', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    const { rtmpUrl, streamKey, name } = req.body;
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    if (!rtmpUrl || !streamKey) {
        return res.status(400).json({ error: 'RTMP URL and stream key are required' });
    }
    const result = await awsManager.configureRTMPDestination(channelNum, rtmpUrl, streamKey, name);
    res.json(result);
});

// Configure SRT destination (NEW - channel must be IDLE)
app.post('/api/channel/:num/destination/srt', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    const { srtUrl, streamId, name } = req.body;
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    if (!srtUrl || !streamId) {
        return res.status(400).json({ error: 'SRT URL and stream ID are required' });
    }
    const result = await awsManager.configureSRTDestination(channelNum, srtUrl, streamId, name);
    res.json(result);
});

// Remove destination (NEW - channel must be IDLE)
app.post('/api/channel/:num/destination/remove', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    const result = await awsManager.removeDestination(channelNum);
    res.json(result);
});

// MediaConnect flow management
app.get('/api/flows', requireAuth, async (req, res) => {
    const result = await awsManager.listAllFlows();
    res.json(result);
});

app.post('/api/flows/delete-all', requireAuth, async (req, res) => {
    console.log('[API] EMERGENCY: Deleting all MediaConnect flows');
    const result = await awsManager.deleteAllFlows();
    res.json(result);
});

app.get('/api/channels/status', requireAuth, async (req, res) => {
    const statuses = [];
    for (let i = 1; i <= 5; i++) {
        statuses.push(await awsManager.getChannelStatus(i));
    }
    res.json({ channels: statuses });
});

// Cost status check (for popup)
app.get('/api/cost-status', requireAuth, async (req, res) => {
    const channels = [];
    let runningCount = 0;
    let idleCount = 0;

    for (let i = 1; i <= 5; i++) {
        const status = await awsManager.getChannelStatus(i);
        channels.push(status);
        if (status.state === 'RUNNING') runningCount++;
        if (status.state === 'IDLE') idleCount++;
    }

    const flowsResult = await awsManager.listAllFlows();
    const flows = flowsResult.flows || [];

    // Use actual pricing from awsManager
    const hourlyCost =
        (runningCount * awsManager.costPerChannelHour) +
        (idleCount * awsManager.costPerChannelIdle) +
        (flows.length * awsManager.pricing.mediaconnect.flow);

    res.json({
        channels,
        flows,
        summary: {
            runningChannels: runningCount,
            idleChannels: idleCount,
            activeFlows: flows.length,
            hourlyCost: hourlyCost.toFixed(2),
            dailyCost: (hourlyCost * 24).toFixed(2),
            weeklyCost: (hourlyCost * 24 * 7).toFixed(2),
            monthlyCost: (hourlyCost * 24 * 30).toFixed(2),
            perChannelRunning: awsManager.costPerChannelHour.toFixed(2),
            perChannelIdle: awsManager.costPerChannelIdle.toFixed(2),
            perFlow: awsManager.pricing.mediaconnect.flow.toFixed(3)
        }
    });
});

app.get('/api/costs', requireAuth, async (req, res) => {
    const costs = await awsManager.getEstimatedCost();
    res.json(costs);
});


// Remove destination (DELETE - channel must be IDLE)
app.delete('/api/channel/:num/destination', requireAuth, async (req, res) => {
    const channelNum = parseInt(req.params.num);
    if (channelNum < 1 || channelNum > 5) {
        return res.status(400).json({ error: 'Invalid channel number' });
    }
    const result = await awsManager.removeDestination(channelNum);
    res.json(result);
});

// ==========================================
// RECORDINGS API ENDPOINTS
// ==========================================

const { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { MediaConvertClient, CreateJobCommand, GetJobCommand } = require('@aws-sdk/client-mediaconvert');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// MediaConvert client - needs endpoint from account
const mediaConvertClient = new MediaConvertClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const S3_BUCKET = 'redcornerliveaws-cloudfronttos3s3bucket9ce6ab04-o5i0suwrjg8o';
const SETTINGS_FILE = path.join(__dirname, 'recordings-settings.json');
const MEDIACONVERT_ROLE = process.env.MEDIACONVERT_ROLE || 'arn:aws:iam::385143423667:role/MediaConvertRole';

// Load recording name settings
function loadRecordingSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading recording settings:', error);
    }
    return {
        channel1: 'Channel_1_PGM',
        channel2: 'Ch2',
        channel3: 'Channel_3',
        channel4: 'Channel_4',
        channel5: 'Channel_5'
    };
}

// Save recording name settings
function saveRecordingSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving recording settings:', error);
        return false;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Generate download filename
function generateDownloadFilename(channel, originalKey, settings, fileDate) {
    const prefix = settings[`channel${channel}`] || `Ch${channel}`;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Use the file's actual date, not today's date
    const date = fileDate || new Date();
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dateNum = date.getDate();

    // Get file extension from original
    const ext = originalKey.split('.').pop();

    return `${prefix}_${day}_${month}_${dateNum}.${ext}`;
}

// List recordings
app.get('/api/recordings', requireAuth, async (req, res) => {
    try {
        const recordings = [];
        
        for (let channel = 1; channel <= 5; channel++) {
            const prefix = `recordings/channel${channel}/program/`;
            console.log(`Searching S3 path: ${prefix} in bucket: ${S3_BUCKET}`);

            const command = new ListObjectsV2Command({
                Bucket: S3_BUCKET,
                Prefix: prefix
            });

            try {
                const response = await s3Client.send(command);
                console.log(`Channel ${channel} - S3 returned ${response.Contents ? response.Contents.length : 0} files`);

                if (response.Contents && response.Contents.length > 0) {
                    const settings = loadRecordingSettings();

                    const tsFiles = response.Contents.filter(item => item.Key.endsWith('.ts'));
                    console.log(`Ch${channel}: ${tsFiles.length} .ts files found`);

                    const sizedFiles = tsFiles.filter(item => item.Size > 10000000); // Only show files > 10MB (archive recordings)
                    console.log(`Ch${channel}: ${sizedFiles.length} files > 10MB`);

                    const files = sizedFiles.map(item => {
                        try {
                            return {
                                key: item.Key,
                                size: item.Size,
                                sizeFormatted: formatFileSize(item.Size),
                                date: item.LastModified,
                                dateFormatted: formatDate(new Date(item.LastModified)),
                                displayName: generateDownloadFilename(channel, item.Key, settings, new Date(item.LastModified))
                            };
                        } catch (err) {
                            console.error(`Error mapping file ${item.Key}:`, err);
                            return null;
                        }
                    }).filter(item => item !== null)
                      .sort((a, b) => b.date - a.date);

                    console.log(`Ch${channel}: ${files.length} files after mapping`);

                    // Only add if we have files after filtering
                    if (files.length > 0) {
                        recordings.push({
                            channel,
                            files
                        });
                    }
                }
            } catch (err) {
                console.error(`Error listing recordings for channel ${channel}:`, err);
            }
        }

        res.json({ success: true, recordings });
    } catch (error) {
        console.error('Error listing recordings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// List converted downloads (MP4 files)
// MediaConvert saves to recordings/channel{N}/program/ folder (same as .ts files)
app.get('/api/downloads', requireAuth, async (req, res) => {
    try {
        const downloads = [];

        for (let channel = 1; channel <= 5; channel++) {
            // Check both possible locations for MP4 files
            const locations = [
                `recordings/channel${channel}/program/`,  // Where MediaConvert actually saves
                `downloads/channel${channel}/`             // Legacy/alternative location
            ];

            const allFiles = [];

            for (const prefix of locations) {
                console.log(`Searching: ${prefix} in bucket: ${S3_BUCKET}`);

                const command = new ListObjectsV2Command({
                    Bucket: S3_BUCKET,
                    Prefix: prefix
                });

                try {
                    const response = await s3Client.send(command);

                    if (response.Contents && response.Contents.length > 0) {
                        const mp4Files = response.Contents.filter(item =>
                            item.Key.endsWith('.mp4') && item.Size > 1000000 // Only MP4 files > 1MB
                        );
                        allFiles.push(...mp4Files);
                        console.log(`Ch${channel}: ${mp4Files.length} .mp4 files in ${prefix}`);
                    }
                } catch (err) {
                    console.error(`Error checking ${prefix}:`, err.message);
                }
            }

            if (allFiles.length > 0) {
                const files = allFiles.map(item => {
                    try {
                        // Determine if it's quick or HEVC based on filename
                        const isQuick = item.Key.includes('_quick');
                        const type = isQuick ? 'Quick H.264' : 'HEVC';

                        return {
                            key: item.Key,
                            size: item.Size,
                            sizeFormatted: formatFileSize(item.Size),
                            date: item.LastModified,
                            dateFormatted: formatDate(new Date(item.LastModified)),
                            displayName: item.Key.split('/').pop(), // Just the filename
                            type: type
                        };
                    } catch (err) {
                        console.error(`Error mapping download ${item.Key}:`, err);
                        return null;
                    }
                }).filter(item => item !== null)
                  .sort((a, b) => b.date - a.date);

                console.log(`Ch${channel}: ${files.length} total download files`);

                downloads.push({
                    channel,
                    files
                });
            }
        }

        res.json({ success: true, downloads });
    } catch (error) {
        console.error('Error listing downloads:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get recording settings
app.get('/api/recordings/settings', requireAuth, async (req, res) => {
    try {
        const settings = loadRecordingSettings();
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save recording settings
app.post('/api/recordings/settings', requireAuth, async (req, res) => {
    try {
        const { settings } = req.body;
        const success = saveRecordingSettings(settings);
        res.json({ success });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download recording
app.get('/api/recordings/download/:channel/:fileKey(*)', requireAuth, async (req, res) => {
    try {
        const { channel, fileKey } = req.params;
        const displayName = req.query.name || fileKey;
        
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: decodeURIComponent(fileKey)
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        // Redirect to signed URL with custom filename
        res.redirect(url);
    } catch (error) {
        console.error('Error downloading recording:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete recording
app.delete('/api/recordings/:channel/:fileKey(*)', requireAuth, async (req, res) => {
    try {
        const { fileKey } = req.params;

        const command = new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: decodeURIComponent(fileKey)
        });

        await s3Client.send(command);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function to create MediaConvert job parameters
function createMediaConvertJobParams(decodedKey, outputKey, outputFilename, isQuick = false) {
    const suffix = isQuick ? '_quick' : '';
    const codec = isQuick ? 'H_264' : 'H_265';

    const videoSettings = isQuick ? {
        // H.264 - Fast encoding
        Codec: 'H_264',
        H264Settings: {
            RateControlMode: 'QVBR',
            QualityTuningLevel: 'SINGLE_PASS',
            MaxBitrate: 8000000,
            QvbrSettings: {
                QvbrQualityLevel: 7
            }
        }
    } : {
        // H.265 - High quality, slow encoding
        Codec: 'H_265',
        H265Settings: {
            RateControlMode: 'QVBR',
            QualityTuningLevel: 'SINGLE_PASS_HQ',
            MaxBitrate: 8000000,
            QvbrSettings: {
                QvbrQualityLevel: 8
            }
        }
    };

    return {
        Role: MEDIACONVERT_ROLE,
        AccelerationSettings: {
            Mode: 'PREFERRED'
        },
        Settings: {
            Inputs: [{
                FileInput: `s3://${S3_BUCKET}/${decodedKey}`,
                TimecodeSource: 'ZEROBASED',
                AudioSelectors: {
                    'Audio Selector 1': {
                        DefaultSelection: 'DEFAULT'
                    }
                }
            }],
            OutputGroups: [{
                Name: 'File Group',
                OutputGroupSettings: {
                    Type: 'FILE_GROUP_SETTINGS',
                    FileGroupSettings: {
                        Destination: `s3://${S3_BUCKET}/${outputKey.substring(0, outputKey.lastIndexOf('/') + 1)}`
                    }
                },
                Outputs: [{
                    ContainerSettings: {
                        Container: 'MP4',
                        Mp4Settings: {}
                    },
                    VideoDescription: {
                        CodecSettings: videoSettings
                    },
                    AudioDescriptions: [{
                        AudioSourceName: 'Audio Selector 1',
                        CodecSettings: {
                            Codec: 'AAC',
                            AacSettings: {
                                Bitrate: 128000,
                                CodecProfile: 'LC',
                                CodingMode: 'CODING_MODE_2_0',
                                SampleRate: 48000
                            }
                        }
                    }],
                    NameModifier: `_${outputFilename.replace('.mp4', '')}${suffix}`
                }]
            }]
        }
    };
}

// Convert recording to MP4 (creates both quick H.264 and HEVC versions)
app.post('/api/recordings/convert/:channel/:fileKey(*)', requireAuth, async (req, res) => {
    try {
        const { channel, fileKey } = req.params;
        const decodedKey = decodeURIComponent(fileKey);

        console.log('=== DUAL CONVERSION REQUEST RECEIVED ===');
        console.log('Channel:', channel);
        console.log('File Key:', decodedKey);

        // Get the settings for custom filename
        const settings = loadRecordingSettings();
        const outputFilename = generateDownloadFilename(channel, decodedKey, settings).replace('.ts', '.mp4');

        // Extract just the filename without path
        const inputFilename = decodedKey.split('/').pop();
        const outputKey = decodedKey.replace(inputFilename, outputFilename);

        console.log('Creating QUICK H.264 job...');
        const quickJobParams = createMediaConvertJobParams(decodedKey, outputKey, outputFilename, true);
        const quickCommand = new CreateJobCommand(quickJobParams);
        const quickResponse = await mediaConvertClient.send(quickCommand);

        console.log('Quick job created:', quickResponse.Job.Id);

        console.log('Creating HEVC job...');
        const hevcJobParams = createMediaConvertJobParams(decodedKey, outputKey, outputFilename, false);
        const hevcCommand = new CreateJobCommand(hevcJobParams);
        const hevcResponse = await mediaConvertClient.send(hevcCommand);

        console.log('HEVC job created:', hevcResponse.Job.Id);

        res.json({
            success: true,
            quickJob: {
                jobId: quickResponse.Job.Id,
                status: quickResponse.Job.Status,
                outputFilename: outputFilename.replace('.mp4', '_quick.mp4')
            },
            hevcJob: {
                jobId: hevcResponse.Job.Id,
                status: hevcResponse.Job.Status,
                outputFilename: outputFilename
            }
        });
    } catch (error) {
        console.error('=== ERROR CREATING MEDIACONVERT JOBS ===');
        console.error('Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get conversion job status
app.get('/api/recordings/convert/status/:jobId', requireAuth, async (req, res) => {
    try {
        const { jobId } = req.params;

        const command = new GetJobCommand({ Id: jobId });
        const response = await mediaConvertClient.send(command);

        res.json({
            success: true,
            status: response.Job.Status,
            progress: response.Job.JobPercentComplete || 0,
            createdAt: response.Job.CreatedAt,
            completedAt: response.Job.Timing?.FinishTime
        });
    } catch (error) {
        console.error('Error getting MediaConvert job status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// HOLDING SLIDE API ENDPOINTS
// ==========================================

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PNG and JPG images are allowed'));
        }
    }
});

// Upload holding slide
app.post('/api/holding-slide/upload', requireAuth, upload.single('holdingSlide'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileExtension = path.extname(req.file.originalname);
        const key = `holding-slides/holding-slide${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'private'
        });

        await s3Client.send(command);

        console.log(`Holding slide uploaded to S3: ${key}`);

        res.json({
            success: true,
            s3Path: `s3://${S3_BUCKET}/${key}`,
            message: 'Holding slide uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading holding slide:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current holding slide
app.get('/api/holding-slide', requireAuth, async (req, res) => {
    try {
        // Check for both .png and .jpg
        const extensions = ['.png', '.jpg', '.jpeg'];
        let foundKey = null;

        for (const ext of extensions) {
            const key = `holding-slides/holding-slide${ext}`;
            try {
                const command = new ListObjectsV2Command({
                    Bucket: S3_BUCKET,
                    Prefix: key,
                    MaxKeys: 1
                });
                const response = await s3Client.send(command);
                if (response.Contents && response.Contents.length > 0) {
                    foundKey = response.Contents[0].Key;
                    break;
                }
            } catch (err) {
                // Continue checking other extensions
            }
        }

        if (!foundKey) {
            return res.json({ success: true, url: null, s3Path: null });
        }

        // Generate presigned URL for viewing
        const getCommand = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: foundKey
        });
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

        res.json({
            success: true,
            url: url,
            s3Path: `${S3_BUCKET}/${foundKey}`
        });
    } catch (error) {
        console.error('Error getting holding slide:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('Red Corner Stream Dashboard - AWS Edition');
    console.log('==========================================');
    console.log(`Server: http://0.0.0.0:${PORT}`);
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log('==========================================');
});

