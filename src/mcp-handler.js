const { writeStatus, writeResult, STATUS_FILE, RESULT_FILE } = require('./state');
const { buildPrompt } = require('./prompt');

/**
 * Xử lý MCP JSON-RPC (Streamable HTTP transport)
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {object} vscode - VSCode API instance (injected)
 */
async function handleMcp(req, res, vscode) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const msg = JSON.parse(body);
            const { method, params, id } = msg;

            // Notification (no id) — không cần trả lời
            if (id === undefined || id === null) {
                res.writeHead(202);
                res.end();
                return;
            }

            let result;

            if (method === 'initialize') {
                result = {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'roocode-bridge', version: '0.0.1' }
                };

            } else if (method === 'tools/list') {
                result = {
                    tools: [
                        // Tool cũ: Roo dùng để báo xong
                        {
                            name: 'report_done',
                            description: 'Call this tool to let user know the result.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        description: 'true if task completed successfully, false if there were errors'
                                    },
                                    output: {
                                        type: 'string',
                                        description: 'Brief summary of what was done: which files were changed, what features were added or fixed'
                                    },
                                    error: {
                                        type: 'string',
                                        description: 'Error description if success is false. Leave empty string if success is true.'
                                    }
                                },
                                required: ['success', 'output']
                            }
                        },
                    ]
                };

            } else if (method === 'tools/call') {
                const toolName = params?.name;
                const args = params?.arguments || {};

                if (toolName === 'report_done') {
                    const success = args.success !== false;
                    const output = args.output || '';
                    const error = args.error || '';

                    writeResult(success, output, error);
                    writeStatus('done', 'Roo Code reported completion');

                    console.log(`[roocode-bridge] report_done: success=${success}, output=${output.slice(0, 80)}`);

                    result = {
                        content: [{
                            type: 'text',
                            text: 'Result reported to pipeline manager. Task marked as done. The manager will now review your work.'
                        }]
                    };

                } else if (toolName === 'send_task') {
                    const task = args.task || '';
                    if (!task) {
                        result = {
                            content: [{ type: 'text', text: 'Error: task field is required' }],
                            isError: true
                        };
                    } else {
                        try {
                            // Xóa result cũ, set status running
                            if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);
                            writeStatus('running', 'Task received from Claude Code');

                            const prompt = buildPrompt(task);
                            await vscode.commands.executeCommand('roo-cline.newTask', { prompt });

                            result = {
                                content: [{
                                    type: 'text',
                                    text: 'Task sent to Roo Code successfully. Use get_status to poll for completion.'
                                }]
                            };
                        } catch (e) {
                            writeStatus('error', String(e));
                            result = {
                                content: [{ type: 'text', text: 'Error sending task: ' + String(e) }],
                                isError: true
                            };
                        }
                    }

                } else if (toolName === 'get_status') {
                    try {
                        const s = fs.existsSync(STATUS_FILE)
                            ? JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'))
                            : { status: 'idle' };
                        result = {
                            content: [{
                                type: 'text',
                                text: JSON.stringify(s)
                            }]
                        };
                    } catch (e) {
                        result = {
                            content: [{ type: 'text', text: 'Error reading status: ' + String(e) }],
                            isError: true
                        };
                    }

                } else if (toolName === 'get_result') {
                    try {
                        if (!fs.existsSync(RESULT_FILE)) {
                            result = {
                                content: [{ type: 'text', text: JSON.stringify({ available: false, message: 'No result yet. Check status first.' }) }]
                            };
                        } else {
                            const r = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
                            result = {
                                content: [{ type: 'text', text: JSON.stringify(r) }]
                            };
                        }
                    } catch (e) {
                        result = {
                            content: [{ type: 'text', text: 'Error reading result: ' + String(e) }],
                            isError: true
                        };
                    }

                } else {
                    result = {
                        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
                        isError: true
                    };
                }

            } else {
                res.writeHead(200);
                res.end(JSON.stringify({
                    jsonrpc: '2.0', id,
                    error: { code: -32601, message: `Method not found: ${method}` }
                }));
                return;
            }

            res.writeHead(200);
            res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));

        } catch (e) {
            console.error('[roocode-bridge] MCP parse error:', e.message);
            res.writeHead(400);
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                error: { code: -32700, message: 'Parse error: ' + e.message }
            }));
        }
    });
}

module.exports = { handleMcp };