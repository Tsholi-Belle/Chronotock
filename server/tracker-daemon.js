/**
 * ChronoTrack - Dedicated macOS Active Application Background Poller
 */

import { exec } from 'child_process';
import http from 'http';

const POLL_INTERVAL_MS = 2000;
const SERVER_URL = 'http://localhost:3150/api/logs';

let lastApp = '';
let lastTitle = '';
let sessionStartTime = Date.now();

function getActiveWindow() {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') {
      resolve({ appName: 'Mock Browser', windowTitle: 'ChronoTrack Dashboard' });
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

function sendActivityLog(payload) {
  const data = JSON.stringify(payload);
  const req = http.request(
    'http://localhost:3150/api/logs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    },
    (res) => {
      // response received
    }
  );

  req.on('error', () => {
    // Server offline or starting
  });

  req.write(data);
  req.end();
}

console.log('⚡ ChronoTrack macOS Tracker Daemon initialized...');
console.log('👀 Polling frontmost application window every 2s...');

setInterval(async () => {
  const current = await getActiveWindow();
  if (!current || !current.appName || current.appName === 'Unknown App') return;

  const now = Date.now();

  if (lastApp && (lastApp !== current.appName || lastTitle !== current.windowTitle)) {
    const durationSeconds = Math.round((now - sessionStartTime) / 1000);
    
    if (durationSeconds >= 3) {
      const todayStr = new Date().toISOString().split('T')[0];
      const logPayload = {
        appId: `app-${lastApp.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        appName: lastApp,
        windowTitle: lastTitle,
        startTime: new Date(sessionStartTime).toISOString(),
        endTime: new Date(now).toISOString(),
        durationSeconds,
        date: todayStr,
        isBillable: true,
      };

      console.log(`⏱️ [${lastApp}] ${lastTitle ? `"${lastTitle}"` : ''} — ${durationSeconds}s`);
      sendActivityLog(logPayload);
    }

    sessionStartTime = now;
  }

  lastApp = current.appName;
  lastTitle = current.windowTitle;
}, POLL_INTERVAL_MS);
