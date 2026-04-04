const TelegramBot = require('node-telegram-bot-api');
const { buildPrompt } = require('./prompt');
const { writeStatus, RESULT_FILE, STATUS_FILE } = require('./state');
const fs = require('fs');

/**
 * Poll STATUS_FILE để kiểm tra task hoàn thành
 * @param {string} chatId - Telegram chat ID
 * @param {TelegramBot} botInstance - Bot instance
 */
function pollUntilDone(chatId, botInstance) {
    const startTime = Date.now();
    const timeout = 5 * 60 * 1000; // 5 phút

    const interval = setInterval(() => {
        if (Date.now() - startTime >= timeout) {
            clearInterval(interval);
            botInstance.sendMessage(chatId, 'Timeout: Task chưa hoàn thành sau 5 phút.');
            return;
        }

        try {
            const statusData = fs.existsSync(STATUS_FILE)
                ? JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'))
                : { status: 'running' };

            if (statusData.status === 'done' || statusData.status === 'error') {
                clearInterval(interval);

                let resultText = 'No result file found.';
                if (fs.existsSync(RESULT_FILE)) {
                    const resultData = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
                    resultText = resultData.success
                        ? resultData.output
                        : `Lỗi: ${resultData.error}`;
                }
                botInstance.sendMessage(chatId, resultText);
            }
        } catch (e) {
            console.error('[roocode-bridge] Error polling status:', e);
        }
    }, 3000);
}

/**
 * Xử lý message từ Telegram
 * @param {object} msg - Message từ Telegram bot
 * @param {TelegramBot} botInstance - Bot instance
 * @param {object} vscode - VSCode API instance (injected)
 */
async function handleTelegramMessage(msg, botInstance, vscode) {
    const text = msg.text;
    const chatId = msg.chat.id;

    // Xóa result cũ, set status running
    if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);
    writeStatus('running', 'Task received from Telegram');

    // Forward thẳng sang Roo Code
    const prompt = buildPrompt(text);
    await vscode.commands.executeCommand('roo-cline.newTask', { prompt });

    botInstance.sendMessage(chatId, 'Đang gửi task cho Roo Code...');
    pollUntilDone(chatId, botInstance);
}

function setupBot(token, vscode) {
    const bot = new TelegramBot(token, { polling: true });
    bot.onText(/\/start/, (msg) => bot.sendMessage(msg.chat.id, 'Xin chào! Nhập yêu cầu của bạn.'));
    bot.on('message', (msg) => {
        if (msg.text?.startsWith('/')) return;
        handleTelegramMessage(msg, bot, vscode);
    });
    return bot;
}

module.exports = { setupBot };