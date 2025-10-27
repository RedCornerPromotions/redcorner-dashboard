const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const StreamManager = require('./stream-manager');
const auth = require('./auth');

const app = express();
const manager = new StreamManager();

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// FIX FOR IFRAMES - Add this to allow iframe embedding
app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    next();
});

// Auth middleware
function requireAuth(req, res, next) {
    const sessionId = req.cookies.session;
    const username = auth.validateSession(sessionId);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });
    req.username = username;
    next();
}

// Public routes - no auth required
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = auth.authenticateUser(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const sessionId = auth.createSession(user);
    res.cookie('session', sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'strict' });
    res.json({ success: true, username: user });
});

app.post('/api/logout', (req, res) => {
    const sessionId = req.cookies.session;
    auth.deleteSession(sessionId);
    res.clearCookie('session');
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    const sessionId = req.cookies.session;
    const username = auth.validateSession(sessionId);
    res.json({ authenticated: !!username, username: username || null });
});

// Public files - allow without auth
app.get('/player.html', (req, res) => {
    res.sendFile(__dirname + '/public/player.html');
});

app.get('/test-embed.html', (req, res) => {
    res.sendFile(__dirname + '/public/test-embed.html');
});

// Root - check auth
app.get('/', (req, res) => {
    const sessionId = req.cookies.session;
    const username = auth.validateSession(sessionId);
    if (username) {
        res.sendFile(__dirname + '/public/dashboard.html');
    } else {
        res.sendFile(__dirname + '/public/login.html');
    }
});

// Protected API routes
app.use('/api/status', requireAuth);
app.use('/api/channels', requireAuth);
app.use('/api/channel', requireAuth);

app.get('/api/status', (req, res) => res.json(manager.getSystemStatus()));
app.get('/api/channels', (req, res) => res.json(manager.getAllChannels()));

app.get('/api/channel/:num', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel.getStatus());
});

// Preview control endpoints
app.post('/api/channel/:num/preview/start', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    // Start preview from RTSP endpoint
    const rtspUrl = `rtsp://localhost:${8553 + parseInt(req.params.num)}/channel${req.params.num}`;
    const result = channel.startPreview(rtspUrl);
    res.json(result);
});

app.post('/api/channel/:num/preview/stop', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const result = channel.stopPreview();
    res.json(result);
});

// Destination control
app.post('/api/channel/:num/destination/:id/start', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel.startDestination(req.params.id));
});

app.post('/api/channel/:num/destination/:id/stop', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel.stopDestination(req.params.id));
});

app.post('/api/channel/:num/destinations/stop-all', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel.stopAllDestinations());
});

// Overlay
app.post('/api/channel/:num/overlay', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel.setOverlay(req.body.url));
});

// Destination management
app.post('/api/channel/:num/destination', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const dest = channel.addDestination(req.body.url, req.body.name, req.body.protocol);
    res.json({ success: true, destination: dest });
});

app.delete('/api/channel/:num/destination/:id', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    channel.removeDestination(req.params.id);
    res.json({ success: true });
});

app.post('/api/channel/:num/destination/:id/toggle', (req, res) => {
    const channel = manager.getChannel(parseInt(req.params.num));
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ success: true, destination: channel.toggleDestination(req.params.id) });
});

// Serve static files for specific allowed files
app.use(express.static('public'));

app.listen(3000, '0.0.0.0', () => {
    console.log('🔐 API running on http://134.199.150.238:3000');
    console.log('🎥 5-Channel Stream Manager');
});
