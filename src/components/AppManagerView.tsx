import React, { useState } from 'react';
import { 
  Grid, 
  Plus, 
  Search, 
  Check, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Code, 
  Globe, 
  MessageSquare, 
  FileText, 
  Video, 
  Cpu, 
  BookOpen, 
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { TrackedApp, AppCategory, Project } from '../types';

interface AppManagerViewProps {
  apps: TrackedApp[];
  projects: Project[];
  onToggleApp: (id: string) => void;
  onAddApp: (app: TrackedApp) => void;
  onUpdateApp: (app: TrackedApp) => void;
  onDeleteApp: (id: string) => void;
}

const CATEGORIES: { id: AppCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'development', label: 'Development' },
  { id: 'browsing', label: 'Browsing / Research' },
  { id: 'design', label: 'Design & UI' },
  { id: 'communication', label: 'Communication' },
  { id: 'productivity', label: 'Productivity & Notes' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'writing', label: 'Writing & Docs' },
];

export const AppManagerView: React.FC<AppManagerViewProps> = ({
  apps,
  projects,
  onToggleApp,
  onAddApp,
  onUpdateApp,
  onDeleteApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New App Form State
  const [newAppName, setNewAppName] = useState('');
  const [newAppShortName, setNewAppShortName] = useState('');
  const [newAppProcess, setNewAppProcess] = useState('');
  const [newAppCategory, setNewAppCategory] = useState<AppCategory>('development');
  const [newAppColor, setNewAppColor] = useState('#3b82f6');
  const [newAppProjectId, setNewAppProjectId] = useState<string>(projects[0]?.id || '');
  const [newAppBillable, setNewAppBillable] = useState(true);

  const filteredApps = apps.filter((app) => {
    if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.shortName.toLowerCase().includes(q) ||
        app.processNames.some((p) => p.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    const newApp: TrackedApp = {
      id: `app-${Date.now()}`,
      name: newAppName.trim(),
      shortName: newAppShortName.trim() || newAppName.trim(),
      bundleId: `custom.${newAppName.toLowerCase().replace(/\s+/g, '')}`,
      processNames: newAppProcess ? newAppProcess.split(',').map((p) => p.trim()) : [newAppName.trim()],
      category: newAppCategory,
      icon: 'Grid',
      color: newAppColor,
      isEnabled: true,
      defaultProjectId: newAppProjectId,
      defaultBillable: newAppBillable,
      createdAt: new Date().toISOString(),
    };

    onAddApp(newApp);
    setShowAddModal(false);
    // Reset
    setNewAppName('');
    setNewAppShortName('');
    setNewAppProcess('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-brand-400" />
            Tracked Applications Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure which applications ChronoTrack monitors. Enable, disable, or map apps to default projects.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-900/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom App</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => {
          const defaultProj = projects.find((p) => p.id === app.defaultProjectId);

          return (
            <div
              key={app.id}
              className={`glass-panel p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                app.isEnabled
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-900/70'
                  : 'border-slate-200/60 dark:border-slate-900/60 opacity-60 bg-slate-100/40 dark:bg-slate-950/40'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Icon, Name, and Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.shortName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{app.name}</h3>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">
                        {app.category}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => onToggleApp(app.id)}
                    title={app.isEnabled ? 'Disable Tracking' : 'Enable Tracking'}
                    className="p-1 rounded-lg hover:bg-slate-800 transition"
                  >
                    {app.isEnabled ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tracked
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-700">
                        Disabled
                      </span>
                    )}
                  </button>
                </div>

                {/* Details / Default Project Mapping */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Default Project:</span>
                    <span className="font-medium text-slate-200">
                      {defaultProj ? defaultProj.name : 'Auto / Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Billing Status:</span>
                    <span
                      className={`font-semibold ${
                        app.defaultBillable ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {app.defaultBillable ? 'Billable ($)' : 'Non-Billable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Process Matches:</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                      {app.processNames.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800/40">
                <button
                  onClick={() => onDeleteApp(app.id)}
                  title="Remove App"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Custom App to Track</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Application Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Postman, Blender, Obsidian"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Short Name</label>
                <input
                  type="text"
                  placeholder="e.g. Postman"
                  value={newAppShortName}
                  onChange={(e) => setNewAppShortName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Process / Executable Names</label>
                <input
                  type="text"
                  placeholder="e.g. Postman, Postman Helper (comma separated)"
                  value={newAppProcess}
                  onChange={(e) => setNewAppProcess(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newAppCategory}
                    onChange={(e) => setNewAppCategory(e.target.value as AppCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="development">Development</option>
                    <option value="browsing">Browsing</option>
                    <option value="design">Design</option>
                    <option value="communication">Communication</option>
                    <option value="productivity">Productivity</option>
                    <option value="meetings">Meetings</option>
                    <option value="writing">Writing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Accent Color</label>
                  <input
                    type="color"
                    value={newAppColor}
                    onChange={(e) => setNewAppColor(e.target.value)}
                    className="w-full h-9 bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Default Project</label>
                <select
                  value={newAppProjectId}
                  onChange={(e) => setNewAppProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newBillable"
                  checked={newAppBillable}
                  onChange={(e) => setNewAppBillable(e.target.checked)}
                  className="rounded border-slate-800 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="newBillable" className="text-slate-300 font-medium cursor-pointer">
                  Default as Billable Work
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition shadow-md shadow-brand-900/30"
                >
                  Add Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
