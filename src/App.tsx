import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ActiveTab, 
  TrackedApp, 
  Client, 
  Project, 
  ActivityLog, 
  TimesheetEntry, 
  CategorizationRule, 
  TimesheetSettings 
} from './types';
import { StorageService, formatDateKey, generateSeedActivityLogs } from './services/storage';
import { ConsolidationEngine } from './services/consolidation';
import { Navbar } from './components/Navbar';
import { LiveTrackerBar } from './components/LiveTrackerBar';
import { TimesheetView } from './components/TimesheetView';
import { TimelineView } from './components/TimelineView';
import { AppManagerView } from './components/AppManagerView';
import { RulesManagerView } from './components/RulesManagerView';
import { AnalyticsView } from './components/AnalyticsView';
import { ManualEntryModal } from './components/ManualEntryModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // App State
  const [activeTab, setActiveTab] = useState<ActiveTab>('timesheet');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
  
  const [apps, setApps] = useState<TrackedApp[]>(() => StorageService.getApps());
  const [clients, setClients] = useState<Client[]>(() => StorageService.getClients());
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  const [rules, setRules] = useState<CategorizationRule[]>(() => StorageService.getRules());
  const [settings, setSettings] = useState<TimesheetSettings>(() => StorageService.getSettings());
  const [logs, setLogs] = useState<ActivityLog[]>(() => StorageService.getActivityLogs());
  const [manualEntries, setManualEntries] = useState<TimesheetEntry[]>(() => StorageService.getTimesheets());

  // Live Tracking State
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const [activeAppId, setActiveAppId] = useState<string>(apps[0]?.id || 'app-vscode');
  const [currentTaskTitle, setCurrentTaskTitle] = useState<string>('App.tsx — timesheet-tracker');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj-1');
  const [isBillable, setIsBillable] = useState<boolean>(true);
  const [daemonConnected, setDaemonConnected] = useState<boolean>(false);

  // Modals
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);

  // Auto-consolidate logs into timesheet entries
  const consolidatedEntries = useMemo(() => {
    const autoEntries = ConsolidationEngine.consolidateLogs(
      logs,
      apps,
      projects,
      clients,
      settings
    );
    // Combine auto-consolidated entries with user manual overrides
    return [...autoEntries, ...manualEntries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [logs, apps, projects, clients, settings, manualEntries]);

  // Today's total logged minutes for live tracker
  const todayDurationMinutes = useMemo(() => {
    return consolidatedEntries
      .filter((e) => e.date === selectedDate)
      .reduce((a, b) => a + b.roundedMinutes, 0);
  }, [consolidatedEntries, selectedDate]);

  // Save changes to storage
  useEffect(() => {
    StorageService.saveApps(apps);
  }, [apps]);

  useEffect(() => {
    StorageService.saveRules(rules);
  }, [rules]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    StorageService.saveActivityLogs(logs);
  }, [logs]);

  useEffect(() => {
    StorageService.saveTimesheets(manualEntries);
  }, [manualEntries]);

  // Optional sync with local companion daemon at http://localhost:3150
  useEffect(() => {
    let poller: NodeJS.Timeout | null = null;

    const checkDaemon = async () => {
      try {
        const res = await fetch('http://localhost:3150/api/status');
        if (res.ok) {
          const data = await res.json();
          setDaemonConnected(true);
          if (data.detectedActiveWindow && data.detectedActiveWindow.appName) {
            const detectedApp = apps.find(
              (a) =>
                a.name.toLowerCase() === data.detectedActiveWindow.appName.toLowerCase() ||
                a.processNames.some(
                  (p) => p.toLowerCase() === data.detectedActiveWindow.appName.toLowerCase()
                )
            );
            if (detectedApp) {
              setActiveAppId(detectedApp.id);
            }
            if (data.detectedActiveWindow.windowTitle) {
              setCurrentTaskTitle(data.detectedActiveWindow.windowTitle);
            }
          }
        } else {
          setDaemonConnected(false);
        }
      } catch {
        setDaemonConnected(false);
      }
    };

    poller = setInterval(checkDaemon, 3000);
    checkDaemon();

    return () => {
      if (poller) clearInterval(poller);
    };
  }, [apps]);

  // Handler: Log new activity session
  const handleLogSession = useCallback((newLogData: Partial<ActivityLog>) => {
    const fullLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      appId: newLogData.appId || activeAppId,
      appName: newLogData.appName || 'Active Application',
      windowTitle: newLogData.windowTitle || 'Active Session',
      startTime: newLogData.startTime || new Date().toISOString(),
      endTime: newLogData.endTime || new Date().toISOString(),
      durationSeconds: newLogData.durationSeconds || 60,
      projectId: newLogData.projectId || selectedProjectId,
      clientId: newLogData.clientId || clients[0]?.id,
      isBillable: newLogData.isBillable !== undefined ? newLogData.isBillable : true,
      date: newLogData.date || selectedDate,
    };

    // Apply smart rules
    const ruleMatch = ConsolidationEngine.applyRulesToLog(
      fullLog,
      rules,
      apps,
      projects,
      clients
    );
    if (ruleMatch.projectId) fullLog.projectId = ruleMatch.projectId;
    if (ruleMatch.clientId) fullLog.clientId = ruleMatch.clientId;
    if (ruleMatch.isBillable !== undefined) fullLog.isBillable = ruleMatch.isBillable;

    setLogs((prev) => [...prev, fullLog]);
  }, [activeAppId, selectedProjectId, clients, selectedDate, rules, apps, projects]);

  // App handlers
  const handleToggleApp = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, isEnabled: !a.isEnabled } : a))
    );
  };

  const handleAddApp = (newApp: TrackedApp) => {
    setApps((prev) => [...prev, newApp]);
  };

  const handleUpdateApp = (updatedApp: TrackedApp) => {
    setApps((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
  };

  const handleDeleteApp = (appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
  };

  // Rule handlers
  const handleAddRule = (newRule: CategorizationRule) => {
    setRules((prev) => [...prev, newRule]);
  };

  const handleUpdateRule = (updatedRule: CategorizationRule) => {
    setRules((prev) => prev.map((r) => (r.id === updatedRule.id ? updatedRule : r)));
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  };

  // Timesheet entry handlers
  const handleSaveTimesheetEntry = (entry: TimesheetEntry) => {
    if (entry.isManual) {
      setManualEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        return [...prev, entry];
      });
    } else {
      // If editing an auto-consolidated entry, convert to manual override
      setManualEntries((prev) => [...prev.filter((e) => e.id !== entry.id), { ...entry, isManual: true }]);
    }
  };

  const handleDeleteTimesheetEntry = (id: string) => {
    setManualEntries((prev) => prev.filter((e) => e.id !== id));
    // Also remove any raw logs matching this ID if auto-consolidated
    const targetAuto = consolidatedEntries.find((e) => e.id === id);
    if (targetAuto && targetAuto.rawLogIds) {
      setLogs((prev) => prev.filter((l) => !targetAuto.rawLogIds.includes(l.id)));
    }
  };

  const handleEditEntry = (entry: TimesheetEntry) => {
    setEditingEntry(entry);
    setShowManualModal(true);
  };

  const handleResetData = () => {
    if (confirm('Reset all tracked applications, rules, and activity logs to standard demo data?')) {
      StorageService.clearAllData();
      window.location.reload();
    }
  };

  const handleRefreshConsolidation = () => {
    // Re-trigger consolidation by creating a fresh state reference
    setLogs([...logs]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-brand-500/30 selection:text-brand-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isTracking={isTracking}
        onOpenManualEntry={() => {
          setEditingEntry(null);
          setShowManualModal(true);
        }}
        onOpenExport={() => setShowExportModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        settings={settings}
        daemonConnected={daemonConnected}
      />

      {/* Live Active Tracker Bar */}
      <LiveTrackerBar
        isTracking={isTracking}
        setIsTracking={setIsTracking}
        apps={apps}
        projects={projects}
        clients={clients}
        activeAppId={activeAppId}
        setActiveAppId={setActiveAppId}
        currentTaskTitle={currentTaskTitle}
        setCurrentTaskTitle={setCurrentTaskTitle}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        isBillable={isBillable}
        setIsBillable={setIsBillable}
        onLogSession={handleLogSession}
        todayDurationMinutes={todayDurationMinutes}
      />

      {/* Main View Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'timesheet' && (
          <TimesheetView
            entries={consolidatedEntries}
            projects={projects}
            clients={clients}
            apps={apps}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings({ ...settings, ...newSettings })}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteTimesheetEntry}
            onOpenManualEntry={() => {
              setEditingEntry(null);
              setShowManualModal(true);
            }}
            onOpenExport={() => setShowExportModal(true)}
            selectedDate={selectedDate}
            onRefreshConsolidation={handleRefreshConsolidation}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            logs={logs}
            apps={apps}
            projects={projects}
            clients={clients}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'apps' && (
          <AppManagerView
            apps={apps}
            projects={projects}
            onToggleApp={handleToggleApp}
            onAddApp={handleAddApp}
            onUpdateApp={handleUpdateApp}
            onDeleteApp={handleDeleteApp}
          />
        )}

        {activeTab === 'rules' && (
          <RulesManagerView
            rules={rules}
            apps={apps}
            projects={projects}
            clients={clients}
            onAddRule={handleAddRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            entries={consolidatedEntries}
            logs={logs}
            apps={apps}
            projects={projects}
            clients={clients}
          />
        )}
      </main>

      {/* Modals */}
      <ManualEntryModal
        isOpen={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveTimesheetEntry}
        initialEntry={editingEntry}
        projects={projects}
        clients={clients}
        apps={apps}
        selectedDate={selectedDate}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entries={consolidatedEntries}
        settings={settings}
        selectedDate={selectedDate}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onResetData={handleResetData}
      />
    </div>
  );
};
