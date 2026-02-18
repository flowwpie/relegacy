// socks-matcher.js
// match client IP to a specific proxy from proxy.txt
// two modes: static (ip match) and bypass (domain -> resolve ip via ipinfo.io)

const http = require('http');
const { proxies, DEBUG } = require('./context');

// lazy import to avoid circular dep - getPooledSocksAgent is loaded at call time
let _getPooledSocksAgent = null;
function getPooled(socksUrl) {
    if (!_getPooledSocksAgent) {
        _getPooledSocksAgent = require('./network').getPooledSocksAgent;
    }
    return _getPooledSocksAgent(socksUrl);
}

// cache for resolved domain IPs
// key = proxy line string, value = { ip: '1.2.3.4', resolvedAt: timestamp }
const resolvedIpCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// build socks url from parts
function buildSocksUrl(parts) {
    if (parts.length >= 4) {
        return `socks5://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    }
    return `socks5://${parts[0]}:${parts[1]}`;
}

// resolve domain's public IP by doing http get to http://ipinfo.io/ip through the proxy itself
function resolveProxyIp(proxyLine, callback) {
    const parts = proxyLine.split(':');
    const socksUrl = buildSocksUrl(parts);
    const agent = getPooled(socksUrl);

    const req = http.get('http://ipinfo.io/ip', { agent, timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const ip = data.trim();
            if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
                // cache it
                resolvedIpCache.set(proxyLine, { ip, resolvedAt: Date.now() });
                if (DEBUG) console.log(`resolved proxy ${parts[0]} -> ${ip}`);
                callback(ip);
            } else {
                if (DEBUG) console.log(`resolve failed for ${parts[0]}: got "${data.trim()}"`);
                callback(null);
            }
        });
    });

    req.on('error', (err) => {
        if (DEBUG) console.log(`resolve error for ${parts[0]}: ${err.message}`);
        callback(null);
    });

    req.on('timeout', () => {
        req.destroy();
        if (DEBUG) console.log(`resolve timeout for ${parts[0]}`);
        callback(null);
    });
}

// get cached IP for a proxy line, or null if expired/not cached
function getCachedIp(proxyLine) {
    const cached = resolvedIpCache.get(proxyLine);
    if (!cached) return null;
    if (Date.now() - cached.resolvedAt > CACHE_TTL) return null; // expired
    return cached.ip;
}

// find matching proxy for client IP
// callback(agent) - agent is SocksProxyAgent or null
function getProxyForClient(clientIp, callback) {
    const useStatic = process.env.USE_SOCKS_STATIC === 'true';
    const useBypass = process.env.USE_BYPASS_SOCKS === 'true';

    // neither mode active
    if (!useStatic && !useBypass) {
        callback(null);
        return;
    }

    if (proxies.length === 0) {
        callback(null);
        return;
    }

    // static mode - simple IP compare, no async needed
    if (useStatic) {
        for (const line of proxies) {
            const parts = line.split(':');
            if (parts[0] === clientIp) {
                const url = buildSocksUrl(parts);
                if (DEBUG) console.log(`static match: ${clientIp} -> ${parts[0]}:${parts[1]}`);
                callback(getPooled(url));
                return;
            }
        }
        if (DEBUG) console.log(`static: no proxy found for ${clientIp}`);
        callback(null);
        return;
    }

    // bypass mode - need to resolve domains, check cache first
    if (useBypass) {
        // first pass: check all cached entries
        for (const line of proxies) {
            const cachedIp = getCachedIp(line);
            if (cachedIp && cachedIp === clientIp) {
                const parts = line.split(':');
                const url = buildSocksUrl(parts);
                if (DEBUG) console.log(`bypass cache hit: ${clientIp} -> ${parts[0]}:${parts[1]}`);
                callback(getPooled(url));
                return;
            }
        }

        // second pass: resolve uncached/expired ones, then check
        // we resolve them one by one to avoid flooding
        let idx = 0;
        function resolveNext() {
            if (idx >= proxies.length) {
                // checked all, none matched
                if (DEBUG) console.log(`bypass: no proxy found for ${clientIp}`);
                callback(null);
                return;
            }

            const line = proxies[idx];
            idx++;

            const cachedIp = getCachedIp(line);
            if (cachedIp !== null) {
                // already checked in first pass, skip
                resolveNext();
                return;
            }

            // need to resolve this one
            resolveProxyIp(line, (resolvedIp) => {
                if (resolvedIp && resolvedIp === clientIp) {
                    const parts = line.split(':');
                    const url = buildSocksUrl(parts);
                    if (DEBUG) console.log(`bypass resolved: ${clientIp} -> ${parts[0]}:${parts[1]}`);
                    callback(getPooled(url));
                    return;
                }
                // keep looking
                resolveNext();
            });
        }

        resolveNext();
        return;
    }
}

module.exports = {
    getProxyForClient
};
