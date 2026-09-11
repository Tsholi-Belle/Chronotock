import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  GitCommit, 
  GitBranch, 
  ArrowDownToLine, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  FolderGit2, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GitHubActivityItem, Project, Client, TimesheetEntry } from '../types';
import { GitHubService } from '../services/github';
import { ExporterService } from '../services/exporter';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  clients: Client[];
  selectedDate: string;
  onImportEntries: (entries: TimesheetEntry[]) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  projects,
  clients,
  selectedDate,
  onImportEntries,
}) => {
  const [username, setUsername] = useState('Tsholi-Belle');
  const [repo, setRepo] = useState('Tsholi-Belle/Chronotock');
  const [token, setToken] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [items, setItems] = useState<GitHubActivityItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'pull_request' | 'commit' | 'push'>('all');

  // Fetch initial activity on open
  useEffect(() => {
    if (isOpen) {
      handleFetch();
    }
  }, [isOpen]);

  const handleFetch = async () => {
    setIsLoading(true);
    setImportedSuccess(false);
    try {
      const data = await GitHubService.fetchRecentActivity(username, repo, token);
      setItems(data);
      // Select all by default
      setSelectedItemIds(data.map((i) => i.id));
    } catch (e) {
      console.error('Failed to fetch GitHub activity:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const targetProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const targetClient = clients.find((c) => c.id === targetProject?.clientId) || clients[0];

  const handleImport = () => {
    const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
    if (selectedItems.length === 0) return;

    const newEntries: TimesheetEntry[] = selectedItems.map((item) =>
      GitHubService.convertToTimesheetEntry(item, targetProject, targetClient, selectedDate)
    );

    onImportEntries(newEntries);
    setImportedSuccess(true);
    setTimeout(() => {
      setImportedSuccess(false);
      onClose();
    }, 1000);
  };

  const totalSelectedMinutes = items
    .filter((i) => selectedItemIds.includes(i.id))
    .reduce((a, b) => a + (b.estimatedDurationMinutes || 45), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-scale-in max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-md">
              <FolderGit2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">GitHub PR & Commit Sync</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pull your pull requests, pushes, and commits directly into your timesheet.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Username */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">GitHub Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Tsholi-Belle"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Repository */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Repository</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. Tsholi-Belle/Chronotock"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Map to Project */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Assign to Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:ring-1 focus:ring-brand-500"
              >
                {projects.map((p) => {
                  const c = clients.find((cli) => cli.id === p.clientId);
                  return (
                    <option key={p.id} value={p.id}>
                      {c ? `${c.name} › ` : ''}{p.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  filterType === 'all' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilterType('pull_request')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  filterType === 'pull_request'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PRs ({items.filter((i) => i.type === 'pull_request').length})
              </button>
              <button
                onClick={() => setFilterType('commit')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  filterType === 'commit'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Commits ({items.filter((i) => i.type === 'commit').length})
              </button>
              <button
                onClick={() => setFilterType('push')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  filterType === 'push'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pushes ({items.filter((i) => i.type === 'push').length})
              </button>
            </div>

            {/* Fetch Button */}
            <button
              onClick={handleFetch}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching GitHub...' : 'Refresh Activity'}</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 min-h-[220px] max-h-[360px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No recent GitHub activity found for {repo}.</p>
              <button
                onClick={handleFetch}
                className="text-brand-400 hover:underline font-semibold"
              >
                Click to retry or pull mock demo items
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3 hover:bg-slate-900/80 transition cursor-pointer flex items-start gap-3 text-xs ${
                    isSelected ? 'bg-slate-900/40' : 'opacity-60'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 rounded border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />

                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 mt-0.5">
                    {item.type === 'pull_request' ? (
                      <GitPullRequest className="w-4 h-4 text-purple-400" />
                    ) : item.type === 'commit' ? (
                      <GitCommit className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <GitBranch className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                          item.type === 'pull_request'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : item.type === 'commit'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.type.replace('_', ' ')}
                      </span>

                      {item.status && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{item.status}]
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-100 text-xs">{item.title}</h4>
                    <p className="text-slate-400 text-[11px] truncate font-mono">{item.message}</p>
                  </div>

                  {/* Right Actions & Duration */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                    <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {ExporterService.formatDuration(item.estimatedDurationMinutes)}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 hover:text-brand-400 flex items-center gap-0.5 text-[10px]"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-brand-400 hover:underline font-medium"
            >
              {selectedItemIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-slate-400">
              Selected: <strong className="text-white">{selectedItemIds.length}</strong> items (
              {ExporterService.formatDuration(totalSelectedMinutes)})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedItemIds.length === 0}
              onClick={handleImport}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition shadow-md ${
                importedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-900/30 disabled:opacity-50'
              }`}
            >
              {importedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Imported into Timesheet!</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Import ({selectedItemIds.length}) to {selectedDate}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
