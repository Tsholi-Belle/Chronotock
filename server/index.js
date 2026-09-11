import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const PORT = process.env.PORT || 3150;
const LOG_FILE = path.join(__dirname, 'server_logs.json');

let trackingActive = true;
let currentSession = {
  appId: 'app-vscode',
  appName: 'Visual Studio Code',
  windowTitle: 'App.tsx — timesheet-tracker',
  startTime: new Date().toISOString(),
};

let lastPolledApp = '';
let lastPolledTitle = '';
let sessionStartTime = Date.now();

function getSavedLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading logs:', e.message);
  }
  return [];
}

function saveLogs(logs) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Error writing logs:', e.message);
  }
}

// Get frontmost application on macOS via AppleScript
function getMacOSActiveWindow() {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') {
      resolve(null);
      return;
    }

    const script = `
      try
        tell application "System Events"
          set frontApp to first application process whose frontmost is true
          set appName to name of frontApp
          set winTitle to ""
          try
            tell frontApp
              set winTitle to name of front window
            end tell
          end try
          return appName & "|||" & winTitle
        end tell
      on error errMsg
        return "Unknown|||" & errMsg
      end try
    `;

    exec(`osascript -e '${script.replace(/\n/g, ' ')}'`, { timeout: 1500 }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }
      const parts = stdout.trim().split('|||');
      resolve({
        appName: parts[0] || 'Unknown App',
        windowTitle: parts[1] || '',
      });
    });
  });
}

