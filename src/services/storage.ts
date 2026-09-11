import { 
  TrackedApp, 
  Client, 
  Project, 
  ActivityLog, 
  TimesheetEntry, 
  CategorizationRule, 
  TimesheetSettings 
} from '../types';

const STORAGE_KEYS = {
  APPS: 'chronotrack_apps',
  CLIENTS: 'chronotrack_clients',
  PROJECTS: 'chronotrack_projects',
  LOGS: 'chronotrack_logs',
  TIMESHEETS: 'chronotrack_timesheets',
  RULES: 'chronotrack_rules',
  SETTINGS: 'chronotrack_settings',
};

export const DEFAULT_SETTINGS: TimesheetSettings = {
  theme: 'dark',
  roundingIncrement: 15,
  roundingMethod: 'nearest',
  minimumSessionSeconds: 15,
  idleTimeoutMinutes: 5,
  consolidationGapMinutes: 15,
  defaultHourlyRate: 85,
  currency: 'USD',
  workDayStart: '09:00',
  workDayEnd: '17:30',
  autoConsolidate: true,
  daemonPort: 3150,
  userFullName: 'Alex Mercer',
  userRole: 'Senior Fullstack Engineer',
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Global',
    code: 'ACME',
    color: '#3b82f6', // Blue
    hourlyRate: 110,
    currency: 'USD',
  },
  {
    id: 'client-2',
    name: 'TechFlow Systems',
    code: 'TFS',
    color: '#10b981', // Emerald
    hourlyRate: 95,
    currency: 'USD',
  },
  {
    id: 'client-3',
    name: 'Nexus Interactive',
    code: 'NXS',
    color: '#8b5cf6', // Violet
    hourlyRate: 120,
    currency: 'USD',
  },
  {
    id: 'client-internal',
    name: 'Internal / Self',
    code: 'INT',
    color: '#64748b', // Slate
    hourlyRate: 0,
    currency: 'USD',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    clientId: 'client-1',
    name: 'E-Commerce Checkout Revamp',
    code: 'ACME-PAY',
    color: '#3b82f6',
    isBillableDefault: true,
    hourlyRate: 110,
    description: 'Modernizing payment flow, cart validation, and Stripe integration.',
  },
  {
    id: 'proj-2',
    clientId: 'client-2',
    name: 'Cloud API & Microservices',
    code: 'TFS-API',
    color: '#10b981',
    isBillableDefault: true,
    hourlyRate: 95,
    description: 'Building high-throughput Go/Node services and Redis caching layer.',
  },
  {
    id: 'proj-3',
    clientId: 'client-3',
    name: 'Design System & UI Components',
    code: 'NXS-DS',
    color: '#8b5cf6',
    isBillableDefault: true,
    hourlyRate: 120,
    description: 'Creating accessible Figma library and React Tailwind components.',
  },
  {
    id: 'proj-admin',
    clientId: 'client-internal',
    name: 'Team Sync, Admin & Planning',
    code: 'ADMIN',
    color: '#64748b',
    isBillableDefault: false,
    hourlyRate: 0,
    description: 'Daily standups, email, billing, code reviews, and quarterly planning.',
  },
  {
    id: 'proj-learning',
    clientId: 'client-internal',
    name: 'Research & Skill Development',
    code: 'R&D',
    color: '#f59e0b',
    isBillableDefault: false,
    hourlyRate: 0,
    description: 'AI prototyping, documentation reading, architectural exploration.',
  },
];

