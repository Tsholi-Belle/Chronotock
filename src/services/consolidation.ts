import { 
  ActivityLog, 
  TimesheetEntry, 
  TrackedApp, 
  Project, 
  Client, 
  CategorizationRule, 
  TimesheetSettings, 
  RoundingIncrement, 
  RoundingMethod,
  AppCategory
} from '../types';

export class ConsolidationEngine {
  /**
   * Evaluates rules against a raw activity log to assign project, client, and billable status
   */
  static applyRulesToLog(
    log: Partial<ActivityLog>,
    rules: CategorizationRule[],
    apps: TrackedApp[],
    projects: Project[],
    clients: Client[]
  ): { projectId?: string; clientId?: string; isBillable: boolean; matchedRule?: CategorizationRule } {
    const app = apps.find(a => a.id === log.appId || a.name.toLowerCase() === (log.appName || '').toLowerCase());
    
    // Check enabled rules in order
    for (const rule of rules.filter(r => r.isEnabled)) {
      if (rule.appId && log.appId && rule.appId !== log.appId) {
        continue;
      }

      let targetVal = '';
      if (rule.matchField === 'windowTitle') targetVal = log.windowTitle || '';
      else if (rule.matchField === 'appName') targetVal = log.appName || '';
      else if (rule.matchField === 'url') targetVal = log.url || '';

      let matched = false;
      const cleanTarget = targetVal.toLowerCase();
      const cleanPattern = rule.pattern.toLowerCase();

      if (rule.matchType === 'contains') {
        matched = cleanTarget.includes(cleanPattern);
      } else if (rule.matchType === 'startsWith') {
        matched = cleanTarget.startsWith(cleanPattern);
      } else if (rule.matchType === 'exact') {
        matched = cleanTarget === cleanPattern;
      } else if (rule.matchType === 'regex') {
        try {
          const re = new RegExp(rule.pattern, 'i');
          matched = re.test(targetVal);
        } catch {
          matched = false;
        }
      }

      if (matched) {
        return {
          projectId: rule.targetProjectId,
          clientId: rule.targetClientId,
          isBillable: rule.isBillable,
          matchedRule: rule,
        };
      }
    }

    // Fallback to app defaults
    if (app && app.defaultProjectId) {
      const proj = projects.find(p => p.id === app.defaultProjectId);
      const clientId = proj ? proj.clientId : (clients[0]?.id || '');
      return {
        projectId: app.defaultProjectId,
        clientId,
        isBillable: app.defaultBillable,
      };
    }

    // Default fallback to first project or internal
    const defaultProj = projects[0];
    return {
      projectId: defaultProj ? defaultProj.id : undefined,
      clientId: defaultProj ? defaultProj.clientId : undefined,
      isBillable: defaultProj ? defaultProj.isBillableDefault : true,
    };
  }

  /**
   * Applies rounding rules to minutes
   */
  static roundMinutes(
    rawMinutes: number, 
    increment: RoundingIncrement = 15, 
    method: RoundingMethod = 'nearest'
  ): number {
    if (increment === 0 || rawMinutes <= 0) {
      return Math.max(1, Math.round(rawMinutes));
    }

    const units = rawMinutes / increment;
    let roundedUnits = units;

    if (method === 'nearest') {
      roundedUnits = Math.round(units);
    } else if (method === 'ceil') {
      roundedUnits = Math.ceil(units);
    } else if (method === 'floor') {
      roundedUnits = Math.floor(units);
    }

    // Always ensure at least 1 unit if duration > 0
    if (roundedUnits === 0 && rawMinutes > 0) {
      roundedUnits = 1;
    }

    return Math.max(increment, roundedUnits * increment);
  }

  /**
   * Generates a readable work description from a cluster of window titles and notes
   */
  static generateDescription(logs: ActivityLog[], projectName: string): { description: string; details: string[] } {
    const titlesSet = new Set<string>();
    const notesSet = new Set<string>();
    const appNamesSet = new Set<string>();

    for (const log of logs) {
      if (log.appName) appNamesSet.add(log.appName);
      if (log.manualNote && log.manualNote.trim()) {
        notesSet.add(log.manualNote.trim());
      } else if (log.windowTitle && log.windowTitle.trim()) {
        // Clean title: remove clutter like " — Google Chrome", " - Visual Studio Code"
        let cleanTitle = log.windowTitle
          .replace(/\s*[-—]\s*(Google Chrome|Visual Studio Code|VS Code|Figma|Slack|Terminal|Notion|Zoom|Xcode|Microsoft Word|Microsoft Excel)\s*$/i, '')
          .replace(/^zsh\s*[-—]\s*/i, '')
          .trim();
        if (cleanTitle.length > 2) {
          titlesSet.add(cleanTitle);
        }
      }
    }

    const notesList = Array.from(notesSet);
    const titlesList = Array.from(titlesSet);
    const appsList = Array.from(appNamesSet);

    const details: string[] = [];
    if (notesList.length > 0) {
      notesList.forEach(n => details.push(n));
    }
    titlesList.forEach(t => {
      if (!details.includes(t)) details.push(t);
    });

    let mainSummary = '';
    if (notesList.length > 0) {
      mainSummary = notesList.slice(0, 2).join('; ');
      if (titlesList.length > 0 && notesList.length === 1) {
        mainSummary += ` (${titlesList[0]})`;
      }
    } else if (titlesList.length > 0) {
      mainSummary = titlesList.slice(0, 3).join(', ');
    } else {
      mainSummary = `Active work on ${projectName} (${appsList.join(', ') || 'Various Apps'})`;
    }

    return {
      description: mainSummary || `Work on ${projectName}`,
      details: details.slice(0, 10),
    };
  }

