const https = require('https');
const http = require('http');
const { config, DEBUG } = require('./context');

function fetchSocialLoginUrl(growId, password, callback) {
    if (!config.externalApi.enabled) {
        return callback(null, 'api disabled');
    }

    const postData = `growId=${encodeURIComponent(growId)}&password=${encodeURIComponent(password)}`;
    const url = new URL(config.externalApi.url);

    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Connection': 'close'
        },
        timeout: 5000
    };

    const requestLib = url.protocol === 'https:' ? https : http;

    const req = requestLib.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            if (res.statusCode === 200) {
                callback(data.trim(), null);
            } else {
                callback(null, `error ${res.statusCode}`);
            }
        });
    });

    req.on('error', (e) => {
        callback(null, e.message);
    });

    req.on('timeout', () => {
        req.destroy();
        callback(null, 'timeout');
    });

    if (DEBUG) console.log(`api req: ${growId}`);
    req.write(postData);
    req.end();
}

function fetchMeta(proxyAgent, callback) {
    const postData = 'version=5.42&platform=0&protocol=225';
    const options = {
        hostname: 'www.growtopia2.com',
        port: 443,
        path: '/growtopia/server_data.php',
        method: 'POST',
        headers: {
            'User-Agent': 'UbiServices_SDK_2022.Release.9_PC64_ansi_static',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000,
        rejectUnauthorized: false
    };

    if (proxyAgent) options.agent = proxyAgent;

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            if (res.statusCode === 200) {
                const str = body.toString();
                if (str.includes('meta|')) {
                    // simple parsing
                    const meta = str.split('meta|')[1].split('\n')[0];
                    callback(meta);
                    return;
                }
            }
            callback(null);
        });
    });

    req.on('error', () => callback(null));
    req.on('timeout', () => {
        req.destroy();
        callback(null);
    });

    req.write(postData);
    req.end();
}

module.exports = {
    fetchSocialLoginUrl,
    fetchMeta
};
