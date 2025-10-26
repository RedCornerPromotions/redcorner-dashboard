const crypto = require('crypto');

// Simple in-memory session store
const sessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Hash password (in production, use bcrypt)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Default credentials (change these!)
const USERS = {
    'admin': hashPassword('RedCorner321') // Username: admin, Password: RedCorner321
};

// Cleanup expired sessions every hour
function cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.createdAt > SESSION_DURATION) {
            sessions.delete(sessionId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired session(s). Active sessions: ${sessions.size}`);
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

function createSession(username) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, {
        username: username,
        createdAt: Date.now()
    });
    console.log(`✅ Session created for ${username}. Active sessions: ${sessions.size}`);
    return sessionId;
}

function validateSession(sessionId) {
    if (!sessionId) {
        console.log('❌ No session ID provided');
        return null;
    }

    const session = sessions.get(sessionId);
    if (!session) {
        console.log('❌ Session not found (may have expired or server restarted)');
        return null;
    }

    // Check if session expired
    if (Date.now() - session.createdAt > SESSION_DURATION) {
        sessions.delete(sessionId);
        console.log(`❌ Session expired for ${session.username}`);
        return null;
    }

    return session.username;
}

function deleteSession(sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
        console.log(`🔓 Logout: ${session.username}`);
    }
    sessions.delete(sessionId);
}

function authenticateUser(username, password) {
    const hashedPassword = hashPassword(password);
    return USERS[username] === hashedPassword ? username : null;
}

module.exports = {
    authenticateUser,
    createSession,
    validateSession,
    deleteSession
};
