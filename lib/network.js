const dns = require('dns');
const https = require('https');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { proxies, DEBUG } = require('./context');
const { getProxyForClient } = require('./socks-matcher');

// --- DNS Cache ---
// resolve once, cache for 30s, refresh in background
let cachedGtIp = null;
let dnsResolvedAt = 0;
const DNS_TTL = 30 * 1000; // 30s
let dnsRefreshing = false;

function resolveGrowtopiaIP(callback, silent) {
    const now = Date.now();

    // serve from cache if fresh
    if (cachedGtIp && (now - dnsResolvedAt) < DNS_TTL) {
        callback(cachedGtIp);

        // refresh in background if older than half TTL
        if (!dnsRefreshing && (now - dnsResolvedAt) > DNS_TTL / 2) {
            dnsRefreshing = true;
            _dnsResolve((ip) => {
                dnsRefreshing = false;
                if (ip) {
                    cachedGtIp = ip;
                    dnsResolvedAt = Date.now();
                }
            }, true);
        }
        return;
    }

    // cache miss or expired, resolve now
    _dnsResolve((ip) => {
        if (ip) {
            cachedGtIp = ip;
            dnsResolvedAt = Date.now();
        }
        callback(ip);
    }, silent);
}

function _dnsResolve(cb, silent) {
    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);
    resolver.resolve4('login.growtopiagame.com', (err, addr) => {
        if (err) {
            if (!silent) console.log('dns error', err.message);
            cb(null);
        } else {
            if (DEBUG) console.log(`dns resolved: ${addr[0]}`);
            cb(addr[0]);
        }
    });
}

// expose cached IP for modules that just need the IP without callback
function getCachedGrowtopiaIP() {
    return cachedGtIp;
}

// --- Upstream HTTPS Agent (Keep-Alive Pool) ---
// reuse TCP+TLS connections to login.growtopiagame.com
const upstreamAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 256,        // max concurrent sockets per host
    maxFreeSockets: 64,     // keep idle sockets around
    timeout: 15000,
    scheduling: 'fifo'
});

function getUpstreamAgent() {
    return upstreamAgent;
}

// --- SOCKS Proxy Agent Pool ---
// reuse SocksProxyAgent per proxy URL string (avoid creating new agent per-request)
const socksPool = new Map(); // key = socksUrl, value = { agent, lastUsed }
const SOCKS_POOL_MAX = 200;
const SOCKS_POOL_TTL = 5 * 60 * 1000; // 5 min idle eviction

function getPooledSocksAgent(socksUrl) {
    const cached = socksPool.get(socksUrl);
    if (cached) {
        cached.lastUsed = Date.now();
        return cached.agent;
    }

    const agent = new SocksProxyAgent(socksUrl);
    socksPool.set(socksUrl, { agent, lastUsed: Date.now() });

    // evict oldest if pool too big
    if (socksPool.size > SOCKS_POOL_MAX) {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, val] of socksPool) {
            if (val.lastUsed < oldestTime) {
                oldestTime = val.lastUsed;
                oldestKey = key;
            }
        }
        if (oldestKey) socksPool.delete(oldestKey);
    }

    return agent;
}

// periodic cleanup of idle socks agents
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of socksPool) {
        if (now - val.lastUsed > SOCKS_POOL_TTL) {
            socksPool.delete(key);
        }
    }
}, 60 * 1000);

function _buildSocksUrl(line) {
    const parts = line.split(':');
    if (parts.length >= 4) {
        return `socks5://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    }
    return `socks5://${parts[0]}:${parts[1]}`;
}

function getProxyAgent() {
    if (process.env.SOCKS5_ENABLED !== 'true' || proxies.length === 0) return null;

    const line = proxies[Math.floor(Math.random() * proxies.length)];
    const url = _buildSocksUrl(line);

    if (DEBUG) {
        const parts = line.split(':');
        console.log(`using proxy: ${parts[0]}:${parts[1]}`);
    }

    return getPooledSocksAgent(url);
}

let totalBytes = 0;
function trackQuota(bytes, dir) {
    if (process.env.SOCKS5_DEBUG_QUOTA !== 'true') return;
    totalBytes += bytes;
    console.log(`quota ${dir}: ${(bytes / 1024).toFixed(2)} kb`);
}

function shouldUseSocks5(url) {
    const perClient = process.env.USE_SOCKS_STATIC === 'true' || process.env.USE_BYPASS_SOCKS === 'true';
    if (process.env.SOCKS5_ENABLED !== 'true' && !perClient) return false;

    const routes = [
        '/player/growid/checktoken',
        '/player/growid/validate/checktoken',
        '/player/growid/logon-name/',
        '/player/social/login'
    ];

    return routes.some(r => url.includes(r));
}

// check if per-client socks matching is active
function isPerClientSocks() {
    return process.env.USE_SOCKS_STATIC === 'true' || process.env.USE_BYPASS_SOCKS === 'true';
}

module.exports = {
    getProxyAgent,
    getProxyForClient,
    getPooledSocksAgent,
    isPerClientSocks,
    trackQuota,
    shouldUseSocks5,
    resolveGrowtopiaIP,
    getCachedGrowtopiaIP,
    getUpstreamAgent
};
