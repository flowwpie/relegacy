const cluster = require('cluster');
const os = require('os');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// load env early so master can read config
const _baseDir = process.pkg ? path.dirname(process.execPath) : __dirname;
require('dotenv').config({ path: path.join(_baseDir, '.env'), quiet: true });

// ============================================================
// CLUSTER MASTER - fork workers, handle crashes
// ============================================================
if (cluster.isMaster || cluster.isPrimary) {
    const numCPUs = Math.max(os.cpus().length, 2); // at least 2 workers

    // load proxy count once here
    let proxyCount = 0;
    try {
        const proxyFile = fs.readFileSync(path.join(_baseDir, 'proxy.txt'), 'utf8');
        proxyCount = proxyFile.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).length;
    } catch (e) { }

    console.log('');
    console.log('  Relegacy Http Serper v1.4');
    console.log('  ----------------------');
    console.log(`  workers: ${numCPUs}`);
    console.log(`  pid: ${process.pid}`);
    console.log(`  debug: ${process.env.DEBUG === 'true'}`);
    console.log(`  proxies: ${proxyCount}`);
    if (process.env.USE_SOCKS_STATIC === 'true') console.log('  socks: per-client (static)');
    else if (process.env.USE_BYPASS_SOCKS === 'true') console.log('  socks: per-client (bypass)');
    if (process.env.DISABLE_GET_META === 'true') console.log('  disable_get_meta: ON');
    if (process.env.DISABLE_CHECKTOKEN === 'true') console.log('  disable_checktoken: ON');

    for (let i = 0; i < numCPUs; i++) {
        const w = cluster.fork();
    }

    // track how many workers are ready
    let readyCount = 0;
    cluster.on('listening', () => {
        readyCount++;
        if (readyCount === numCPUs) {
            console.log(`  all ${numCPUs} workers ready`);

            // fetch public ip once from master only
            if (process.env.USE_PUBLIC === 'true') {
                http.get('http://ipinfo.io/ip', (r) => {
                    let d = '';
                    r.on('data', c => d += c);
                    r.on('end', () => {
                        console.log(`  public ip: ${d.trim()}`);
                        console.log('');
                    });
                }).on('error', () => {
                    console.log('  could not fetch public ip');
                    console.log('');
                });
            } else {
                console.log('');
            }
        }
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`  [master] worker ${worker.process.pid} died (${signal || code}), restarting...`);
        cluster.fork();
    });

    return;
}

// ============================================================
// WORKER - actual server logic
// ============================================================

// load libs
const { baseDir, DEBUG, debugLog } = require('./lib/context');
const { getProxyAgent, getProxyForClient, isPerClientSocks, resolveGrowtopiaIP, getUpstreamAgent } = require('./lib/network');
const { fetchSocialLoginUrl } = require('./lib/api');
const { sessionCache, generateSlug } = require('./lib/session');
const { mainHtml, growIdHtml } = require('./lib/views');
const { proxyToRealServer } = require('./lib/proxy');
const { MESSAGES, sendError, err400, err502 } = require('./lib/errors');

// pre-buffer HTML responses as Buffers (avoid re-encoding per request)
const mainHtmlBuf = Buffer.from(mainHtml, 'utf8');
const growIdHtmlBuf = Buffer.from(growIdHtml, 'utf8');

// ============================================================
// CONCURRENCY LIMITER (semaphore for validate endpoint)
// ============================================================
const MAX_CONCURRENT_VALIDATE = 50000; // per worker
let activeValidate = 0;

function acquireValidate() {
    if (activeValidate >= MAX_CONCURRENT_VALIDATE) return false;
    activeValidate++;
    return true;
}

function releaseValidate() {
    activeValidate = Math.max(0, activeValidate - 1);
}

// ============================================================
// CERTS
// ============================================================
const certsDir = path.join(baseDir, 'certs');
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

