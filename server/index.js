import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Background auto-tracker loop inside server
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
  res.end(JSON.stringify(data));
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

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
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

  // Default 404
  sendJson(res, 404, { error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`🚀 ChronoTrack Backend API running at http://localhost:${PORT}`);
  console.log(`⚡ Native macOS Tracker Poller: Active (polling frontmost app)`);
});
