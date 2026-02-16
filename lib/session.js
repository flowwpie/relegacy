const crypto = require('crypto');
const { DEBUG } = require('./context');

const cache = new Map();
const TTL = 10 * 60 * 1000; // 10 mins

function generateSlug() {
    return crypto.randomBytes(16).toString('hex');
}

function cleanExpired() {
    const now = Date.now();
    for (const [slug, data] of cache) {
        if (now - data.timestamp > TTL) {
            cache.delete(slug);
            if (DEBUG) console.log(`session expired: ${slug}`);
        }
    }
}

setInterval(cleanExpired, 60 * 1000);

module.exports = {
    sessionCache: cache,
    generateSlug,
    cleanExpiredSessions: cleanExpired
};
