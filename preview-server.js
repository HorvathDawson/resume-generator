const express = require('express');
const ws = require('ws');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { spawn } = require('child_process');

// Enhanced preview server with build log streaming
const app = express();
const PORT = process.env.PORT || 4000;

// serve preview UI
app.use('/preview', express.static(path.join(__dirname, 'preview')));
// serve generated files root
app.use('/', express.static(__dirname));

const server = app.listen(PORT, () => {
  console.log(`Preview server running: http://localhost:${PORT}/preview`);
});

// global state for watcher and build child so we can shut down cleanly
let watcher = null;
let lastBuildChild = null;
let buildTimer = null;
let buildLog = []; // Store recent build log entries

// enable JSON body parsing for uploads
app.use(express.json({ limit: '2mb' }));

// WebSocket server for reload notifications and build log streaming
const wss = new ws.Server({ server });

function broadcast(msg) {
  wss.clients.forEach(client => {
    if (client.readyState === ws.OPEN) client.send(msg);
  });
}

function addLogEntry(message, type = 'info') {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    type
  };
  buildLog.push(entry);
  // Keep only last 100 entries
  if (buildLog.length > 100) {
    buildLog = buildLog.slice(-100);
  }
  
  // Broadcast to all connected clients
  broadcast(JSON.stringify({
    type: 'log',
    entry
  }));
}

// Enhanced build runner with log streaming
function buildResume(jsonPath) {
  return new Promise((resolve, reject) => {
    if (!jsonPath) return reject(new Error('No json path'));
    const abs = path.resolve(jsonPath);
    const filename = path.basename(abs, path.extname(abs));
    
    addLogEntry(`🏗️ Starting build for ${filename}...`, 'build');
    
    // spawn build and keep reference so we can kill it if needed
    if (lastBuildChild && !lastBuildChild.killed) {
      try { 
        lastBuildChild.kill('SIGTERM'); 
        addLogEntry('⚠️ Killing previous build process', 'warning');
      } catch (e) { /* ignore */ }
    }
    
    const child = spawn(process.execPath, [path.join(__dirname, 'build.js'), abs], { 
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    lastBuildChild = child;
    
    // Stream stdout and stderr to build log
    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          addLogEntry(line, 'stdout');
        }
      });
    });
    
    child.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          addLogEntry(line, 'stderr');
        }
      });
    });
    
    child.on('close', (code, signal) => {
      // If the child was terminated by us (signal present), treat specially so watchers that restart builds
      // don't surface a spurious error.
      if (signal) {
        addLogEntry('🛑 Build process terminated', 'warning');
        return reject(new Error('killed'));
      }
      if (code === 0) {
        addLogEntry(`✅ Build completed successfully for ${filename}`, 'success');
        resolve({ filename });
      } else {
        addLogEntry(`❌ Build failed with exit code ${code}`, 'error');
        reject(new Error('build failed'));
      }
    });
  });
}

// API: get build log
app.get('/api/log', (req, res) => {
  res.json({ log: buildLog });
});

// API: get available JSON files
app.get('/api/files', (req, res) => {
  try {
    const dataDir = path.join(__dirname, 'data');
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => `data/${file}`)
      .sort();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: upload JSON file
app.post('/api/upload', (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ ok: false, error: 'Missing filename or data' });
    }
    
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(dataDir, safeName);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    addLogEntry(`📁 File uploaded: ${safeName}`, 'success');
    
    res.json({ ok: true, filename: `data/${safeName}` });
  } catch (error) {
    addLogEntry(`❌ Upload error: ${error.message}`, 'error');
    res.status(500).json({ ok: false, error: error.message });
  }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  addLogEntry('🔗 Client connected to preview server', 'info');
  
  // Send current log to new client
  ws.send(JSON.stringify({
    type: 'log_history',
    log: buildLog
  }));
  
  ws.on('close', () => {
    addLogEntry('🔌 Client disconnected from preview server', 'info');
  });
});

