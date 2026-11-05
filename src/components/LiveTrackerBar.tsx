import React, { useState, useEffect } from 'react';
import { TrackedApp, Project, Client, ActivityLog, CareerTrackerConfig } from '../types';

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
  careerConfig?: CareerTrackerConfig;
  onOpenCareerModal?: () => void;
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
  careerConfig,
  onOpenCareerModal,
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
        'app-antigravity': [
          'Antigravity — AI Pair Programming & Timesheet Feature',
          'Antigravity Agent — Multi-App Work Consolidation Plan',
          'Antigravity 2.0 — Backend Tracker Integration',
          'agy goal — automated task workflow',
        ],
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

  const hoursToday = (todayDurationMinutes / 60).toFixed(1);

  const handleQuickTag = (tag: string) => {
    const formatted = `[${tag}]`;
    if (currentTaskTitle.startsWith(formatted)) {
      setCurrentTaskTitle(currentTaskTitle.replace(`${formatted} `, '').replace(formatted, ''));
    } else {
      setCurrentTaskTitle(`${formatted} ${currentTaskTitle}`.trim());
    }
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 dark:shadow-black/20 px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active App & Window Title Input */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Career & Industry Customization Button */}
          {onOpenCareerModal && (
            <button
              type="button"
              onClick={onOpenCareerModal}
              title={`Industry Profile: ${careerConfig?.industryName || 'Software & Tech'}. Click to customize fields & terminology.`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm flex-shrink-0"
            >
              <span className="font-semibold">{careerConfig?.industryName?.split(' ')[0] || 'Career'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Customize</span>
            </button>
          )}

          {/* App / Tool Selector Pill */}
          <div className="relative flex-shrink-0" title={careerConfig?.appFieldLabel || 'Application'}>
            <select
              value={activeAppId}
              onChange={(e) => setActiveAppId(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
            >
              {apps
                .filter((a) => a.isEnabled)
                .map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.shortName} ({app.category})
                  </option>
                ))}
            </select>
          </div>

          {/* Current Task / Window Title Input */}
          <div className="relative flex-1" title={careerConfig?.taskFieldLabel || 'Task / Activity'}>
            <input
              type="text"
              value={currentTaskTitle}
              onChange={(e) => setCurrentTaskTitle(e.target.value)}
              placeholder={careerConfig?.taskPlaceholder || "What are you working on? (or auto-detected from active window)"}
              className="w-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>
        </div>

        {/* Center: Project & Client Selector */}
        <div className="flex items-center gap-2">
          {/* Project Selector */}
          <div className="relative" title={careerConfig?.projectFieldLabel || 'Client › Project'}>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
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
          </div>

          {/* Billable Toggle */}
          <button
            type="button"
            onClick={() => setIsBillable(!isBillable)}
            title={isBillable ? `${careerConfig?.billableLabel || 'Billable'} Work` : `${careerConfig?.nonBillableLabel || 'Non-Billable'} Work`}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isBillable
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {isBillable ? (careerConfig?.billableLabel || 'Billable') : (careerConfig?.nonBillableLabel || 'Non-Billable')}
          </button>
        </div>

        {/* Right: Stopwatch Timer & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Live Timer Display */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800/80 px-3.5 py-1.5 rounded-xl">
            <span className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-wider">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          {/* Start/Pause Button */}
          <button
            type="button"
            onClick={handleToggleTracking}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition ${
              isTracking
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
            title={isTracking ? 'Pause Tracking' : 'Start Tracking'}
          >
            {isTracking ? 'Pause' : 'Start'}
          </button>

          {/* Save & Log Session */}
          {elapsedSeconds >= 5 && (
            <button
              type="button"
              onClick={handleSaveAndReset}
              title="Save & Log Current Time Block"
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-900/30 transition animate-fade-in"
            >
              Log
            </button>
          )}

          {/* Auto-Switch Simulator (For Demo & Live Preview) */}
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            title={isSimulating ? 'Stop App Switch Simulator' : 'Simulate Multi-App Activity (Demo)'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              isSimulating
                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {isSimulating ? 'Simulating' : 'Simulate'}
          </button>

          {/* Today's Total Pill */}
          <div className="hidden lg:flex flex-col items-end pl-2 border-l border-slate-200 dark:border-slate-800 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Today Total</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{hoursToday} hrs</span>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Tags for the active career */}
      {careerConfig?.quickTags && careerConfig.quickTags.length > 0 && (
        <div className="max-w-7xl mx-auto flex items-center gap-2 pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] overflow-x-auto">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
            <span>{careerConfig.industryName.split(' ')[0]} Tags:</span>
          </span>
          <div className="flex items-center gap-1 flex-nowrap">
            {careerConfig.quickTags.map((tag) => {
              const isActive = currentTaskTitle.includes(`[${tag}]`);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTag(tag)}
                  title={`Click to tag task as [${tag}]`}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  +{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
