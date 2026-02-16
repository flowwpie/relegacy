const dns = require('dns');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { config, proxies, DEBUG } = require('./context');

function getProxyAgent() {
    if (!config.socks5.enabled || proxies.length === 0) return null;

    const line = proxies[Math.floor(Math.random() * proxies.length)];
    const parts = line.split(':');

    let url;
    if (parts.length >= 4) {
        url = `socks5://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    } else {
        url = `socks5://${parts[0]}:${parts[1]}`;
    }

    if (DEBUG) console.log(`using proxy: ${parts[0]}:${parts[1]}`);
    return new SocksProxyAgent(url);
}

let totalBytes = 0;
function trackQuota(bytes, dir) {
    if (!config.socks5.debugQuota) return;
    totalBytes += bytes;
    console.log(`quota ${dir}: ${(bytes / 1024).toFixed(2)} kb`);
}

function shouldUseSocks5(url) {
    if (!config.socks5.enabled) return false;

    const routes = [
        '/player/growid/checktoken',
        '/player/growid/validate/checktoken',
        '/player/growid/logon-name/',
        '/player/social/login'
    ];

    return routes.some(r => url.includes(r));
}

function resolveGrowtopiaIP(callback) {
    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);

    resolver.resolve4('login.growtopiagame.com', (err, addr) => {
        if (err) {
            console.log('dns error', err.message);
            callback(null);
        } else {
            if (DEBUG) console.log(`dns resolved: ${addr[0]}`);
            callback(addr[0]);
        }
    });
}

module.exports = {
    getProxyAgent,
    trackQuota,
    shouldUseSocks5,
    resolveGrowtopiaIP
};