// Background auto-tracker loop
setInterval(async () => {
  if (!trackingActive) return;
  const current = await getMacOSActiveWindow();
  if (!current || !current.appName || current.appName === 'Unknown App') return;

  const now = Date.now();

  if (lastPolledApp && (lastPolledApp !== current.appName || lastPolledTitle !== current.windowTitle)) {
    const durationSeconds = Math.round((now - sessionStartTime) / 1000);

    if (durationSeconds >= 3) {
      const todayStr = new Date().toISOString().split('T')[0];
      const newLog = {
        id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        appId: `app-${current.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        appName: lastPolledApp,
        windowTitle: lastPolledTitle,
        startTime: new Date(sessionStartTime).toISOString(),
        endTime: new Date(now).toISOString(),
        durationSeconds,
        date: todayStr,
        isBillable: true,
        recordedAt: new Date().toISOString(),
      };

      const logs = getSavedLogs();
      logs.push(newLog);
      saveLogs(logs);
      console.log(`⏱️ Auto-logged [${lastPolledApp}] ${lastPolledTitle ? `"${lastPolledTitle}"` : ''} (${durationSeconds}s)`);
    }

    sessionStartTime = now;
  }

  lastPolledApp = current.appName;
  lastPolledTitle = current.windowTitle;
  currentSession = {
    appId: `app-${current.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    appName: current.appName,
    windowTitle: current.windowTitle,
    startTime: new Date(sessionStartTime).toISOString(),
  };
}, 2500);

// Helper for CORS and JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// MIME Types for static assets
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Fallback HTML page for status and quick start
function getStatusHtml(logsCount, osInfo) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ChronoTrack Backend Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090d16;
      color: #e2e8f0;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 { margin-top: 0; color: #38bdf8; font-size: 24px; display: flex; align-items: center; gap: 10px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: white;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 20px;
      transition: background 0.2s;
    }
    .btn:hover { background: #0369a1; }
    .endpoints {
      margin-top: 24px;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
    }
    .endpoints a { color: #38bdf8; text-decoration: none; }
    .endpoints a:hover { text-decoration: underline; }
    .note { margin-top: 20px; font-size: 13px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>⏱️ ChronoTrack Backend</h1>
      <span class="status-badge"><span class="dot"></span> Online</span>
    </div>
    <p style="color: #cbd5e1; line-height: 1.5;">
      The ChronoTrack background API and macOS active application tracking service is running successfully on port <strong>${PORT}</strong>.
    </p>

    <div style="margin: 20px 0;">
      <a href="http://localhost:5173" class="btn">👉 Open ChronoTrack Web App (localhost:5173)</a>
    </div>

    <div class="endpoints">
      <strong>Available REST API Endpoints:</strong><br><br>
      • <a href="/api/status" target="_blank">GET /api/status</a> — Server health & frontmost window<br>
      • <a href="/api/logs" target="_blank">GET /api/logs</a> — Tracked activity logs (${logsCount} records)<br>
      • <span>POST /api/logs</span> — Ingest activity record<br>
      • <span>POST /api/tracking/toggle</span> — Toggle tracking
    </div>

    <p class="note">
      💡 <em>To view the full interactive timesheet UI with timeline, run <code>npm run dev</code> and visit <a href="http://localhost:5173" style="color: #38bdf8;">http://localhost:5173</a>.</em>
    </p>
  </div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // GET /api/status
  if (req.method === 'GET' && pathname === '/api/status') {
    const osInfo = await getMacOSActiveWindow();
    sendJson(res, 200, {
      status: 'online',
      platform: process.platform,
      trackingActive,
      currentSession,
      osDetectionAvailable: osInfo !== null,
      detectedActiveWindow: osInfo,
      logsCount: getSavedLogs().length,
    });
    return;
  }

  // GET /api/logs
  if (req.method === 'GET' && pathname === '/api/logs') {
    sendJson(res, 200, getSavedLogs());
    return;
  }

  // GET /api/git/commits
  if (req.method === 'GET' && pathname === '/api/git/commits') {
    exec('git log -n 15 --pretty=format:"%h|||%an|||%ad|||%s" --date=iso', { cwd: ROOT_DIR }, (err, stdout) => {
      if (err || !stdout) {
        sendJson(res, 200, []);
        return;
      }
      const commits = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [hash, author, date, message] = line.split('|||');
        return {
          id: `git-${hash}`,
          type: 'commit',
          hash,
          author,
          date,
          message,
          title: `Commit ${hash}: ${message}`,
          estimatedDurationMinutes: 45
        };
      });
      sendJson(res, 200, commits);
    });
    return;
  }

  // POST /api/logs
  if (req.method === 'POST' && pathname === '/api/logs') {
    const newLog = await parseJsonBody(req);
    if (!newLog || !newLog.appName) {
      sendJson(res, 400, { error: 'Invalid log payload: missing appName' });
      return;
    }

    const logs = getSavedLogs();
    const entry = {
      id: newLog.id || `daemon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...newLog,
      recordedAt: new Date().toISOString(),
    };
    logs.push(entry);
    saveLogs(logs);

    sendJson(res, 201, { success: true, count: logs.length, entry });
    return;
  }

  // DELETE /api/logs
  if (req.method === 'DELETE' && pathname === '/api/logs') {
    saveLogs([]);
    sendJson(res, 200, { success: true, message: 'Logs cleared' });
    return;
  }

  // POST /api/tracking/toggle
  if (req.method === 'POST' && pathname === '/api/tracking/toggle') {
    const body = await parseJsonBody(req);
    trackingActive = body.active !== undefined ? body.active : !trackingActive;
    sendJson(res, 200, { trackingActive });
    return;
  }

  // POST /api/tracking/session
  if (req.method === 'POST' && pathname === '/api/tracking/session') {
    const body = await parseJsonBody(req);
    currentSession = {
      appId: body.appId || 'custom',
      appName: body.appName || 'Active App',
      windowTitle: body.windowTitle || '',
      startTime: new Date().toISOString(),
    };
    sendJson(res, 200, { currentSession });
    return;
  }

  // Serve static dist files if they exist
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // If visiting / or /index.html and dist is not found, render status page
  if (pathname === '/' || pathname === '/index.html') {
    const osInfo = await getMacOSActiveWindow();
    const logs = getSavedLogs();
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(getStatusHtml(logs.length, osInfo));
    return;
  }

  // Default 404 for unknown endpoints
  sendJson(res, 404, {
    error: 'Endpoint not found',
    requestedPath: pathname,
    availableEndpoints: ['/api/status', '/api/logs', '/api/tracking/toggle'],
    dashboardUrl: 'http://localhost:5173'
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use by another process.`);
    console.error(`💡 If ChronoTrack server is already running, you can connect directly at http://localhost:${PORT}`);
    console.error(`💡 To stop the existing server, run: lsof -ti :${PORT} | xargs kill -9`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 ChronoTrack Backend API running at http://localhost:${PORT}`);
  console.log(`⚡ Native macOS Active Window Tracker: Active`);
  console.log(`🌐 Web Dashboard: http://localhost:5173\n`);
});