// ============================================================
// SERVER
// ============================================================
const server = https.createServer(options, (req, res) => {
    const url = req.url.split('?')[0];
    const ip = req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';

    // block direct IP access - only allow requests via login.growtopiagame.com
    const host = (req.headers.host || '').split(':')[0].toLowerCase();
    if (host !== 'login.growtopiagame.com') {
        if (DEBUG) console.log(`blocked: direct IP access from ${ip} (host: ${host})`);
        res.writeHead(403);
        res.end();
        return;
    }

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
            // concurrency limiter - reject if too many concurrent validates
            if (!acquireValidate()) {
                res.writeHead(503, { 'Content-Type': 'text/html; charset=UTF-8', 'Retry-After': '2' });
                res.end(JSON.stringify({
                    status: 'failed',
                    message: 'server busy, try again',
                    token: '',
                    url: '',
                    accountType: 'growtopia'
                }));
                return;
            }

            // ensure we release semaphore when response finishes
            res.on('close', releaseValidate);

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
                err400(res, MESSAGES.growIdRequired);
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
                    err502(res, MESSAGES.apiError);
                    return;
                }

                if (socialUrl.includes('"error"') || !socialUrl.startsWith('http')) {
                    if (DEBUG) console.log('account not found in db');
                    sendError(res, 200, MESSAGES.accountNotFound);
                    return;
                }

                let socialPath;
                try {
                    const u = new URL(socialUrl);
                    socialPath = u.pathname + u.search;
                } catch (e) {
                    socialPath = socialUrl;
                }

                // decide proxy: per-client match or random
                function proceedWithProxy(proxy, gtIp = 'login.growtopiagame.com') {
                    // 2. fetch token from gt
                    if (DEBUG) console.log('step 2: fetching token from gt...');

                    const agent = proxy || getUpstreamAgent();

                    const opts = {
                        hostname: gtIp,
                        servername: 'login.growtopiagame.com',
                        port: 443,
                        path: socialPath,
                        method: 'GET',
                        headers: {
                            'Host': 'login.growtopiagame.com',
                            'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
                        },
                        rejectUnauthorized: false,
                        timeout: 10000,
                        agent: agent
                    };

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
                                        servername: 'login.growtopiagame.com',
                                        port: 443,
                                        path: redirPath,
                                        method: 'GET',
                                        headers: {
                                            'Host': 'login.growtopiagame.com',
                                            'User-Agent': req.headers['user-agent'],
                                            'Cookie': resp.headers['set-cookie'] ? resp.headers['set-cookie'].join('; ') : ''
                                        },
                                        rejectUnauthorized: false,
                                        agent: agent
                                    };

                                    const r2 = https.request(redirOpts, (resp2) => {
                                        let d2 = '';
                                        resp2.on('data', c => d2 += c);
                                        resp2.on('end', () => processToken(d2, resp2.statusCode, resp2.headers));
                                    });
                                    r2.on('error', () => { err502(res); });
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
                                if (process.env.DISABLE_CHECKTOKEN === 'true') {
                                    // skip checktoken, return token directly
                                    if (DEBUG) console.log('step 3: checktoken SKIPPED (disabled)');
                                    const fakeResp = JSON.stringify({
                                        status: 'success',
                                        message: '',
                                        token: refreshToken,
                                        url: '',
                                        accountType: 'growtopia'
                                    });
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(fakeResp);
                                    return;
                                }

                                if (DEBUG) console.log('step 3: checktoken...');

                                const checkBody = `refreshToken=${encodeURIComponent(refreshToken)}&clientData=${encodeURIComponent(clientData)}`;

                                const checkOpts = {
                                    hostname: gtIp,
                                    servername: 'login.growtopiagame.com',
                                    port: 443,
                                    path: '/player/growid/checktoken?valKey=40db4045f2d8c572efe8c4a060605726',
                                    method: 'POST',
                                    headers: {
                                        'Host': 'login.growtopiagame.com',
                                        'User-Agent': req.headers['user-agent'],
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                        'Content-Length': Buffer.byteLength(checkBody)
                                    },
                                    rejectUnauthorized: false,
                                    agent: agent
                                };

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
                                rCheck.on('error', () => { err502(res); });
                                rCheck.write(checkBody);
                                rCheck.end();
                            }
                        });
                    });
                    r.on('error', () => { err502(res); });
                    r.end();
                }

                // pick proxy based on mode
                if (isPerClientSocks()) {
                    getProxyForClient(ip, (matched) => {
                        if (!matched) {
                            if (DEBUG) console.log(`no socks match for ${ip}, using direct`);
                        }
                        if (matched) {
                            proceedWithProxy(matched);
                        } else {
                            resolveGrowtopiaIP((resolvedIp) => {
                                if (!resolvedIp) { err502(res, MESSAGES.dnsError); return; }
                                proceedWithProxy(null, resolvedIp);
                            });
                        }
                    });
                } else {
                    const proxyAgent = getProxyAgent();
                    if (proxyAgent) {
                        proceedWithProxy(proxyAgent);
                    } else {
                        resolveGrowtopiaIP((resolvedIp) => {
                            if (!resolvedIp) { err502(res, MESSAGES.dnsError); return; }
                            proceedWithProxy(null, resolvedIp);
                        });
                    }
                }
            });
            return;
        }

        // login page - serve pre-buffered HTML
        if (url.startsWith('/player/growid/login')) {
            const m = req.url.match(/token=([a-f0-9]+)/);
            const t = m ? m[1] : null;

            if (t) {
                const s = sessionCache.get(t);
                if (DEBUG && s) console.log(`session found: ${t}`);
            }

            if (t) {
                // token replacement needed, can't use pre-buffered
                let html = growIdHtml;
                html = html.replace(/name="_token" type="hidden" value="[^"]*"/, `name="_token" type="hidden" value="${t}"`);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
                res.end(html);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': growIdHtmlBuf.length });
                res.end(growIdHtmlBuf);
            }
            return;
        }

        // dashboard maybe - serve pre-buffered HTML
        if (url.startsWith('/player/login/dashboard')) {
            const slug = generateSlug();
            sessionCache.set(slug, {
                body: body,
                timestamp: Date.now()
            });

            if (DEBUG) console.log(`new session: ${slug}`);

            const html = mainHtml.replace(/token=apaanjay/g, `token=${slug}`);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
            res.end(html);
            return;
        }

        // intercept server_data.php when disable_get_meta is on
        if (process.env.DISABLE_GET_META === 'true' && url === '/growtopia/server_data.php') {
            if (DEBUG) console.log('meta fetch SKIPPED (disabled), using client meta');
            // parse meta from client's POST body
            let clientMeta = '';
            try {
                const params = new URLSearchParams(body);
                clientMeta = params.get('meta') || '';
            } catch (e) { }

            // build a minimal server_data response with the client's meta
            const serverData = `server|0.0.0.0\nport|17091\ntype|1\n#maint|server is under maintenance\nmeta|${clientMeta}\nRTENDMARKERBS1001`;
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(serverData);
            return;
        }

        // proxy others
        proxyToRealServer(req, res, buf);
    });
});

// ============================================================
// SERVER TUNING
// ============================================================
server.maxConnections = 50000;          // allow 50k simultaneous TCP connections per worker
server.headersTimeout = 10000;          // 10s to receive headers (prevent slowloris)
server.requestTimeout = 30000;          // 30s total request timeout
server.keepAliveTimeout = 5000;         // 5s keep-alive idle before close
server.timeout = 60000;                 // 60s socket timeout

// tune global agents
https.globalAgent.maxSockets = 50000;
http.globalAgent.maxSockets = 50000;

// ============================================================
// LISTEN
// ============================================================
const bindHost = process.env.USE_PUBLIC === 'true' ? '0.0.0.0' : '127.0.0.1';

server.listen(443, bindHost, () => {
    console.log(`  [worker ${process.pid}] ready`);
});

server.on('error', (e) => {
    console.log(`server error: ${e.message}`);
    process.exit(1);
});
