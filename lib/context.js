const fs = require('fs');
const path = require('path');

// load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let config = {
    debug: true,
    socks5: { enabled: false, debugQuota: false },
    externalApi: { enabled: true, url: 'http://localhost:5000' }
};

if (process.env.DEBUG !== undefined || process.env.API_URL !== undefined) {
    config = {
        debug: process.env.DEBUG === 'true',
        socks5: {
            enabled: process.env.SOCKS5_ENABLED === 'true',
            debugQuota: process.env.SOCKS5_DEBUG_QUOTA === 'true'
        },
        externalApi: {
            enabled: process.env.API_ENABLED === 'true',
            url: process.env.API_URL || 'http://localhost:5000'
        }
    };
    console.log('loaded config from .env'); // simple log
} else {
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('loaded config.json');
    } catch (e) {
        console.log('using default config');
    }
}

const DEBUG = config.debug;

let proxies = [];
try {
    const proxyPath = path.join(__dirname, '..', 'proxies.txt');
    const proxyFile = fs.readFileSync(proxyPath, 'utf8');
    proxies = proxyFile.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    console.log(`loaded ${proxies.length} proxies`);
} catch (e) {
    if (DEBUG) console.log('no proxies.txt found');
}

function debugLog(label, data) {
    if (!DEBUG) return;
    console.log('---');
    console.log(label);
    if (typeof data === 'object') console.log(JSON.stringify(data, null, 2));
    else console.log(data);
    console.log('---');
}

module.exports = {
    config,
    proxies,
    DEBUG,
    debugLog
};
