const https = require('https');
const { DEBUG } = require('./context');
const { resolveGrowtopiaIP, getProxyAgent, shouldUseSocks5, trackQuota } = require('./network');

function proxyToRealServer(req, res, postData = Buffer.alloc(0), retryCount = 0) {
    const MAX_RETRIES = 1;
    const useSocks5 = shouldUseSocks5(req.url);

    resolveGrowtopiaIP((ip) => {
        if (!ip) {
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/html; charset=UTF-8');
                res.writeHead(502);
                res.end(JSON.stringify({
                    status: "failed",
                    message: "server dns error, try again later.",
                    token: "",
                    url: "",
                    accountType: "growtopia",
                    accountAge: 2
                }));
            }
            return;
        }

        const agent = useSocks5 ? getProxyAgent() : null;
        if (DEBUG) {
            const retryStr = retryCount > 0 ? ` (retry ${retryCount})` : '';
            const socksStr = useSocks5 && agent ? ' [socks5]' : '';
            console.log(`proxy -> ${ip} ${req.method} ${req.url}${retryStr}${socksStr}`);
        }

        let sent = false;

        const options = {
            hostname: ip,
            port: 443,
            path: req.url,
            method: req.method,
            headers: {
                ...req.headers,
                host: 'login.growtopiagame.com'
            },
            rejectUnauthorized: false,
            timeout: 5000
        };

        if (agent) options.agent = agent;

        if (useSocks5 && postData.length > 0) {
            trackQuota(postData.length, 'up');
        }

        const proxyReq = https.request(options, (proxyRes) => {
            if (!sent && !res.headersSent) {
                sent = true;

                let received = 0;
                proxyRes.on('data', (c) => { received += c.length; });
                proxyRes.on('end', () => { if (useSocks5) trackQuota(received, 'down'); });

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            }
        });

        proxyReq.on('error', (err) => {
            console.log(`proxy error: ${err.message}`);
            if (!sent && !res.headersSent) {
                if (retryCount < MAX_RETRIES) {
                    console.log(`retrying... (${retryCount + 1})`);
                    proxyToRealServer(req, res, postData, retryCount + 1);
                } else {
                    sent = true;
                    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
                    res.writeHead(502);
                    res.end(JSON.stringify({
                        status: "failed",
                        message: "server connection failed.",
                        token: "",
                        url: "",
                        accountType: "growtopia",
                        accountAge: 2
                    }));
                }
            }
        });

        proxyReq.on('timeout', () => {
            console.log('proxy timeout');
            proxyReq.destroy();
            if (!sent && !res.headersSent) {
                if (retryCount < MAX_RETRIES) {
                    console.log(`retrying after timeout... (${retryCount + 1})`);
                    proxyToRealServer(req, res, postData, retryCount + 1);
                } else {
                    sent = true;
                    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
                    res.writeHead(504);
                    res.end(JSON.stringify({
                        status: "failed",
                        message: "server timeout.",
                        token: "",
                        url: "",
                        accountType: "growtopia",
                        accountAge: 2
                    }));
                }
            }
        });

        if (postData.length > 0) {
            proxyReq.write(postData);
        }
        proxyReq.end();
    });
}

module.exports = {
    proxyToRealServer
};