// API: start preview for a given json file
app.get('/api/start', async (req, res) => {
  const jsonRel = req.query.json || 'data/service.json';
  const json = path.isAbsolute(jsonRel) ? jsonRel : path.join(__dirname, jsonRel);
  try {
    await buildResume(json);
    // stop any previous watcher
    if (watcher) {
      try { watcher.close(); } catch (e) { /* ignore */ }
      watcher = null;
    }
    // watch the json file, scss, and templates (use resolved paths)
    watcher = chokidar.watch([json, path.join(__dirname, 'scss'), path.join(__dirname, 'templates')]);
    watcher.on('change', (changed) => {
      addLogEntry(`📁 File changed: ${path.basename(changed)}`, 'info');
      // debounce rapid file events (editors/save may emit multiple events)
      if (buildTimer) clearTimeout(buildTimer);
      buildTimer = setTimeout(async () => {
        buildTimer = null;
        try {
          await buildResume(json);
          broadcast(JSON.stringify({ type: 'reload', file: `/${path.basename(json, path.extname(json))}.html` }));
        } catch (e) {
          // ignore builds that were killed due to restart
          if (e && e.message === 'killed') {
            addLogEntry('🔄 Build restarted due to file change', 'info');
            return;
          }
          addLogEntry(`❌ Build error: ${e.message}`, 'error');
          broadcast(JSON.stringify({ type: 'error', message: e.message }));
        }
      }, 250);
    });
    res.json({ ok: true, url: `/${path.basename(json, path.extname(json))}.html` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Return list of available JSON files in the data folder
app.get('/api/list-json', (req, res) => {
  const dataDir = path.join(__dirname, 'data');
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    const rel = files.map(f => path.join('data', f));
    res.json({ ok: true, files: rel });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Upload a JSON payload from the browser and save it under data/uploads
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!content) return res.status(400).json({ ok: false, error: 'no content' });
    const uploadsDir = path.join(__dirname, 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const base = filename ? path.basename(filename) : `uploaded-${Date.now()}.json`;
    const savePath = path.join(uploadsDir, base);
    fs.writeFileSync(savePath, content, 'utf8');
    // build it once
    await buildResume(`data/uploads/${base}`);
    res.json({ ok: true, url: `/data/uploads/${base.replace(/\\/g, '/')}` });
    // notify clients to load the new file
    broadcast(JSON.stringify({ type: 'reload', file: `${path.basename(base, path.extname(base))}.html` }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Save edited JSON content back to a file under data/ (prevents path escape)
app.post('/api/save', async (req, res) => {
  try {
    const { jsonPath, content } = req.body;
    if (!jsonPath || typeof content !== 'string') return res.status(400).json({ ok: false, error: 'missing params' });
    // only allow saving inside data directory
    const dataDir = path.join(__dirname, 'data');
    const abs = path.resolve(__dirname, jsonPath);
    if (!abs.startsWith(dataDir)) return res.status(400).json({ ok: false, error: 'invalid path' });
    // write file
    fs.writeFileSync(abs, content, 'utf8');
    // build and notify
    await buildResume(abs);
    broadcast(JSON.stringify({ type: 'reload', file: `/${path.basename(abs, path.extname(abs))}.html` }));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// WebSocket route: send a hello
wss.on('connection', socket => {
  socket.send(JSON.stringify({ type: 'hello' }));
});

// Graceful shutdown
function shutdown(code = 0) {
  console.log('Shutting down preview server...');
  if (watcher) {
    try { watcher.close(); } catch (e) { /* ignore */ }
    watcher = null;
  }
  if (lastBuildChild && !lastBuildChild.killed) {
    try { lastBuildChild.kill('SIGTERM'); } catch (e) { /* ignore */ }
  }
  try { wss.close(); } catch (e) { /* ignore */ }
  try { server.close(); } catch (e) { /* ignore */ }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
