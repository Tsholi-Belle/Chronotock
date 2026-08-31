import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  DollarSign, 
  Tag, 
  ChevronDown, 
  RefreshCw, 
  Laptop, 
  Check, 
  Activity,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { TrackedApp, Project, Client, ActivityLog } from '../types';

interface LiveTrackerBarProps {
  isTracking: boolean;
  setIsTracking: (tracking: boolean) => void;
  apps: TrackedApp[];
  projects: Project[];
  clients: Client[];
  activeAppId: string;
  setActiveAppId: (appId: string) => void;
  currentTaskTitle: string;
  setCurrentTaskTitle: (title: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (projectId: string) => void;
  isBillable: boolean;
  setIsBillable: (billable: boolean) => void;
  onLogSession: (log: Partial<ActivityLog>) => void;
  todayDurationMinutes: number;
}

export const LiveTrackerBar: React.FC<LiveTrackerBarProps> = ({
  isTracking,
  setIsTracking,
  apps,
  projects,
  clients,
  activeAppId,
  setActiveAppId,
  currentTaskTitle,
  setCurrentTaskTitle,
  selectedProjectId,
  setSelectedProjectId,
  isBillable,
  setIsBillable,
  onLogSession,
  todayDurationMinutes,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // Simulation interval: simulates automated app switching across tracked apps
  useEffect(() => {
    let simInterval: NodeJS.Timeout | null = null;
    if (isSimulating && isTracking) {
      const activeApps = apps.filter((a) => a.isEnabled);
      const mockTitles: Record<string, string[]> = {
        'app-vscode': [
          'CheckoutForm.tsx — acme-checkout',
          'PaymentService.ts — stripe-integration',
          'api-routes.go — techflow-api',
          'App.tsx — timesheet-tracker',
        ],
        'app-chrome': [
          'Stripe API Documentation — Checkout & Elements',
          'GitHub — Pull Request #142: Revamp cart validation',
          'Linear — Issue PROJ-89: Payment edge cases',
          'Stack Overflow — Go redis pipeline optimization',
        ],
        'app-figma': [
          'Nexus Design System v2 — Buttons & Fields',
          'Acme Mobile Checkout Wireframes (Hi-Fi)',
          'E-Commerce Design Tokens 2026',
        ],
        'app-slack': [
          '#engineering — Standup updates',
          '#acme-client — Payment gateway approval',
          '#general — All hands announcement',
        ],
        'app-terminal': [
          'zsh — ~/work/acme-checkout (git push origin main)',
          'zsh — docker-compose up -d postgres redis',
          'zsh — npm test -- --watchAll',
        ],
      };

      simInterval = setInterval(() => {
        if (activeApps.length === 0) return;
        const randomApp = activeApps[Math.floor(Math.random() * activeApps.length)];
        setActiveAppId(randomApp.id);
        const titles = mockTitles[randomApp.id] || ['Working on active task...'];
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        setCurrentTaskTitle(randomTitle);
      }, 8000);
    }
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [isSimulating, isTracking, apps, setActiveAppId, setCurrentTaskTitle]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const handleSaveAndReset = () => {
    if (elapsedSeconds < 5) return;
    const now = new Date();
    const start = new Date(now.getTime() - elapsedSeconds * 1000);
    const currentApp = apps.find((a) => a.id === activeAppId) || apps[0];
    const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

    onLogSession({
      appId: currentApp?.id || 'app-vscode',
      appName: currentApp?.name || 'Visual Studio Code',
      windowTitle: currentTaskTitle || `${currentApp?.name || 'App'} Work Session`,
      startTime: start.toISOString(),
      endTime: now.toISOString(),
      durationSeconds: elapsedSeconds,
      projectId: currentProject?.id,
      clientId: currentProject?.clientId,
      isBillable,
      date: start.toISOString().split('T')[0],
    });

    setElapsedSeconds(0);
  };

  const currentApp = apps.find((a) => a.id === activeAppId) || apps[0];
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const currentClient = clients.find((c) => c.id === currentProject?.clientId);

  const hoursToday = (todayDurationMinutes / 60).toFixed(1);

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 shadow-xl shadow-black/20 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Active App & Window Title Input */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* App Selector Pill */}
          <div className="relative group">
            <select
              value={activeAppId}
              onChange={(e) => setActiveAppId(e.target.value)}
              className="appearance-none bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
            >
              {apps
                .filter((a) => a.isEnabled)
                .map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.shortName} ({app.category})
                  </option>
                ))}
            </select>
            <div
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{ backgroundColor: currentApp?.color || '#3b82f6' }}
            />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Current Task / Window Title Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={currentTaskTitle}
              onChange={(e) => setCurrentTaskTitle(e.target.value)}
              placeholder="What are you working on? (or auto-detected from active window)"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
            />
            {currentTaskTitle && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                Auto-tagged
              </span>
            )}
          </div>
        </div>

        {/* Center: Project & Client Selector */}
        <div className="flex items-center gap-2">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-7 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
            >
              {projects.map((proj) => {
                const client = clients.find((c) => c.id === proj.clientId);
                return (
                  <option key={proj.id} value={proj.id}>
                    {client ? `${client.name} › ` : ''}{proj.name}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Billable Toggle */}
          <button
            onClick={() => setIsBillable(!isBillable)}
            title={isBillable ? 'Billable Work ($)' : 'Non-Billable Work'}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isBillable
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isBillable ? 'Billable' : 'Non-Billable'}</span>
          </button>
        </div>

        {/* Right: Stopwatch Timer & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Live Timer Display */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-base font-bold text-white tracking-wider">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          {/* Start/Pause Button */}
          <button
            onClick={handleToggleTracking}
            className={`flex items-center justify-center w-9 h-9 rounded-xl font-bold shadow-lg transition ${
              isTracking
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
            title={isTracking ? 'Pause Tracking' : 'Start Tracking'}
          >
            {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Save & Log Session */}
          {elapsedSeconds >= 5 && (
            <button
              onClick={handleSaveAndReset}
              title="Save & Log Current Time Block"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-900/30 transition animate-fade-in"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          )}

          {/* Auto-Switch Simulator (For Demo & Live Preview) */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            title={isSimulating ? 'Stop App Switch Simulator' : 'Simulate Multi-App Activity (Demo)'}
            className={`p-2 rounded-xl border text-xs font-medium transition ${
              isSimulating
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Today's Total Pill */}
          <div className="hidden lg:flex flex-col items-end pl-2 border-l border-slate-800 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500">Today Total</span>
            <span className="text-xs font-bold text-slate-200 font-mono">{hoursToday} hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
