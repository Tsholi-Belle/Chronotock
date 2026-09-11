import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Terminal, 
  Save, 
  RotateCcw, 
  Upload, 
  Download, 
  Check, 
  ShieldCheck,
  Cpu,
  Info,
  DollarSign,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { TimesheetSettings, RoundingIncrement, RoundingMethod, ThemeMode } from '../types';
import { StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimesheetSettings;
  onSaveSettings: (settings: TimesheetSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<TimesheetSettings>(settings);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronotrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importAllData(content);
        if (success) {
          window.location.reload();
        } else {
          alert('Failed to import backup file. Invalid format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('npm run server & npm run tracker');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'dark', label: 'Dark Theme', icon: <Moon className="w-4 h-4 text-brand-400" />, desc: 'High contrast dark background' },
    { id: 'light', label: 'Light Theme', icon: <Sun className="w-4 h-4 text-amber-500" />, desc: 'Clean bright layout' },
    { id: 'system', label: 'System Default', icon: <Laptop className="w-4 h-4 text-slate-400" />, desc: 'Follow OS preferences' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ChronoTrack Preferences</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure theme, rounding, billing rates, and OS tracker.</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Appearance & Theme Selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              <Sun className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Appearance & Interface Theme
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => {
                const isSelected = formData.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: t.id })}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2 font-semibold">
                        {t.icon}
                        <span>{t.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              User Profile & Timesheet Sign-off
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.userFullName}
                  onChange={(e) => setFormData({ ...formData, userFullName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Role / Job Title</label>
                <input
                  type="text"
                  value={formData.userRole}
                  onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Rounding & Billing */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              Timesheet Rounding & Consolidation
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Default Rounding Increment</label>
                <select
                  value={formData.roundingIncrement}
                  onChange={(e) =>
                    setFormData({ ...formData, roundingIncrement: Number(e.target.value) as RoundingIncrement })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                >
                  <option value={0}>Exact Duration (0 min)</option>
                  <option value={5}>Nearest 5 Minutes</option>
                  <option value={15}>Nearest 15 Minutes (Corporate Standard)</option>
                  <option value={30}>Nearest 30 Minutes</option>
                  <option value={60}>Nearest 1 Hour</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Rounding Calculation Method</label>
                <select
                  value={formData.roundingMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, roundingMethod: e.target.value as RoundingMethod })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="nearest">Round to Nearest (e.g. 7m &rarr; 0m or 8m &rarr; 15m)</option>
                  <option value="ceil">Always Round Up (e.g. 1m &rarr; 15m)</option>
                  <option value="floor">Always Round Down</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Default Rate ($/hr)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.defaultHourlyRate}
                  onChange={(e) => setFormData({ ...formData, defaultHourlyRate: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Consolidation Gap (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.consolidationGapMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, consolidationGapMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* macOS Background Tracking Daemon Guide */}
          <div className="p-4 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                macOS Native Background Tracker Daemon
              </h4>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Ready to Run
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              To automatically capture your active frontmost application and window titles across macOS in the background, run the local daemon in your terminal:
            </p>

            <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
              <code>npm run server & npm run tracker</code>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white ml-2 flex items-center gap-1 font-sans"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : 'Copy'}
              </button>
            </div>
          </div>

          {/* Backup & Reset Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </button>

              <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={onResetData}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Demo Data</span>
            </button>
          </div>

          {/* Form Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md shadow-brand-900/30 transition"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

