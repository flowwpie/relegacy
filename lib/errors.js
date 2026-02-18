// centralized error responses
// all errors use text/html; charset=UTF-8 content-type
// edit messages di bawah ini buat ganti tulisan errornya

const MESSAGES = {
    growIdRequired: "growid required",
    apiError: "api error or suspended",
    accountNotFound: "account not found in database.",
    dnsError: "dns error",
    serverError: "server error",
    serverDnsError: "server dns error, try again later.",
    connectionFailed: "server connection failed.",
    timeout: "server timeout."
};

const CT = { 'Content-Type': 'text/html; charset=UTF-8' };

// growtopia-style error json
function gtError(msg) {
    return JSON.stringify({
        status: "failed",
        message: msg,
        token: "",
        url: "",
        accountType: "growtopia",
        accountAge: 2
    });
}

// send error (checks headersSent so u dont crash)
function sendError(res, code, msg) {
    if (res.headersSent) return;
    res.writeHead(code, CT);
    res.end(gtError(msg));
}

// shorthands
function err400(res, msg) { sendError(res, 400, msg || MESSAGES.serverError); }
function err502(res, msg) { sendError(res, 502, msg || MESSAGES.serverError); }
function err504(res, msg) { sendError(res, 504, msg || MESSAGES.timeout); }

module.exports = {
    MESSAGES,
    sendError,
    err400,
    err502,
    err504
};
