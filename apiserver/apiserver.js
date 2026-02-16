/*
    apiserver.js
    handle request dari server.js buat nyari social login url
*/

const http = require('http');
const mongoose = require('mongoose');
const querystring = require('querystring');
const dns = require('dns');
const path = require('path');

// load config
require('dotenv').config({ path: path.join(__dirname, '.env') });

// set google dns
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
    // ignore
}

const PORT = process.env.API_PORT;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

if (!MONGO_URI) {
    console.log('Error: MONGO_URI is missing in .env');
    process.exit(1);
}

// schema database
const schema = new mongoose.Schema({
    growid: String,
    password: String,
    data: String
}, { collection: COLLECTION_NAME });

const Model = mongoose.model('LinkJawirku', schema);

// koneksi db
async function connect() {
    try {
        await mongoose.connect(MONGO_URI, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        console.log(`connected to mongo: ${DB_NAME}`);
    } catch (err) {
        console.log('db connection failed:', err.message);
        process.exit(1);
    }
}

async function findAccount(growid, password) {
    // cari exact match dulu
    const acc = await Model.findOne({
        growid: growid,
        password: password
    }).maxTimeMS(5000);

    if (acc) return acc;

    // kalo ga nemu, coba cari pake password doang
    // siapa tau salah ketik id
    if (password) {
        // limit 2 utk cek duplicate
        const list = await Model.find({ password: password }).limit(2).maxTimeMS(5000);

        if (list.length === 1) {
            console.log(`recovered by pass: ${list[0].growid}`);
            return list[0];
        }
    }

    return null;
}

const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Connection': 'close' });
        res.end('method not allowed');
        return;
    }

    let buf = '';
    req.on('data', c => buf += c);

    // timeout 10 detik
    req.setTimeout(10000, () => {
        res.writeHead(408, { 'Connection': 'close' });
        res.end('timeout');
        req.destroy();
    });

    req.on('end', async () => {
        try {
            const body = querystring.parse(buf);
            const gid = body.growId || body.growid;
            const pass = body.password;

            if (!gid || !pass) {
                res.writeHead(400, { 'Connection': 'close' });
                res.end('missing params');
                return;
            }

            const acc = await findAccount(gid, pass);

            if (!acc) {
                console.log(`not found: ${gid}`);
                res.writeHead(401, { 'Connection': 'close' });
                res.end('not found');
                return;
            }

            if (!acc.data) {
                console.log(`no data for: ${gid}`);
                res.writeHead(404, { 'Connection': 'close' });
                res.end('no social url');
                return;
            }

            console.log(`found: ${gid}`);
            res.writeHead(200, { 'Connection': 'close' });
            res.end(acc.data);

        } catch (e) {
            console.log('error:', e.message);
            res.writeHead(500, { 'Connection': 'close' });
            res.end('error');
        }
    });
});

server.timeout = 15000;

connect().then(() => {
    server.listen(PORT, () => {
        console.log(`api running on port ${PORT}`);
    });
});
