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
    console.log('==========================================');
    console.log('Red Corner Stream Dashboard - AWS Edition');
    console.log('==========================================');
    console.log(`Server: http://0.0.0.0:${PORT}`);
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log('==========================================');
});
