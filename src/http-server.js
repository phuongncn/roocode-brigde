const http = require('http');
const fs = require('fs');
const { handleMcp } = require('./mcp-handler');
const { writeStatus, writeResult, RESULT_FILE, STATUS_FILE } = require('./state');
const { buildPrompt } = require('./prompt');

const PORT = 3457;

function createServer(vscode) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // POST /task — nhận task từ bot
    if (req.method === 'POST' && req.url === '/task') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { task } = JSON.parse(body);
                if (!task) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing task field' }));
                    return;
                }

                if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);
                writeStatus('running', 'Task received');

                const prompt = buildPrompt(task);
                await vscode.commands.executeCommand('roo-cline.newTask', { prompt });

                res.writeHead(200);
                res.end(JSON.stringify({ ok: true, message: 'Task sent to Roo Code' }));

            } catch (e) {
                writeStatus('error', String(e));
                res.writeHead(500);
                res.end(JSON.stringify({ error: String(e) }));
            }
        });
        return;
    }

    // GET /status
    if (req.method === 'GET' && req.url === '/status') {
        try {
            const s = fs.existsSync(STATUS_FILE)
                ? JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'))
                : { status: 'unknown' };
            res.writeHead(200);
            res.end(JSON.stringify(s));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(e) }));
        }
        return;
    }

    // POST /result — fallback thủ công (vẫn giữ để debug)
    if (req.method === 'POST' && req.url === '/result') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                writeResult(data.success !== false, data.output || '', data.error || '');
                writeStatus('done');
                res.writeHead(200);
                res.end(JSON.stringify({ ok: true }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: String(e) }));
            }
        });
        return;
    }

    // POST /mcp — MCP Streamable HTTP endpoint
    if (req.method === 'POST' && req.url === '/mcp') {
        handleMcp(req, res, vscode);
        return;
    }

    // GET /mcp — health check cho MCP client
    if (req.method === 'GET' && req.url === '/mcp') {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, transport: 'streamable-http' }));
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return server;
}

module.exports = { createServer, PORT };