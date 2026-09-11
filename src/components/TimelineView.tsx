import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Layers, 
  Activity, 
  Info, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ActivityLog, TrackedApp, Project, Client } from '../types';
import { ExporterService } from '../services/exporter';

interface TimelineViewProps {
  logs: ActivityLog[];
  apps: TrackedApp[];
  projects: Project[];
  clients: Client[];
  selectedDate: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  logs,
  apps,
  projects,
  clients,
  selectedDate,
}) => {
  const [hoveredLog, setHoveredLog] = useState<ActivityLog | null>(null);
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');

  // Filter logs for selected date
  const dayLogs = useMemo(() => {
    return logs
      .filter((l) => l.date === selectedDate)
      .filter((l) => selectedAppFilter === 'all' || l.appId === selectedAppFilter)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [logs, selectedDate, selectedAppFilter]);

  // Timeline hours span: 08:00 to 20:00 (12 hours)
  const START_HOUR = 8;
  const END_HOUR = 20;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;

  const hoursArray = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Calculate position & width for each log block
  const getLogPosition = (log: ActivityLog) => {
    const start = new Date(log.startTime);
    const end = new Date(log.endTime);

    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const endMinutes = end.getHours() * 60 + end.getMinutes() - START_HOUR * 60;

    const leftPercent = Math.max(0, Math.min(100, (startMinutes / TOTAL_MINUTES) * 100));
    const rightPercent = Math.max(0, Math.min(100, (endMinutes / TOTAL_MINUTES) * 100));
    const widthPercent = Math.max(0.6, rightPercent - leftPercent);

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  // App breakdown percentages
  const appStats = useMemo(() => {
    const appMap: Record<string, { durationSecs: number; app: TrackedApp | undefined }> = {};
    let totalSecs = 0;

    dayLogs.forEach((l) => {
      totalSecs += l.durationSeconds;
      if (!appMap[l.appId]) {
        const appObj = apps.find((a) => a.id === l.appId);
        appMap[l.appId] = { durationSecs: 0, app: appObj };
      }
      appMap[l.appId].durationSecs += l.durationSeconds;
    });

    return Object.entries(appMap)
      .map(([appId, val]) => ({
        appId,
        name: val.app?.name || appId,
        shortName: val.app?.shortName || appId,
        color: val.app?.color || '#3b82f6',
        durationSecs: val.durationSecs,
        minutes: Math.round(val.durationSecs / 60),
        percentage: totalSecs > 0 ? Math.round((val.durationSecs / totalSecs) * 100) : 0,
      }))
      .sort((a, b) => b.durationSecs - a.durationSecs);
  }, [dayLogs, apps]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            Visual Day Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Continuous activity timeline showing app switches and focused work blocks.
          </p>
        </div>

        {/* Filter by App */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter App:</span>
          <select
            value={selectedAppFilter}
            onChange={(e) => setSelectedAppFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Tracked Apps</option>
            {apps
              .filter((a) => a.isEnabled)
              .map((app) => (
                <option key={app.id} value={app.id}>
                  {app.shortName}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 24-Hour Visual Timeline Bar */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Workday Progress ({START_HOUR}:00 — {END_HOUR}:00)
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Total Active: {ExporterService.formatDuration(dayLogs.reduce((a, b) => a + Math.round(b.durationSeconds / 60), 0))}
          </span>
        </div>

        {/* Timeline Axis and Track Container */}
        <div className="relative pt-6 pb-2">
          {/* Hour markers & vertical grid lines */}
          <div className="relative h-6 flex justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
            {hoursArray.map((hour) => (
              <div key={hour} className="flex flex-col items-center">
                <span>{String(hour).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Activity Bar Track */}
          <div className="relative h-16 bg-slate-100/90 dark:bg-slate-950/90 rounded-xl mt-4 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-inner flex items-center">
            {/* Hour Guide Lines */}
            {hoursArray.map((hour, idx) => {
              if (idx === 0 || idx === hoursArray.length - 1) return null;
              const left = `${((idx) / TOTAL_HOURS) * 100}%`;
              return (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 border-r border-slate-300/60 dark:border-slate-800/60 pointer-events-none"
                  style={{ left }}
                />
              );
            })}

            {/* Active Logs Slices */}
            {dayLogs.map((log) => {
              const pos = getLogPosition(log);
              const app = apps.find((a) => a.id === log.appId);
              const proj = projects.find((p) => p.id === log.projectId);
              const isHovered = hoveredLog?.id === log.id;

              return (
                <div
                  key={log.id}
                  onMouseEnter={() => setHoveredLog(log)}
                  onMouseLeave={() => setHoveredLog(null)}
                  className="absolute top-2 bottom-2 rounded-lg cursor-pointer transition-all hover:scale-y-110 hover:z-20 shadow-md"
                  style={{
                    left: pos.left,
                    width: pos.width,
                    backgroundColor: app?.color || '#3b82f6',
                    opacity: isHovered ? 1 : 0.85,
                    border: isHovered ? '2px solid white' : '1px solid rgba(0,0,0,0.3)',
                  }}
                />
              );
            })}
          </div>

          {/* Hover Tooltip Card */}
          {hoveredLog && (
            <div className="mt-4 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-fade-in flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        apps.find((a) => a.id === hoveredLog.appId)?.color || '#3b82f6',
                    }}
                  />
                  <span className="font-bold text-xs text-white">
                    {hoveredLog.appName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(hoveredLog.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(hoveredLog.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {Math.round(hoveredLog.durationSeconds / 60)} min
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  {hoveredLog.windowTitle || 'Active window session'}
                </p>
                {hoveredLog.manualNote && (
                  <p className="text-xs text-brand-300 italic">
                    Note: {hoveredLog.manualNote}
                  </p>
                )}
              </div>

              <div className="text-right text-xs">
                <div className="text-slate-400">
                  {projects.find((p) => p.id === hoveredLog.projectId)?.name || 'Unassigned'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {hoveredLog.isBillable ? 'Billable Work' : 'Internal'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App Distribution Percentage Bar */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Time Distribution by Application
          </span>
          <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex shadow-inner">
            {appStats.map((stat) => (
              <div
                key={stat.appId}
                title={`${stat.name}: ${stat.percentage}% (${stat.minutes}m)`}
                style={{
                  width: `${stat.percentage}%`,
                  backgroundColor: stat.color,
                }}
                className="h-full transition-all hover:opacity-80"
              />
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap pt-2">
            {appStats.map((stat) => (
              <div key={stat.appId} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="text-slate-300 font-medium">{stat.shortName}</span>
                <span className="text-slate-500 font-mono">
                  {stat.percentage}% ({ExporterService.formatDuration(stat.minutes)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Activity Logs Stream */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">
            Raw Activity Stream ({dayLogs.length} events recorded)
          </h3>
          <span className="text-xs text-slate-500">
            Automatic window captures
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
          {dayLogs.map((log) => {
            const app = apps.find((a) => a.id === log.appId);
            const proj = projects.find((p) => p.id === log.projectId);

            return (
              <div
                key={log.id}
                className="p-3 hover:bg-slate-900/50 transition flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: app?.color || '#3b82f6' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{log.appName}</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(log.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {proj && (
                        <span className="text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20">
                          {proj.name}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 font-mono text-[11px] truncate mt-0.5">
                      {log.windowTitle || '(No window title)'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono font-medium text-slate-300 flex-shrink-0">
                  {ExporterService.formatDuration(Math.round(log.durationSeconds / 60))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