export const INITIAL_TRACKED_APPS: TrackedApp[] = [
  {
    id: 'app-antigravity',
    name: 'Google Antigravity',
    shortName: 'Antigravity',
    bundleId: 'com.google.antigravity',
    processNames: ['Antigravity', 'agy', 'antigravity-helper', 'Electron'],
    category: 'development',
    icon: 'Sparkles',
    color: '#8B5CF6',
    isEnabled: true,
    defaultProjectId: 'proj-1',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-github',
    name: 'GitHub (PRs & Commits)',
    shortName: 'GitHub',
    bundleId: 'com.github.GitHubClient',
    processNames: ['GitHub Desktop', 'GitHub', 'git'],
    category: 'development',
    icon: 'GitPullRequest',
    color: '#24292e',
    isEnabled: true,
    defaultProjectId: 'proj-1',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-vscode',
    name: 'Visual Studio Code',
    shortName: 'VS Code',
    bundleId: 'com.microsoft.VSCode',
    processNames: ['Code', 'Code Helper', 'Electron'],
    category: 'development',
    icon: 'Code',
    color: '#007ACC',
    isEnabled: true,
    defaultProjectId: 'proj-1',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-chrome',
    name: 'Google Chrome',
    shortName: 'Chrome',
    bundleId: 'com.google.Chrome',
    processNames: ['Google Chrome', 'Google Chrome Helper'],
    category: 'browsing',
    icon: 'Globe',
    color: '#4285F4',
    isEnabled: true,
    defaultProjectId: 'proj-1',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-figma',
    name: 'Figma',
    shortName: 'Figma',
    bundleId: 'com.figma.Desktop',
    processNames: ['Figma', 'Figma Helper'],
    category: 'design',
    icon: 'Figma',
    color: '#F24E1E',
    isEnabled: true,
    defaultProjectId: 'proj-3',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-terminal',
    name: 'Terminal / iTerm2',
    shortName: 'Terminal',
    bundleId: 'com.apple.Terminal',
    processNames: ['Terminal', 'iTerm2', 'zsh', 'bash'],
    category: 'development',
    icon: 'Terminal',
    color: '#4ADE80',
    isEnabled: true,
    defaultProjectId: 'proj-2',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-slack',
    name: 'Slack',
    shortName: 'Slack',
    bundleId: 'com.tinyspeck.slackmacgap',
    processNames: ['Slack', 'Slack Helper'],
    category: 'communication',
    icon: 'MessageSquare',
    color: '#E01E5A',
    isEnabled: true,
    defaultProjectId: 'proj-admin',
    defaultBillable: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-notion',
    name: 'Notion',
    shortName: 'Notion',
    bundleId: 'notion.id',
    processNames: ['Notion', 'Notion Helper'],
    category: 'productivity',
    icon: 'FileText',
    color: '#FFFFFF',
    isEnabled: true,
    defaultProjectId: 'proj-admin',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-zoom',
    name: 'Zoom Workplace',
    shortName: 'Zoom',
    bundleId: 'us.zoom.xos',
    processNames: ['zoom.us', 'Zoom'],
    category: 'meetings',
    icon: 'Video',
    color: '#2D8CFF',
    isEnabled: true,
    defaultProjectId: 'proj-admin',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-xcode',
    name: 'Xcode',
    shortName: 'Xcode',
    bundleId: 'com.apple.dt.Xcode',
    processNames: ['Xcode'],
    category: 'development',
    icon: 'Cpu',
    color: '#157EFB',
    isEnabled: false,
    defaultProjectId: 'proj-3',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-linear',
    name: 'Linear',
    shortName: 'Linear',
    bundleId: 'com.linear',
    processNames: ['Linear'],
    category: 'productivity',
    icon: 'CheckSquare',
    color: '#5E6AD2',
    isEnabled: true,
    defaultProjectId: 'proj-1',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-word',
    name: 'Microsoft Word',
    shortName: 'Word',
    bundleId: 'com.microsoft.Word',
    processNames: ['Microsoft Word'],
    category: 'writing',
    icon: 'BookOpen',
    color: '#2B579A',
    isEnabled: true,
    defaultProjectId: 'proj-admin',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-excel',
    name: 'Microsoft Excel',
    shortName: 'Excel',
    bundleId: 'com.microsoft.Excel',
    processNames: ['Microsoft Excel'],
    category: 'productivity',
    icon: 'Table',
    color: '#217346',
    isEnabled: true,
    defaultProjectId: 'proj-admin',
    defaultBillable: true,
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_RULES: CategorizationRule[] = [
  {
    id: 'rule-antigravity',
    name: 'Antigravity AI Pair Programming',
    isEnabled: true,
    appId: 'app-antigravity',
    matchField: 'windowTitle',
    matchType: 'contains',
    pattern: 'timesheet',
    targetProjectId: 'proj-1',
    targetClientId: 'client-1',
    isBillable: true,
    tag: 'AI Engineering',
  },
  {
    id: 'rule-1',
    name: 'ACME Payment Codebase',
    isEnabled: true,
    appId: 'app-vscode',
    matchField: 'windowTitle',
    matchType: 'contains',
    pattern: 'acme-checkout',
    targetProjectId: 'proj-1',
    targetClientId: 'client-1',
    isBillable: true,
    tag: 'Frontend Dev',
  },
  {
    id: 'rule-2',
    name: 'Stripe API & Docs',
    isEnabled: true,
    appId: 'app-chrome',
    matchField: 'windowTitle',
    matchType: 'contains',
    pattern: 'Stripe Documentation',
    targetProjectId: 'proj-1',
    targetClientId: 'client-1',
    isBillable: true,
    tag: 'Integration',
  },
  {
    id: 'rule-3',
    name: 'TechFlow Cloud Services',
    isEnabled: true,
    appId: '',
    matchField: 'windowTitle',
    matchType: 'contains',
    pattern: 'techflow-api',
    targetProjectId: 'proj-2',
    targetClientId: 'client-2',
    isBillable: true,
    tag: 'Backend Dev',
  },
  {
    id: 'rule-4',
    name: 'Nexus UI Kit Figma',
    isEnabled: true,
    appId: 'app-figma',
    matchField: 'windowTitle',
    matchType: 'contains',
    pattern: 'Nexus Design System v2',
    targetProjectId: 'proj-3',
    targetClientId: 'client-3',
    isBillable: true,
    tag: 'UI Design',
  },
  {
    id: 'rule-5',
    name: 'Client Standup on Zoom',
    isEnabled: true,
    appId: 'app-zoom',
    matchField: 'windowTitle',
    matchType: 'contains',
    pattern: 'Acme Weekly Standup',
    targetProjectId: 'proj-1',
    targetClientId: 'client-1',
    isBillable: true,
    tag: 'Meeting',
  },
];

// Helper to format ISO date into YYYY-MM-DD
export function formatDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeHHMM(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

// Generate realistic mock activity logs for today and yesterday
export function generateSeedActivityLogs(): ActivityLog[] {
  const logs: ActivityLog[] = [];
  const today = new Date();
  
  // Create sample entries for Today
  const createLog = (
    appId: string,
    appName: string,
    windowTitle: string,
    startHour: number,
    startMin: number,
    durationMins: number,
    projId: string,
    clientId: string,
    isBillable: boolean,
    dateOffset = 0,
    manualNote?: string
  ): ActivityLog => {
    const d = new Date(today);
    d.setDate(d.getDate() - dateOffset);
    d.setHours(startHour, startMin, 0, 0);
    const startIso = d.toISOString();
    
    const end = new Date(d.getTime() + durationMins * 60 * 1000);
    const endIso = end.toISOString();

    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      appId,
      appName,
      windowTitle,
      startTime: startIso,
      endTime: endIso,
      durationSeconds: durationMins * 60,
      projectId: projId,
      clientId: clientId,
      isBillable,
      manualNote,
      date: formatDateKey(d),
    };
  };

  // Today's logs
  logs.push(createLog('app-slack', 'Slack', '#general - Team announcements', 9, 0, 15, 'proj-admin', 'client-internal', false, 0, 'Morning standup updates'));
  logs.push(createLog('app-zoom', 'Zoom Workplace', 'Acme Weekly Standup (Sprint 14)', 9, 15, 30, 'proj-1', 'client-1', true, 0, 'Discussed payment failure edge cases with PM'));
  logs.push(createLog('app-antigravity', 'Google Antigravity', 'ChronoTrack Timesheet App — Pair Programming', 9, 45, 60, 'proj-1', 'client-1', true, 0, 'AI-driven timesheet consolidation engine development'));
  logs.push(createLog('app-vscode', 'Visual Studio Code', 'checkout-form.tsx — acme-checkout', 10, 45, 45, 'proj-1', 'client-1', true, 0, 'Implemented Apple Pay & credit card tokenization'));
  logs.push(createLog('app-chrome', 'Google Chrome', 'Stripe Documentation — Webhooks & Elements', 11, 30, 30, 'proj-1', 'client-1', true, 0, 'Stripe Elements SDK setup'));
  logs.push(createLog('app-terminal', 'Terminal', 'zsh — ~/work/acme-checkout (git push)', 12, 0, 15, 'proj-1', 'client-1', true, 0, 'Unit tests & CI deployment verification'));
  
  // Lunch break gap
  
  logs.push(createLog('app-figma', 'Figma', 'Nexus Design System v2 (Buttons & Input Fields)', 13, 0, 80, 'proj-3', 'client-3', true, 0, 'Designed dark-mode tokens and accessibility states'));
  logs.push(createLog('app-vscode', 'Visual Studio Code', 'Button.tsx — nexus-ui-kit', 14, 20, 65, 'proj-3', 'client-3', true, 0, 'Coded React TypeScript component equivalents'));
  logs.push(createLog('app-terminal', 'Terminal', 'zsh — ~/work/techflow-api (go run main.go)', 15, 30, 45, 'proj-2', 'client-2', true, 0, 'Optimized Redis cache invalidation keys'));
  logs.push(createLog('app-chrome', 'Google Chrome', 'TechFlow API Gateway - Datadog Traces', 16, 15, 35, 'proj-2', 'client-2', true, 0, 'Performance benchmarking & trace analysis'));
  logs.push(createLog('app-slack', 'Slack', '#dev-acme - PR Reviews & Feedback', 16, 50, 25, 'proj-1', 'client-1', true, 0, 'Reviewed checkout PRs and merged feature branch'));

  // Yesterday's logs
  logs.push(createLog('app-notion', 'Notion', 'Sprint Planning & Architecture Spec', 9, 15, 45, 'proj-admin', 'client-internal', false, 1, 'Drafted milestone deliverables'));
  logs.push(createLog('app-antigravity', 'Google Antigravity', 'Agent Workflow & Background Task Runner', 10, 0, 90, 'proj-2', 'client-2', true, 1, 'Implemented background task watcher in Go'));
  logs.push(createLog('app-vscode', 'Visual Studio Code', 'server.go — techflow-api', 11, 30, 60, 'proj-2', 'client-2', true, 1, 'Auth middleware & JWT refresh token handler'));
  logs.push(createLog('app-figma', 'Figma', 'Nexus Mobile Layouts', 13, 0, 90, 'proj-3', 'client-3', true, 1, 'Mobile breakpoint variants'));
  logs.push(createLog('app-vscode', 'Visual Studio Code', 'acme-checkout — PaymentGateway.ts', 14, 45, 120, 'proj-1', 'client-1', true, 1, 'Multi-currency checkout support'));

  return logs;
}

export class StorageService {
  static getApps(): TrackedApp[] {
    const data = localStorage.getItem(STORAGE_KEYS.APPS);
    if (!data) {
      this.saveApps(INITIAL_TRACKED_APPS);
      return INITIAL_TRACKED_APPS;
    }
    try {
      const parsed: TrackedApp[] = JSON.parse(data);
      let updated = false;
      for (const initApp of INITIAL_TRACKED_APPS) {
        if (!parsed.some((a) => a.id === initApp.id)) {
          parsed.unshift(initApp);
          updated = true;
        }
      }
      if (updated) {
        this.saveApps(parsed);
      }
      return parsed;
    } catch {
      return INITIAL_TRACKED_APPS;
    }
  }

  static saveApps(apps: TrackedApp[]): void {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
  }

  static getClients(): Client[] {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!data) {
      this.saveClients(INITIAL_CLIENTS);
      return INITIAL_CLIENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CLIENTS;
    }
  }

  static saveClients(clients: Client[]): void {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  static getProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!data) {
      this.saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PROJECTS;
    }
  }

  static saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static getRules(): CategorizationRule[] {
    const data = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!data) {
      this.saveRules(INITIAL_RULES);
      return INITIAL_RULES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_RULES;
    }
  }

  static saveRules(rules: CategorizationRule[]): void {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }

  static getSettings(): TimesheetSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: TimesheetSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getActivityLogs(): ActivityLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!data) {
      const seedLogs = generateSeedActivityLogs();
      this.saveActivityLogs(seedLogs);
      return seedLogs;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveActivityLogs(logs: ActivityLog[]): void {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  static addActivityLog(log: ActivityLog): void {
    const logs = this.getActivityLogs();
    logs.push(log);
    this.saveActivityLogs(logs);
  }

  static getTimesheets(): TimesheetEntry[] {
    const data = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveTimesheets(entries: TimesheetEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(entries));
  }

  static exportAllData(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      apps: this.getApps(),
      clients: this.getClients(),
      projects: this.getProjects(),
      rules: this.getRules(),
      settings: this.getSettings(),
      logs: this.getActivityLogs(),
      timesheets: this.getTimesheets(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.apps) this.saveApps(data.apps);
      if (data.clients) this.saveClients(data.clients);
      if (data.projects) this.saveProjects(data.projects);
      if (data.rules) this.saveRules(data.rules);
      if (data.settings) this.saveSettings(data.settings);
      if (data.logs) this.saveActivityLogs(data.logs);
      if (data.timesheets) this.saveTimesheets(data.timesheets);
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}
