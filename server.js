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

app.get('/api/channels/status', requireAuth, async (req, res) => {
    const statuses = [];
    for (let i = 1; i <= 5; i++) {
        statuses.push(await awsManager.getChannelStatus(i));
    }
    res.json({ channels: statuses });
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

app.listen(PORT, '0.0.0.0', () => {

// ==========================================
// RECORDINGS API ENDPOINTS
// ==========================================

const { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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
function generateDownloadFilename(channel, originalKey, settings) {
    const prefix = settings[`channel${channel}`] || `Channel_${channel}_PGM`;
    const date = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
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
            
            const command = new ListObjectsV2Command({
                Bucket: S3_BUCKET,
                Prefix: prefix
            });
            
            try {
                const response = await s3Client.send(command);
                
                if (response.Contents && response.Contents.length > 0) {
                    const settings = loadRecordingSettings();
                    
                    const files = response.Contents
                        .filter(item => item.Size > 1000) // Filter out tiny files
                        .map(item => ({
                            key: item.Key,
                            size: item.Size,
                            sizeFormatted: formatFileSize(item.Size),
                            date: item.LastModified,
                            dateFormatted: formatDate(new Date(item.LastModified)),
                            displayName: generateDownloadFilename(channel, item.Key, settings)
                        }))
                        .sort((a, b) => b.date - a.date); // Newest first
                    
                    recordings.push({
                        channel,
                        files
                    });
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

// Convert recording to MP4 HEVC
app.post('/api/recordings/convert/:channel/:fileKey(*)', requireAuth, async (req, res) => {
    try {
        const { channel, fileKey } = req.params;
        const decodedKey = decodeURIComponent(fileKey);

        // Get the settings for custom filename
        const settings = loadRecordingSettings();
        const outputFilename = generateDownloadFilename(channel, decodedKey, settings).replace('.ts', '.mp4');

        // Extract just the filename without path
        const inputFilename = decodedKey.split('/').pop();
        const outputKey = decodedKey.replace(inputFilename, outputFilename);

        const jobParams = {
            Role: MEDIACONVERT_ROLE,
            Settings: {
                Inputs: [{
                    FileInput: `s3://${S3_BUCKET}/${decodedKey}`,
                    TimecodeSource: 'ZEROBASED'
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
                            CodecSettings: {
                                Codec: 'H_265',
                                H265Settings: {
                                    RateControlMode: 'QVBR',
                                    QualityTuningLevel: 'SINGLE_PASS_HQ',
                                    Bitrate: 5000000,
                                    MaxBitrate: 8000000
                                }
                            }
                        },
                        AudioDescriptions: [{
                            CodecSettings: {
                                Codec: 'AAC',
                                AacSettings: {
                                    Bitrate: 128000,
                                    CodecProfile: 'LC',
                                    SampleRate: 48000
                                }
                            }
                        }],
                        NameModifier: `_${outputFilename.replace('.mp4', '')}`
                    }]
                }]
            }
        };

        const command = new CreateJobCommand(jobParams);
        const response = await mediaConvertClient.send(command);

        res.json({
            success: true,
            jobId: response.Job.Id,
            status: response.Job.Status,
            outputFilename
        });
    } catch (error) {
        console.error('Error creating MediaConvert job:', error);
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

    console.log('==========================================');
    console.log('Red Corner Stream Dashboard - AWS Edition');
    console.log('==========================================');
    console.log(`Server: http://0.0.0.0:${PORT}`);
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log('==========================================');
});
