import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  DollarSign, 
  Layers, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Split, 
  Filter, 
  Search, 
  Download, 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Tag,
  Briefcase,
  SlidersHorizontal,
  RefreshCw,
  Plus
} from 'lucide-react';
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
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

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

  // Statistics
  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce((acc, e) => acc + e.roundedMinutes, 0);
  }, [filteredEntries]);

  const billableMinutes = useMemo(() => {
    return filteredEntries.filter((e) => e.isBillable).reduce((acc, e) => acc + e.roundedMinutes, 0);
  }, [filteredEntries]);

  const totalEarnings = useMemo(() => {
    return filteredEntries.reduce((acc, e) => acc + e.billableAmount, 0);
  }, [filteredEntries]);

  const uniqueAppsCount = useMemo(() => {
    const appSet = new Set<string>();
    filteredEntries.forEach((e) => e.appNames.forEach((a) => appSet.add(a)));
    return appSet.size;
  }, [filteredEntries]);

  const toggleExpand = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySingle = (entry: TimesheetEntry) => {
    const text = `[${entry.projectName}] ${ExporterService.formatDuration(entry.roundedMinutes)} — ${entry.description}`;
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

  const toggleSelectAll = () => {
    if (selectedEntryIds.length === filteredEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(filteredEntries.map((e) => e.id));
    }
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Grouping structure
  const groupedSections = useMemo(() => {
    if (groupBy === 'none') {
      return [{ title: 'All Consolidated Sessions', entries: filteredEntries, color: '#3b82f6' }];
    }

    const groups: Record<string, { title: string; entries: TimesheetEntry[]; color: string }> = {};

    filteredEntries.forEach((e) => {
      let key = '';
      let title = '';
      let color = e.color || '#3b82f6';

      if (groupBy === 'project') {
        key = e.projectId;
        title = `${e.clientName} › ${e.projectName}`;
      } else if (groupBy === 'client') {
        key = e.clientId;
        title = e.clientName;
      } else if (groupBy === 'app') {
        key = e.appNames[0] || 'Multiple Apps';
        title = e.appNames.join(', ') || 'Mixed Apps';
      }

      if (!groups[key]) {
        groups[key] = { title, entries: [], color };
      }
      groups[key].entries.push(e);
    });

    return Object.values(groups);
  }, [filteredEntries, groupBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Time */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Work Logged
            </span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {ExporterService.formatDuration(totalMinutes)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({ExporterService.formatDecimalHours(totalMinutes)} hrs)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across {filteredEntries.length} consolidated timesheet blocks
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-cyan-500 opacity-60" />
        </div>

        {/* Billable Time */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Billable Hours
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {ExporterService.formatDuration(billableMinutes)}
            </span>
            <span className="text-xs text-slate-400">
              ({totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0}% of total)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {ExporterService.formatDuration(totalMinutes - billableMinutes)} non-billable / admin
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-60" />
        </div>

        {/* Total Value */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Billable Value
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300 font-mono">
              ${totalEarnings.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Avg rate: ${(totalEarnings / Math.max(0.1, billableMinutes / 60)).toFixed(0)}/hr
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 opacity-60" />
        </div>

        {/* Tracked Apps */}
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Apps Today
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{uniqueAppsCount}</span>
            <span className="text-xs text-slate-400">applications</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {apps
              .filter((a) => a.isEnabled)
              .slice(0, 4)
              .map((app) => (
                <span
                  key={app.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mr-1"
                    style={{ backgroundColor: app.color }}
                  />
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, window titles, apps, or projects..."
              className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Project Filter */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Billable Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-0.5 text-xs">
            <button
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
              className="appearance-none bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="none">Group: Chronological</option>
              <option value="project">Group: By Project</option>
              <option value="client">Group: By Client</option>
              <option value="app">Group: By App</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
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
              onClick={onRefreshConsolidation}
              title="Re-run smart consolidation algorithm"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Re-consolidate</span>
            </button>

            <button
              onClick={handleCopyAllForTimesheet}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                copiedAll
                  ? 'bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                  : 'bg-brand-600/20 hover:bg-brand-600/30 text-brand-700 dark:text-brand-300 border-brand-500/30'
              }`}
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Copied Timesheet!' : '1-Click Copy for Timesheet'}</span>
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
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <h3 className="font-semibold text-sm text-slate-200">{section.title}</h3>
                  <span className="text-xs text-slate-500">
                    ({section.entries.length} sessions)
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-300">
                  {ExporterService.formatDuration(
                    section.entries.reduce((a, b) => a + b.roundedMinutes, 0)
                  )}
                </div>
              </div>
            )}

            {/* Timesheet Entries List */}
            {section.entries.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex p-4 rounded-full bg-slate-900 text-slate-500 mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">No activity recorded for this day</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Start tracking in the top bar, enable background monitoring, or click "Log Time" to add a manual entry.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={onOpenManualEntry}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Time Manually</span>
                  </button>
                  <button
                    onClick={onRefreshConsolidation}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Load Demo Workday</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {section.entries.map((entry) => {
                  const isExpanded = !!expandedDetails[entry.id];
                  const isCopied = copiedId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="p-4 hover:bg-slate-900/60 transition group flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Left: Time, Project, Client, and Description */}
                        <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                          {/* Time range badge */}
                          <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 min-w-[90px]">
                            <span className="font-mono text-xs font-bold text-slate-200">
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
                                <span
                                  className="w-2 h-2 rounded-full mr-1.5"
                                  style={{ backgroundColor: entry.color || '#3b82f6' }}
                                />
                                {entry.clientName} › {entry.projectName}
                              </span>

                              {/* Billable Tag */}
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                  entry.isBillable
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {entry.isBillable ? `Billable ($${entry.hourlyRate}/h)` : 'Internal'}
                              </span>

                              {/* Manual vs Auto indicator */}
                              {entry.isManual && (
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                                  Manual
                                </span>
                              )}
                            </div>

                            {/* Consolidated Work Description */}
                            <p className="text-sm font-medium text-slate-100 leading-snug">
                              {entry.description}
                            </p>

                            {/* Tracked Apps List */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[11px] text-slate-500">Apps:</span>
                              {entry.appNames.map((appName, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-950 text-slate-300 border border-slate-800"
                                >
                                  {appName}
                                </span>
                              ))}

                              {/* Expand Window Titles details toggle */}
                              {entry.details && entry.details.length > 0 && (
                                <button
                                  onClick={() => toggleExpand(entry.id)}
                                  className="text-[11px] text-brand-400 hover:text-brand-300 ml-2 font-medium inline-flex items-center gap-0.5"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronDown className="w-3 h-3" /> Hide breakdown
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="w-3 h-3" /> {entry.details.length} sub-tasks / window logs
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Duration & Actions */}
                        <div className="flex items-center gap-4">
                          {/* Duration Display */}
                          <div className="text-right">
                            <div className="font-mono text-base font-bold text-white">
                              {ExporterService.formatDuration(entry.roundedMinutes)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {entry.isBillable ? `$${entry.billableAmount.toFixed(2)}` : 'Non-billable'}
                              {settings.roundingIncrement > 0 && (
                                <span className="ml-1 text-slate-600">
                                  (raw: {ExporterService.formatDuration(entry.durationMinutes)})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            {/* Copy for Timesheet */}
                            <button
                              onClick={() => handleCopySingle(entry)}
                              title="Copy timesheet row"
                              className={`p-2 rounded-lg border transition ${
                                isCopied
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                              }`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditEntry(entry)}
                              title="Edit Entry"
                              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              title="Delete Entry"
                              className="p-2 rounded-lg bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Sub-Tasks & Windows Breakdown */}
                      {isExpanded && entry.details && (
                        <div className="mt-2 ml-12 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 animate-fade-in">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Detailed Window Titles & Activity Trace
                          </span>
                          <ul className="space-y-1">
                            {entry.details.map((d, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-brand-400 mt-0.5">•</span>
                                <span className="font-mono text-[11px] text-slate-300">{d}</span>
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
