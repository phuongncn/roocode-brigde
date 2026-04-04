const fs = require('fs');
const path = require('path');
const { writeStatus, writeResult } = require('./state');

let watcher = null;

function extractPlanPath(task) {
    const match = task.match(/plan\/[\w-]+\.md/i);
    return match ? match[0] : null;
}

function getDoneFilePath(planRelPath) {
    return planRelPath.replace(/\.md$/i, '-done.md');
}

function watchForDone(task, workspaceRoot) {
    if (watcher) {
        watcher.close();
        watcher = null;
    }

    const planRelPath = extractPlanPath(task);
    if (!planRelPath) {
        console.log('[roocode-bridge] No plan file found in task, skipping file watch');
        return;
    }

    const doneRelPath = getDoneFilePath(planRelPath);
    const doneAbsPath = path.join(workspaceRoot, doneRelPath);
    const watchDir = path.join(workspaceRoot, path.dirname(planRelPath));

    console.log(`[roocode-bridge] Watching for done file: ${doneAbsPath}`);

    // Check immediately in case already renamed
    if (fs.existsSync(doneAbsPath)) {
        writeResult(true, `Plan completed: ${doneRelPath}`);
        writeStatus('done', 'Done file detected');
        return;
    }

    try {
        watcher = fs.watch(watchDir, (event, filename) => {
            if (!filename) return;
            const fullPath = path.join(watchDir, filename);
            if (fullPath === doneAbsPath && fs.existsSync(doneAbsPath)) {
                console.log(`[roocode-bridge] Done file detected: ${doneAbsPath}`);
                writeResult(true, `Plan completed: ${doneRelPath}`);
                writeStatus('done', 'Done file detected');
                watcher.close();
                watcher = null;
            }
        });

        watcher.on('error', (e) => {
            console.error('[roocode-bridge] File watcher error:', e.message);
        });
    } catch (e) {
        console.error('[roocode-bridge] Failed to start file watcher:', e.message);
    }
}

function stopWatcher() {
    if (watcher) {
        watcher.close();
        watcher = null;
    }
}

module.exports = { watchForDone, stopWatcher };
