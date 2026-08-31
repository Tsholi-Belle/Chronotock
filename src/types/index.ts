export type AppCategory = 
  | 'development'
  | 'design'
  | 'communication'
  | 'productivity'
  | 'browsing'
  | 'meetings'
  | 'writing'
  | 'other';

export interface TrackedApp {
  id: string;
  name: string;
  shortName: string;
  bundleId: string;
  processNames: string[];
  category: AppCategory;
  icon: string;
  color: string;
  isEnabled: boolean;
  defaultProjectId?: string;
  defaultBillable: boolean;
  ignoredWindowTitles?: string[];
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  code?: string;
  color: string;
  hourlyRate: number;
  currency: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  code?: string;
  color: string;
  isBillableDefault: boolean;
  hourlyRate?: number;
  description?: string;
}

export interface ActivityLog {
  id: string;
  appId: string;
  appName: string;
  windowTitle: string;
  url?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationSeconds: number;
  projectId?: string;
  clientId?: string;
  isBillable: boolean;
  isIdle?: boolean;
  manualNote?: string;
  date: string; // YYYY-MM-DD
}

export interface TimesheetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMinutes: number; // raw duration
  roundedMinutes: number;  // after user rounding rule
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  appIds: string[];
  appNames: string[];
  category: AppCategory | 'mixed';
  description: string;
  details: string[]; // list of window titles / tasks
  isBillable: boolean;
  hourlyRate: number;
  billableAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'synced';
  rawLogIds: string[];
  isManual: boolean;
  color?: string;
}

export interface CategorizationRule {
  id: string;
  name: string;
  isEnabled: boolean;
  appId?: string; // empty means match any app
  matchField: 'windowTitle' | 'url' | 'appName';
  matchType: 'contains' | 'startsWith' | 'regex' | 'exact';
  pattern: string;
  targetProjectId: string;
  targetClientId: string;
  isBillable: boolean;
  tag?: string;
}

export type RoundingIncrement = 0 | 5 | 15 | 30 | 60; // 0 = exact (no rounding)
export type RoundingMethod = 'nearest' | 'ceil' | 'floor';

export interface TimesheetSettings {
  roundingIncrement: RoundingIncrement;
  roundingMethod: RoundingMethod;
  minimumSessionSeconds: number; // e.g. 10s
  idleTimeoutMinutes: number;     // e.g. 5m
  consolidationGapMinutes: number; // e.g. 15m
  defaultHourlyRate: number;
  currency: string;
  workDayStart: string; // "09:00"
  workDayEnd: string;   // "17:30"
  autoConsolidate: boolean;
  daemonPort: number;
  userFullName: string;
  userRole: string;
}

export type ActiveTab = 'timesheet' | 'timeline' | 'apps' | 'rules' | 'analytics' | 'settings';

export interface DailySummary {
  date: string;
  totalDurationMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  totalAmount: number;
  appBreakdown: { appId: string; appName: string; color: string; durationMinutes: number }[];
  projectBreakdown: { projectId: string; projectName: string; color: string; durationMinutes: number; amount: number }[];
}
