import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3150;

app.use(cors());
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'server_logs.json');

// In-memory current state
let trackingActive = true;
let currentSession = {
  appId: 'app-vscode',
  appName: 'Visual Studio Code',
  windowTitle: 'App.tsx — timesheet-tracker',
  startTime: new Date().toISOString(),
};

function getSavedLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading logs:', e);
  }
  return [];
}

function saveLogs(logs) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Error writing logs:', e);
  }
}

// Get frontmost application on macOS via osascript
function getMacOSActiveWindow() {
  return new Promise((resolve) => {
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

    exec(`osascript -e '${script.replace(/\n/g, ' ')}'`, { timeout: 1500 }, (err, stdout, stderr) => {
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

// API Routes
app.get('/api/status', async (req, res) => {
  const osInfo = await getMacOSActiveWindow();
  res.json({
    status: 'online',
    platform: process.platform,
    trackingActive,
    currentSession,
    osDetectionAvailable: osInfo !== null,
    detectedActiveWindow: osInfo,
  });
});

app.get('/api/logs', (req, res) => {
  res.json(getSavedLogs());
});

app.post('/api/logs', (req, res) => {
  const newLog = req.body;
  if (!newLog || !newLog.appName) {
    return res.status(400).json({ error: 'Invalid log payload' });
  }

  const logs = getSavedLogs();
  logs.push({
    id: newLog.id || `daemon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...newLog,
    recordedAt: new Date().toISOString(),
  });
  saveLogs(logs);

  res.json({ success: true, count: logs.length });
});

app.post('/api/tracking/toggle', (req, res) => {
  trackingActive = req.body.active !== undefined ? req.body.active : !trackingActive;
  res.json({ trackingActive });
});

app.post('/api/tracking/session', (req, res) => {
  const { appId, appName, windowTitle } = req.body;
  currentSession = {
    appId: appId || 'custom',
    appName: appName || 'Active App',
    windowTitle: windowTitle || '',
    startTime: new Date().toISOString(),
  };
  res.json({ currentSession });
});

app.listen(PORT, () => {
  console.log(`🚀 ChronoTrack Daemon Server running at http://localhost:${PORT}`);
});
