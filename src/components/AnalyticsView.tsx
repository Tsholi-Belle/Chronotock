import React, { useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Sparkles, 
  Zap, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ActivityLog, TimesheetEntry, TrackedApp, Project, Client } from '../types';
import { ExporterService } from '../services/exporter';

interface AnalyticsViewProps {
  entries: TimesheetEntry[];
  logs: ActivityLog[];
  apps: TrackedApp[];
  projects: Project[];
  clients: Client[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  entries,
  logs,
  apps,
  projects,
  clients,
}) => {
  // Aggregate stats across all entries
  const totalMinutes = useMemo(() => {
    return entries.reduce((a, b) => a + b.roundedMinutes, 0);
  }, [entries]);

  const billableMinutes = useMemo(() => {
    return entries.filter((e) => e.isBillable).reduce((a, b) => a + b.roundedMinutes, 0);
  }, [entries]);

  const nonBillableMinutes = totalMinutes - billableMinutes;
  const billablePercentage = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;
  const totalEarnings = entries.reduce((a, b) => a + b.billableAmount, 0);

  // App breakdown
  const appBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      map[l.appId] = (map[l.appId] || 0) + l.durationSeconds;
    });

    const totalSecs = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map)
      .map(([appId, secs]) => {
        const app = apps.find((a) => a.id === appId);
        return {
          appId,
          name: app?.name || appId,
          shortName: app?.shortName || appId,
          category: app?.category || 'other',
          color: app?.color || '#3b82f6',
          minutes: Math.round(secs / 60),
          percentage: totalSecs > 0 ? Math.round((secs / totalSecs) * 100) : 0,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [logs, apps]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    const map: Record<string, { minutes: number; amount: number; isBillable: boolean }> = {};
    entries.forEach((e) => {
      if (!map[e.projectId]) {
        map[e.projectId] = { minutes: 0, amount: 0, isBillable: e.isBillable };
      }
      map[e.projectId].minutes += e.roundedMinutes;
      map[e.projectId].amount += e.billableAmount;
    });

    return Object.entries(map)
      .map(([projId, data]) => {
        const proj = projects.find((p) => p.id === projId);
        const client = clients.find((c) => c.id === proj?.clientId);
        return {
          projId,
          name: proj?.name || 'General Work',
          clientName: client?.name || 'Internal',
          color: proj?.color || '#3b82f6',
          minutes: data.minutes,
          amount: data.amount,
          isBillable: data.isBillable,
          percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [entries, projects, clients, totalMinutes]);

  // Focus & Switching Metrics
  const averageFocusSessionMinutes = useMemo(() => {
    if (logs.length === 0) return 0;
    const validLogs = logs.filter((l) => l.durationSeconds >= 30);
    if (validLogs.length === 0) return 0;
    const total = validLogs.reduce((a, b) => a + b.durationSeconds, 0);
    return Math.round(total / validLogs.length / 60);
  }, [logs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          Work & Productivity Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Consolidated performance metrics, billable ratio, and application usage patterns.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Timesheet Hours
          </span>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            {ExporterService.formatDuration(totalMinutes)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {(totalMinutes / 60).toFixed(2)} decimal hrs
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Billable Efficiency
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {billablePercentage}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {ExporterService.formatDuration(billableMinutes)} of {ExporterService.formatDuration(totalMinutes)}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Accumulated Value
          </span>
          <div className="mt-2 text-2xl font-bold text-amber-300 font-mono">
            ${totalEarnings.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all logged projects</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Avg Continuous Focus
          </span>
          <div className="mt-2 text-2xl font-bold text-purple-400 font-mono">
            {averageFocusSessionMinutes}m
          </div>
          <div className="text-xs text-slate-500 mt-1">Per app focus session</div>
        </div>
      </div>

      {/* Two Column Layout: Apps vs Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apps Breakdown */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              Time Spent by Application
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {appBreakdown.length} apps tracked
            </span>
          </div>

          <div className="space-y-3">
            {appBreakdown.map((app) => (
              <div key={app.appId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: app.color }}
                    />
                    <span className="font-semibold text-slate-200">{app.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      ({app.category})
                    </span>
                  </div>
                  <span className="font-mono text-slate-300 font-medium">
                    {ExporterService.formatDuration(app.minutes)} ({app.percentage}%)
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${app.percentage}%`,
                      backgroundColor: app.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Breakdown */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Time & Value by Project
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {projectBreakdown.length} projects
            </span>
          </div>

          <div className="space-y-3">
            {projectBreakdown.map((proj) => (
              <div key={proj.projId} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: proj.color }}
                    />
                    <div>
                      <span className="font-bold text-slate-200">{proj.name}</span>
                      <div className="text-[10px] text-slate-400">{proj.clientName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-200">
                      {ExporterService.formatDuration(proj.minutes)}
                    </div>
                    {proj.amount > 0 && (
                      <div className="text-[10px] text-emerald-400 font-mono font-semibold">
                        ${proj.amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${proj.percentage}%`,
                      backgroundColor: proj.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
