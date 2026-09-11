import React from 'react';
import { 
  Clock, 
  Layers, 
  Calendar, 
  Grid, 
  Sliders, 
  BarChart3, 
  Settings, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Radio,
  CheckCircle2,
  FolderGit2,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
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
  onToggleTheme: () => void;
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
  onToggleTheme,
  settings,
  daemonConnected,
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

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'timesheet', label: 'Timesheet', icon: <Clock className="w-4 h-4" /> },
    { id: 'timeline', label: 'Day Timeline', icon: <Layers className="w-4 h-4" /> },
    { id: 'apps', label: 'Tracked Apps', icon: <Grid className="w-4 h-4" /> },
    { id: 'rules', label: 'Rules & Mapping', icon: <Sliders className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const getThemeIcon = () => {
    if (settings.theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    if (settings.theme === 'dark') return <Moon className="w-4 h-4 text-brand-400" />;
    return <Laptop className="w-4 h-4 text-slate-400" />;
  };

  const getThemeTitle = () => {
    if (settings.theme === 'light') return 'Light Theme (Click to toggle)';
    if (settings.theme === 'dark') return 'Dark Theme (Click to toggle)';
    return 'System Theme (Click to toggle)';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-lg shadow-brand-500/20 text-white font-bold">
              <Clock className="w-5 h-5" />
              {isTracking && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  ChronoTrack
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  Timesheet AI
                </span>
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
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions & Date Navigator */}
          <div className="flex items-center gap-3">
            {/* Date Picker Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-2">
                <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{formattedDate}</span>
                {!isToday && (
                  <button
                    onClick={handleToday}
                    className="ml-1 text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    (Today)
                  </button>
                )}
              </div>
              <button
                onClick={handleNextDay}
                title="Next Day"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Manual Entry Button */}
            <button
              onClick={onOpenManualEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Log Time</span>
            </button>

            {/* GitHub Sync Button */}
            <button
              onClick={onOpenGitHubSync}
              title="Pull GitHub Pull Requests & Commits"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-slate-900 hover:bg-purple-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-300 dark:border-purple-500/30 shadow-sm transition"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>GitHub Sync</span>
            </button>

            {/* Export Timesheet Button */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Quick Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={getThemeTitle()}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {getThemeIcon()}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Settings & Preferences"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

