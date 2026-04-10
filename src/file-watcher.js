const fs = require('fs');
const path = require('path');
const { writeStatus, writeResult } = require('./state');

let watcher = null;
let pollTimer = null;

function extractPlanPath(task) {
    const match = task.match(/\.plan\/[\w-]+\.md/i);
    return match ? match[0] : null;
}

function getDoneFilePath(planRelPath) {
    return planRelPath.replace(/\.md$/i, '-done.md');
}

function cleanup() {
    if (watcher) { watcher.close(); watcher = null; }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function markDone(doneRelPath) {
    cleanup();
    console.log(`[roocode-bridge] Done file detected: ${doneRelPath}`);
    writeResult(true, `Plan completed: ${doneRelPath}`);
    writeStatus('done', 'Done file detected');
}

function watchForDone(task, workspaceRoot) {
    cleanup();

    const planRelPath = extractPlanPath(task);
    if (!planRelPath) {
        console.log('[roocode-bridge] No plan file found in task, skipping file watch');
        return;
    }

    const doneRelPath = getDoneFilePath(planRelPath);
    const doneAbsPath = path.join(workspaceRoot, doneRelPath);
    const watchDir = path.join(workspaceRoot, path.dirname(planRelPath));

    console.log(`[roocode-bridge] Watching for done file: ${doneAbsPath}`);

    // Check immediately in case already exists
    if (fs.existsSync(doneAbsPath)) {
        markDone(doneRelPath);
        return;
    }

    // fs.watch as primary trigger (filename can be null on Windows — check existence directly)
    try {
        watcher = fs.watch(watchDir, () => {
            if (fs.existsSync(doneAbsPath)) markDone(doneRelPath);
        });
        watcher.on('error', (e) => {
            console.error('[roocode-bridge] File watcher error:', e.message);
        });
    } catch (e) {
        console.error('[roocode-bridge] Failed to start file watcher:', e.message);
    }

    // Polling fallback every 3s in case fs.watch misses events
    pollTimer = setInterval(() => {
        if (fs.existsSync(doneAbsPath)) markDone(doneRelPath);
    }, 3000);
}

function stopWatcher() {
    cleanup();
}

module.exports = { watchForDone, stopWatcher };
