const vscode = require('vscode');
const { createServer } = require('./src/http-server');
const { setupBot } = require('./src/telegram');
const { writeStatus, RESULT_FILE } = require('./src/state');
const { stopWatcher } = require('./src/file-watcher');
const fs = require('fs');

let server = null;
let bot = null;

function activate(context) {
    if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);
    writeStatus('idle');

    const config = vscode.workspace.getConfiguration('iagent');

    const telegramToken = config.get('telegramToken');
    if (telegramToken) {
        bot = setupBot(telegramToken, vscode);
    }

    server = createServer(vscode);
    server.listen(3457, '127.0.0.1', () => {
        vscode.window.setStatusBarMessage('Roo Bridge: port 3457', 5000);
    });
    server.on('error', (e) => vscode.window.showErrorMessage(`Roo Bridge error: ${e.message}`));
}

function deactivate() {
    bot?.stopPolling();
    server?.close();
    stopWatcher();
}

module.exports = { activate, deactivate };