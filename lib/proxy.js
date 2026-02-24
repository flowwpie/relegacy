const https = require('https');
const { DEBUG } = require('./context');
const { MESSAGES, err502, err504 } = require('./errors');
const { resolveGrowtopiaIP, getProxyAgent, getProxyForClient, isPerClientSocks, shouldUseSocks5, trackQuota, getUpstreamAgent } = require('./network');

function proxyToRealServer(req, res, postData = Buffer.alloc(0), retryCount = 0) {
    const MAX_RETRIES = 1;
    const useSocks5 = shouldUseSocks5(req.url);

    // pick agent based on mode
    function doProxy(socksAgent, targetIp = 'login.growtopiagame.com') {
        if (DEBUG) {
            const retryStr = retryCount > 0 ? ` (retry ${retryCount})` : '';
            const socksStr = socksAgent ? ' [socks5]' : '';
            console.log(`proxy -> ${targetIp} ${req.method} ${req.url}${retryStr}${socksStr}`);
        }

        let sent = false;

        const options = {
            hostname: targetIp,
            port: 443,
            path: req.url,
            method: req.method,
            headers: {
                ...req.headers,
                host: 'login.growtopiagame.com'
            },
            rejectUnauthorized: false,
            timeout: 5000,
            // use keep-alive upstream agent when no socks, otherwise use socks agent
            agent: socksAgent || getUpstreamAgent()
        };

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
                    err502(res, MESSAGES.connectionFailed);
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
                    err504(res, MESSAGES.timeout);
                }
            }
        });

        if (postData.length > 0) {
            proxyReq.write(postData);
        }
        proxyReq.end();
    }

    // resolve which agent to use
    const clientIp = req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';

    function finalizeProxy(matchedAgent) {
        if (matchedAgent) {
            doProxy(matchedAgent, 'login.growtopiagame.com');
        } else {
            resolveGrowtopiaIP((ip) => {
                if (!ip) {
                    if (!res.headersSent) err502(res, MESSAGES.serverDnsError);
                    return;
                }
                doProxy(null, ip);
            });
        }
    }

    if (useSocks5 && isPerClientSocks()) {
        getProxyForClient(clientIp, finalizeProxy);
    } else {
        finalizeProxy(useSocks5 ? getProxyAgent() : null);
    }
}

module.exports = {
    proxyToRealServer
};