  /**
   * Consolidates raw activity logs into polished Timesheet entries
   */
  static consolidateLogs(
    logs: ActivityLog[],
    apps: TrackedApp[],
    projects: Project[],
    clients: Client[],
    settings: TimesheetSettings,
    targetDate?: string
  ): TimesheetEntry[] {
    // 1. Filter logs for target date (if specified) and non-idle
    let filteredLogs = logs.filter(l => {
      if (targetDate && l.date !== targetDate) return false;
      if (l.isIdle) return false;
      if (l.durationSeconds < (settings.minimumSessionSeconds || 10)) return false;
      return true;
    });

    // 2. Sort chronologically
    filteredLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // 3. Cluster contiguous or closely spaced logs with the same Project & Client
    const maxGapMs = (settings.consolidationGapMinutes || 15) * 60 * 1000;
    const clusters: ActivityLog[][] = [];
    let currentCluster: ActivityLog[] = [];

    for (let i = 0; i < filteredLogs.length; i++) {
      const log = filteredLogs[i];
      if (currentCluster.length === 0) {
        currentCluster.push(log);
        continue;
      }

      const prevLog = currentCluster[currentCluster.length - 1];
      const prevEndTime = new Date(prevLog.endTime).getTime();
      const currentStartTime = new Date(log.startTime).getTime();
      const gap = currentStartTime - prevEndTime;

      // Check if they belong to same project & client and within reasonable gap
      const sameProject = (log.projectId || '') === (prevLog.projectId || '');
      const sameClient = (log.clientId || '') === (prevLog.clientId || '');
      const sameBillable = log.isBillable === prevLog.isBillable;
      const withinGap = gap >= -60000 && gap <= maxGapMs; // allow small overlaps or gaps <= maxGap

      if (sameProject && sameClient && sameBillable && withinGap) {
        currentCluster.push(log);
      } else {
        clusters.push([...currentCluster]);
        currentCluster = [log];
      }
    }

    if (currentCluster.length > 0) {
      clusters.push([...currentCluster]);
    }

    // 4. Transform clusters into TimesheetEntry objects
    const entries: TimesheetEntry[] = [];

    for (const cluster of clusters) {
      if (cluster.length === 0) continue;

      const firstLog = cluster[0];
      const lastLog = cluster[cluster.length - 1];
      const date = firstLog.date;

      const startDate = new Date(firstLog.startTime);
      const endDate = new Date(lastLog.endTime);
      
      const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      // Sum exact durations
      const totalSeconds = cluster.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
      const rawMinutes = Math.max(1, Math.round(totalSeconds / 60));
      const roundedMinutes = this.roundMinutes(rawMinutes, settings.roundingIncrement, settings.roundingMethod);

      // Project & Client Lookup
      const projId = firstLog.projectId || projects[0]?.id || 'proj-default';
      const project = projects.find(p => p.id === projId) || {
        id: projId,
        name: 'General Project',
        color: '#3b82f6',
        clientId: 'client-1',
        hourlyRate: settings.defaultHourlyRate,
        isBillableDefault: true,
      };

      const clientId = firstLog.clientId || project.clientId || clients[0]?.id || 'client-default';
      const client = clients.find(c => c.id === clientId) || {
        id: clientId,
        name: 'Default Client',
        color: '#64748b',
        hourlyRate: settings.defaultHourlyRate,
        currency: settings.currency,
      };

      // App metadata
      const appIds = Array.from(new Set(cluster.map(l => l.appId).filter(Boolean)));
      const appNames = Array.from(new Set(cluster.map(l => l.appName).filter(Boolean)));
      
      // Determine primary category
      const categories = cluster.map(l => {
        const a = apps.find(app => app.id === l.appId);
        return a ? a.category : 'other';
      });
      const primaryCategory: AppCategory | 'mixed' = (new Set(categories).size === 1 ? categories[0] : 'mixed') as any;

      // Rate & billing calculation
      const hourlyRate = project.hourlyRate !== undefined ? project.hourlyRate : (client.hourlyRate || settings.defaultHourlyRate);
      const isBillable = firstLog.isBillable !== undefined ? firstLog.isBillable : project.isBillableDefault;
      const billableAmount = isBillable ? (roundedMinutes / 60) * hourlyRate : 0;

      // Generate task description
      const { description, details } = this.generateDescription(cluster, project.name);

      entries.push({
        id: `ts-${firstLog.id}`,
        date,
        startTime,
        endTime,
        durationMinutes: rawMinutes,
        roundedMinutes,
        projectId: project.id,
        projectName: project.name,
        clientId: client.id,
        clientName: client.name,
        appIds,
        appNames,
        category: primaryCategory,
        description,
        details,
        isBillable,
        hourlyRate,
        billableAmount: Math.round(billableAmount * 100) / 100,
        status: 'draft',
        rawLogIds: cluster.map(l => l.id),
        isManual: false,
        color: project.color || client.color,
      });
    }

    return entries;
  }
}
