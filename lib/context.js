const fs = require('fs');
const path = require('path');
const cluster = require('cluster');

// when running from pkg exe, __dirname is inside snapshot
// use exe's folder for external files (.env, proxy.txt, certs/)
const baseDir = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '..');

// load env (quiet = no dotenv logs)
require('dotenv').config({ path: path.join(baseDir, '.env'), quiet: true });

const DEBUG = process.env.DEBUG === 'true';

let proxies = [];
try {
    const proxyPath = path.join(baseDir, 'proxy.txt');
    const proxyFile = fs.readFileSync(proxyPath, 'utf8');
    proxies = proxyFile.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    // only print from non-cluster or master (workers stay quiet)
    if (!cluster.isWorker) console.log(`loaded ${proxies.length} proxies`);
} catch (e) {
    if (DEBUG && !cluster.isWorker) console.log('no proxy.txt found');
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
    baseDir,
    proxies,
    DEBUG,
    debugLog
};
