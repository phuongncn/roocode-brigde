const fs = require('fs');
const path = require('path');
const os = require('os');

const RESULT_FILE = path.join(os.tmpdir(), 'roocode_result.json');
const STATUS_FILE = path.join(os.tmpdir(), 'roocode_status.json');

function writeStatus(status, detail = '') {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status, detail, ts: Date.now() }));
}

function writeResult(success, output, error = '') {
    fs.writeFileSync(RESULT_FILE, JSON.stringify({ success, output, error, ts: Date.now() }));
}

module.exports = { RESULT_FILE, STATUS_FILE, writeStatus, writeResult };