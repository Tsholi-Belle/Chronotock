import React from 'react';
import { ActiveTab, TimesheetSettings } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isTracking: boolean;
  onOpenManualEntry: () => void;
  onOpenExport: () => void;
  onOpenGitHubSync: () => void;
  onOpenSettings: () => void;
  settings: TimesheetSettings;
  daemonConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  isTracking,
  onOpenManualEntry,
  onOpenExport,
  onOpenGitHubSync,
  onOpenSettings,
}) => {
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'timesheet', label: 'Timesheet' },
    { id: 'timeline', label: 'Day Timeline' },
    { id: 'apps', label: 'Tracked Apps' },
    { id: 'rules', label: 'Rules & Mapping' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-md text-white font-bold text-sm">
              CT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  ChronoTrack
                </span>
                {isTracking && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Multi-App Work Consolidator</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions & Date Navigator */}
          <div className="flex items-center gap-2.5">
            {/* Date Picker Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={handlePrevDay}
                title="Previous Day"
                className="px-1.5 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition font-mono"
              >
                &larr;
              </button>
              <div className="flex items-center gap-1 px-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">{formattedDate}</span>
                {!isToday && (
                  <button
                    type="button"
                    onClick={handleToday}
                    className="ml-1 text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Today
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                title="Next Day"
                className="px-1.5 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition font-mono"
              >
                &rarr;
              </button>
            </div>

            {/* Manual Entry Button */}
            <button
              type="button"
              onClick={onOpenManualEntry}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              Log Time
            </button>

            {/* GitHub Sync Button */}
            <button
              type="button"
              onClick={onOpenGitHubSync}
              title="Pull GitHub Pull Requests & Commits"
              className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-slate-900 hover:bg-purple-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-300 dark:border-purple-500/30 shadow-sm transition"
            >
              GitHub Sync
            </button>

            {/* Export Timesheet Button */}
            <button
              type="button"
              onClick={onOpenExport}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
            >
              Export
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Settings, Theme & Preferences"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
