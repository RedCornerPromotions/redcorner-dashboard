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

function createSession(username) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, {
        username: username,
        createdAt: Date.now()
    });
    return sessionId;
}

function validateSession(sessionId) {
    if (!sessionId) return null;
    
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    // Check if session expired
    if (Date.now() - session.createdAt > SESSION_DURATION) {
        sessions.delete(sessionId);
        return null;
    }
    
    return session.username;
}

function deleteSession(sessionId) {
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
