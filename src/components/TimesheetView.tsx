import React, { useState, useMemo } from 'react';
import { 
  TimesheetEntry, 
  Project, 
  Client, 
  TrackedApp, 
  TimesheetSettings, 
  RoundingIncrement 
} from '../types';
import { ExporterService } from '../services/exporter';

interface TimesheetViewProps {
  entries: TimesheetEntry[];
  projects: Project[];
  clients: Client[];
  apps: TrackedApp[];
  settings: TimesheetSettings;
  onUpdateSettings: (settings: Partial<TimesheetSettings>) => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenManualEntry: () => void;
  onOpenExport: () => void;
  selectedDate: string;
  onRefreshConsolidation: () => void;
}

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  entries,
  projects,
  clients,
  apps,
  settings,
  onUpdateSettings,
  onEditEntry,
  onDeleteEntry,
  onOpenManualEntry,
  onOpenExport,
  selectedDate,
  onRefreshConsolidation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [billableFilter, setBillableFilter] = useState<'all' | 'billable' | 'non-billable'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'client' | 'app'>('none');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Date filter
      if (entry.date !== selectedDate) return false;

      // Project filter
      if (selectedProjectId !== 'all' && entry.projectId !== selectedProjectId) {
        return false;
      }

      // Billable filter
      if (billableFilter === 'billable' && !entry.isBillable) return false;
      if (billableFilter === 'non-billable' && entry.isBillable) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = entry.description.toLowerCase().includes(q);
        const matchesProj = entry.projectName.toLowerCase().includes(q);
        const matchesClient = entry.clientName.toLowerCase().includes(q);
        const matchesApps = entry.appNames.some((a) => a.toLowerCase().includes(q));
        const matchesDetails = entry.details?.some((d) => d.toLowerCase().includes(q));
        if (!matchesDesc && !matchesProj && !matchesClient && !matchesApps && !matchesDetails) {
          return false;
        }
      }

      return true;
    });
  }, [entries, selectedDate, selectedProjectId, billableFilter, searchQuery]);

  // Aggregate stats
  const { totalMinutes, billableMinutes, totalEarnings, uniqueAppsCount } = useMemo(() => {
    let totMin = 0;
    let billMin = 0;
    let earnings = 0;
    const appSet = new Set<string>();

    filteredEntries.forEach((e) => {
      totMin += e.roundedMinutes;
      if (e.isBillable) {
        billMin += e.roundedMinutes;
        earnings += e.billableAmount;
      }
      e.appNames.forEach((a) => appSet.add(a));
    });

    return {
      totalMinutes: totMin,
      billableMinutes: billMin,
      totalEarnings: earnings,
      uniqueAppsCount: appSet.size,
    };
  }, [filteredEntries]);

  // Grouped entries structure
  const groupedSections = useMemo(() => {
    if (groupBy === 'none') {
      return [{ title: 'All Day Sessions', entries: filteredEntries, color: '#3b82f6' }];
    }

    const groups: Record<string, { title: string; entries: TimesheetEntry[]; color: string }> = {};

    filteredEntries.forEach((entry) => {
      let key = 'Other';
      let title = 'Other';
      let color = '#64748b';

      if (groupBy === 'project') {
        key = entry.projectId;
        title = `${entry.clientName} › ${entry.projectName}`;
        color = entry.color || '#3b82f6';
      } else if (groupBy === 'client') {
        key = entry.clientId;
        title = entry.clientName;
        color = entry.color || '#10b981';
      } else if (groupBy === 'app') {
        key = entry.appNames[0] || 'Unknown';
        title = entry.appNames[0] || 'Unknown App';
        color = '#8b5cf6';
      }

      if (!groups[key]) {
        groups[key] = { title, entries: [], color };
      }
      groups[key].entries.push(entry);
    });

    return Object.values(groups);
  }, [filteredEntries, groupBy]);

  const toggleExpand = (id: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySingle = (entry: TimesheetEntry) => {
    const text = ExporterService.generateJiraFormat([entry]);
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllForTimesheet = () => {
    const text = ExporterService.generateJiraFormat(filteredEntries);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Time */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tracked
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              Hours
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {ExporterService.formatDuration(totalMinutes)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({ExporterService.formatDecimalHours(totalMinutes)} hrs)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Across {filteredEntries.length} consolidated timesheet blocks
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-cyan-500 opacity-60" />
        </div>

        {/* Billable Time */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Billable Hours
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Billing
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {ExporterService.formatDuration(billableMinutes)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0}% of total)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {ExporterService.formatDuration(totalMinutes - billableMinutes)} non-billable / admin
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-60" />
        </div>

        {/* Total Value */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Billable Value
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              USD
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-300 font-mono">
              ${totalEarnings.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Avg rate: ${(totalEarnings / Math.max(0.1, billableMinutes / 60)).toFixed(0)}/hr
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 opacity-60" />
        </div>

        {/* Tracked Apps */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Apps Today
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
              Apps
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{uniqueAppsCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">applications</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {apps
              .filter((a) => a.isEnabled)
              .slice(0, 4)
              .map((app) => (
                <span
                  key={app.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {app.shortName}
                </span>
              ))}
            {apps.filter((a) => a.isEnabled).length > 4 && (
              <span className="text-[10px] text-slate-500">
                +{apps.filter((a) => a.isEnabled).length - 4} more
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 opacity-60" />
        </div>
      </div>

      {/* 2. Controls & Filtering Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, window titles, apps, or projects..."
              className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Project Filter */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Billable Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setBillableFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                billableFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setBillableFilter('billable')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                billableFilter === 'billable'
                  ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Billable
            </button>
            <button
              type="button"
              onClick={() => setBillableFilter('non-billable')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                billableFilter === 'non-billable'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Non-Billable
            </button>
          </div>

          {/* Group By */}
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="none">Group: Chronological</option>
              <option value="project">Group: By Project</option>
              <option value="client">Group: By Client</option>
              <option value="app">Group: By App</option>
            </select>
          </div>
        </div>

        {/* Rounding & Fast Timesheet Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          {/* Duration Rounding Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Timesheet Rounding:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-0.5">
              {([0, 5, 15, 30, 60] as RoundingIncrement[]).map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => onUpdateSettings({ roundingIncrement: inc })}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    settings.roundingIncrement === inc
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {inc === 0 ? 'Exact' : `${inc}m`}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline">
              (Standard corporate billing is 15m)
            </span>
          </div>

          {/* Quick Timesheet Copy Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshConsolidation}
              title="Re-run smart consolidation algorithm"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
            >
              Re-consolidate
            </button>

            <button
              type="button"
              onClick={handleCopyAllForTimesheet}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                copiedAll
                  ? 'bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                  : 'bg-brand-600/20 hover:bg-brand-600/30 text-brand-700 dark:text-brand-300 border-brand-500/30'
              }`}
            >
              {copiedAll ? 'Copied Timesheet!' : 'Copy for Timesheet'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Consolidated Timesheet Table */}
      <div className="space-y-6">
        {groupedSections.map((section, idx) => (
          <div key={idx} className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
            {/* Section Header if grouped */}
            {groupBy !== 'none' && (
              <div className="bg-slate-100/90 dark:bg-slate-900/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{section.title}</h3>
                  <span className="text-xs text-slate-500">
                    ({section.entries.length} sessions)
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {ExporterService.formatDuration(
                    section.entries.reduce((a, b) => a + b.roundedMinutes, 0)
                  )}
                </div>
              </div>
            )}

            {/* Timesheet Entries List */}
            {section.entries.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-medium mb-3">
                  No activity recorded for this day
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Start tracking in the top bar, enable background monitoring, or click "Log Time" to add a manual entry.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenManualEntry}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition"
                  >
                    Log Time Manually
                  </button>
                  <button
                    type="button"
                    onClick={onRefreshConsolidation}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                  >
                    Load Demo Workday
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {section.entries.map((entry) => {
                  const isExpanded = !!expandedDetails[entry.id];
                  const isCopied = copiedId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition group flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Left: Time, Project, Client, and Description */}
                        <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                          {/* Time range badge */}
                          <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-[90px]">
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {entry.startTime}
                            </span>
                            <span className="text-[10px] text-slate-500">to {entry.endTime}</span>
                          </div>

                          {/* Details & Summary */}
                          <div className="flex-1 space-y-1">
                            {/* Project & Client Pill */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm"
                                style={{
                                  backgroundColor: `${entry.color || '#3b82f6'}20`,
                                  color: entry.color || '#3b82f6',
                                  borderColor: `${entry.color || '#3b82f6'}40`,
                                  borderWidth: 1,
                                }}
                              >
                                {entry.clientName} › {entry.projectName}
                              </span>

                              {/* Billable Tag */}
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                  entry.isBillable
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {entry.isBillable ? `Billable ($${entry.hourlyRate}/h)` : 'Internal'}
                              </span>

                              {/* Manual vs Auto indicator */}
                              {entry.isManual && (
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-200 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                                  Manual
                                </span>
                              )}
                            </div>

                            {/* Consolidated Work Description */}
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                              {entry.description}
                            </p>

                            {/* Tracked Apps List */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[11px] text-slate-500">Apps:</span>
                              {entry.appNames.map((appName, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                                >
                                  {appName}
                                </span>
                              ))}

                              {/* Expand Window Titles details toggle */}
                              {entry.details && entry.details.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(entry.id)}
                                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 ml-2 font-medium"
                                >
                                  {isExpanded
                                    ? '[-] Hide breakdown'
                                    : `[+] ${entry.details.length} sub-tasks / window logs`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Duration & Actions */}
                        <div className="flex items-center gap-4">
                          {/* Duration Display */}
                          <div className="text-right">
                            <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                              {ExporterService.formatDuration(entry.roundedMinutes)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {entry.isBillable ? `$${entry.billableAmount.toFixed(2)}` : 'Non-billable'}
                              {settings.roundingIncrement > 0 && (
                                <span className="ml-1 text-slate-400 dark:text-slate-600">
                                  (raw: {ExporterService.formatDuration(entry.durationMinutes)})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {/* Copy for Timesheet */}
                            <button
                              type="button"
                              onClick={() => handleCopySingle(entry)}
                              title="Copy timesheet row"
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                                isCopied
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {isCopied ? 'Copied' : 'Copy'}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onEditEntry(entry)}
                              title="Edit Entry"
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 transition"
                            >
                              Edit
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(entry.id)}
                              title="Delete Entry"
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-slate-800 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Sub-Tasks & Windows Breakdown */}
                      {isExpanded && entry.details && (
                        <div className="mt-2 ml-12 p-3 bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5 animate-fade-in">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Detailed Window Titles & Activity Trace
                          </span>
                          <ul className="space-y-1">
                            {entry.details.map((d, i) => (
                              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <span className="text-brand-600 dark:text-brand-400 mt-0.5">•</span>
                                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
