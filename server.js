/*
    growtopia-https-server
    intercept login request & checktoken
*/

const https = require('https');
const fs = require('fs');
const path = require('path');

// load libs
const { config, DEBUG, debugLog } = require('./lib/context');
const { getProxyAgent, resolveGrowtopiaIP } = require('./lib/network');
const { fetchSocialLoginUrl } = require('./lib/api');
const { sessionCache, generateSlug } = require('./lib/session');
const { mainHtml, growIdHtml } = require('./lib/views');
const { proxyToRealServer } = require('./lib/proxy');

// certs
const certsDir = path.join(__dirname, 'certs');
let options = {};
try {
    options = {
        key: fs.readFileSync(path.join(certsDir, 'key.pem')),
        cert: fs.readFileSync(path.join(certsDir, 'cert.pem'))
    };
} catch (e) {
    console.log('error: ssl certs missing in certs/');
    process.exit(1);
}

const server = https.createServer(options, (req, res) => {
    const url = req.url.split('?')[0];
    const ip = req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';

    if (DEBUG) {
        console.log('---');
        console.log(`${req.method} ${req.url}`);
        console.log(`client: ${ip}`);
    }

    let chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
        const buf = Buffer.concat(chunks);
        const body = buf.toString();

        if (DEBUG && body) {
            try {
                // simple log for body
                const str = decodeURIComponent(body).replace(/&/g, '\n');
                console.log('body:', str);
            } catch (e) {
                // ignore
            }
        }

        // handle validate
        if (req.method === 'POST' && url === '/player/growid/login/validate') {
            let growId = '';
            let token = '';
            let pass = '';

            try {
                const params = new URLSearchParams(body);
                growId = params.get('_growid') || params.get('growId') || '';
                token = params.get('_token') || '';
                pass = params.get('_password') || params.get('password') || '';
            } catch (e) { }

            if (DEBUG) console.log(`validate: ${growId} (token: ${token})`);

            if (!growId) {
                res.writeHead(400);
                res.end(JSON.stringify({ status: "failed", message: "growid required" }));
                return;
            }

            // get cached client data
            const session = sessionCache.get(token);
            const clientData = session ? session.body : '';

            // 1. get social url from api
            if (DEBUG) console.log('step 1: fetching social url...');
            fetchSocialLoginUrl(growId, pass, (socialUrl, err) => {
                if (err || !socialUrl) {
                    if (DEBUG) console.log(`api error: ${err}`);
                    res.writeHead(502);
                    res.end(JSON.stringify({ status: "failed", message: "api error or suspended" }));
                    return;
                }

                if (socialUrl.includes('"error"') || !socialUrl.startsWith('http')) {
                    if (DEBUG) console.log('account not found in db');
                    res.writeHead(200);
                    res.end(JSON.stringify({ status: "failed", message: "account not found in database." }));
                    return;
                }

                let socialPath;
                try {
                    const u = new URL(socialUrl);
                    socialPath = u.pathname + u.search;
                } catch (e) {
                    socialPath = socialUrl;
                }

                const proxy = getProxyAgent();

                // 2. fetch token from gt
                if (DEBUG) console.log('step 2: fetching token from gt...');
                resolveGrowtopiaIP((gtIp) => {
                    if (!gtIp) {
                        res.writeHead(502);
                        res.end(JSON.stringify({ status: "failed", message: "dns error" }));
                        return;
                    }

                    const opts = {
                        hostname: gtIp,
                        port: 443,
                        path: socialPath,
                        method: 'GET',
                        headers: {
                            'Host': 'login.growtopiagame.com',
                            'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
                        },
                        rejectUnauthorized: false,
                        timeout: 10000
                    };

                    if (proxy) opts.agent = proxy;

                    const r = https.request(opts, (resp) => {
                        let d = '';
                        resp.on('data', c => d += c);
                        resp.on('end', () => {
                            // handle meta refresh
                            if (d.includes('http-equiv="refresh"')) {
                                const m = d.match(/url=['"](https?:\/\/[^'"]+)['"]/i);
                                if (m) {
                                    const redirUrl = m[1];
                                    if (DEBUG) console.log(`following redirect: ${redirUrl}`);

                                    let redirPath = redirUrl;
                                    try {
                                        const u = new URL(redirUrl);
                                        redirPath = u.pathname + u.search;
                                    } catch (e) { }

                                    const redirOpts = {
                                        hostname: gtIp,
                                        port: 443,
                                        path: redirPath,
                                        method: 'GET',
                                        headers: {
                                            'Host': 'login.growtopiagame.com',
                                            'User-Agent': req.headers['user-agent'],
                                            'Cookie': resp.headers['set-cookie'] ? resp.headers['set-cookie'].join('; ') : ''
                                        },
                                        rejectUnauthorized: false
                                    };
                                    if (proxy) redirOpts.agent = proxy;

                                    const r2 = https.request(redirOpts, (resp2) => {
                                        let d2 = '';
                                        resp2.on('data', c => d2 += c);
                                        resp2.on('end', () => processToken(d2, resp2.statusCode, resp2.headers));
                                    });
                                    r2.on('error', () => { res.writeHead(502); res.end('{"status":"failed"}'); });
                                    r2.end();
                                    return;
                                }
                            }

                            processToken(d, resp.statusCode, resp.headers);

                            function processToken(bodyStr, code, hdrs) {
                                let refreshToken = '';
                                try {
                                    const j = JSON.parse(bodyStr);
                                    if (j.status === 'success' && j.token) {
                                        refreshToken = j.token;
                                    } else {
                                        res.writeHead(code);
                                        res.end(bodyStr);
                                        return;
                                    }
                                } catch (e) {
                                    // not json
                                    const h = { ...hdrs };
                                    delete h['transfer-encoding'];
                                    res.writeHead(code, h);
                                    res.end(bodyStr);
                                    return;
                                }

                                if (!clientData) {
                                    res.writeHead(200);
                                    res.end(bodyStr);
                                    return;
                                }

                                // 3. checktoken
                                if (DEBUG) console.log('step 3: checktoken...');

                                const checkBody = `refreshToken=${encodeURIComponent(refreshToken)}&clientData=${encodeURIComponent(clientData)}`;

                                const checkOpts = {
                                    hostname: gtIp,
                                    port: 443,
                                    path: '/player/growid/checktoken?valKey=40db4045f2d8c572efe8c4a060605726',
                                    method: 'POST',
                                    headers: {
                                        'Host': 'login.growtopiagame.com',
                                        'User-Agent': req.headers['user-agent'],
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        'Content-Length': Buffer.byteLength(checkBody)
                                    },
                                    rejectUnauthorized: false
                                };
                                if (proxy) checkOpts.agent = proxy;

                                const rCheck = https.request(checkOpts, (respCheck) => {
                                    let dCheck = [];
                                    respCheck.on('data', c => dCheck.push(c));
                                    respCheck.on('end', () => {
                                        let finalBody = Buffer.concat(dCheck).toString();

                                        // clean metadata
                                        if (finalBody) {
                                            finalBody = finalBody.replace(/"accountType"\s*:\s*"[^"]*"/, '"accountType":"growtopia"');
                                        }

                                        const hFinal = { ...respCheck.headers };
                                        delete hFinal['transfer-encoding'];
                                        delete hFinal['content-length'];

                                        res.writeHead(respCheck.statusCode, hFinal);
                                        res.end(finalBody);
                                    });
                                });
                                rCheck.on('error', () => { res.writeHead(502); res.end('{"status":"failed"}'); });
                                rCheck.write(checkBody);
                                rCheck.end();
                            }
                        });
                    });
                    r.on('error', () => { res.writeHead(502); res.end('{"status":"failed"}'); });
                    r.end();
                });
            });
            return;
        }

        // login page
        if (url.startsWith('/player/growid/login')) {
            const m = req.url.match(/token=([a-f0-9]+)/);
            const t = m ? m[1] : null;

            if (t) {
                const s = sessionCache.get(t);
                if (DEBUG && s) console.log(`session found: ${t}`);
            }

            let html = growIdHtml;
            if (t) {
                html = html.replace(/name="_token" type="hidden" value="[^"]*"/, `name="_token" type="hidden" value="${t}"`);
            }

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }

        // dashboard maybe
        if (url.startsWith('/player/login/dashboard')) {
            const slug = generateSlug();
            sessionCache.set(slug, {
                body: body,
                timestamp: Date.now()
            });

            if (DEBUG) console.log(`new session: ${slug}`);

            const html = mainHtml.replace(/token=apaanjay/g, `token=${slug}`);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }

        // proxy others
        proxyToRealServer(req, res, buf);
    });
});

server.listen(443, '127.0.0.1', () => {
    console.log('');
    console.log('  Relegacy Http Serper');
    console.log('  ----------------------');
    console.log('  running on port 443');
    console.log(`  debug: ${DEBUG}`);
    console.log('');
});

server.on('error', (e) => {
    console.log(`server error: ${e.message}`);
    process.exit(1);
});
