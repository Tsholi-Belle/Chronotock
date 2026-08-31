import { TimesheetEntry, TimesheetSettings } from '../types';

export type ExportFormat = 
  | 'text-summary'
  | 'text-detailed'
  | 'jira'
  | 'markdown'
  | 'csv'
  | 'json';

export class ExporterService {
  /**
   * Formats minutes into standard human duration "2h 15m" or "45m"
   */
  static formatDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  }

  /**
   * Formats minutes into decimal hours e.g. 2.50
   */
  static formatDecimalHours(minutes: number): string {
    return (minutes / 60).toFixed(2);
  }

  /**
   * Formats entries into formatted text for timesheet portals
   */
  static generateTextSummary(entries: TimesheetEntry[]): string {
    if (entries.length === 0) return 'No timesheet entries to display.';

    const lines: string[] = [];
    const totalMins = entries.reduce((acc, e) => acc + e.roundedMinutes, 0);
    const billableMins = entries.filter(e => e.isBillable).reduce((acc, e) => acc + e.roundedMinutes, 0);
    const totalAmount = entries.reduce((acc, e) => acc + e.billableAmount, 0);

    lines.push(`=======================================================`);
    lines.push(`TIMESHEET SUMMARY`);
    lines.push(`Total Duration: ${this.formatDuration(totalMins)} (${this.formatDecimalHours(totalMins)} hrs)`);
    lines.push(`Billable Time:  ${this.formatDuration(billableMins)} | Total: $${totalAmount.toFixed(2)}`);
    lines.push(`=======================================================\n`);

    // Group by Date then Project
    const byDate: Record<string, TimesheetEntry[]> = {};
    entries.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    Object.keys(byDate).sort().forEach(date => {
      lines.push(`📅 DATE: ${date}`);
      lines.push(`-------------------------------------------------------`);
      byDate[date].forEach(e => {
        const timeRange = `${e.startTime} - ${e.endTime}`;
        const dur = this.formatDuration(e.roundedMinutes);
        const billTag = e.isBillable ? `[Billable @ $${e.hourlyRate}/h]` : `[Non-Billable]`;
        const appsStr = e.appNames.length > 0 ? ` [Apps: ${e.appNames.join(', ')}]` : '';
        
        lines.push(`• [${e.clientName} > ${e.projectName}] ${timeRange} (${dur}) ${billTag}`);
        lines.push(`  Description: ${e.description}${appsStr}`);
        if (e.details && e.details.length > 1) {
          e.details.forEach(d => {
            if (d !== e.description) {
              lines.push(`    - ${d}`);
            }
          });
        }
        lines.push(``);
      });
    });

    return lines.join('\n');
  }

  /**
   * Generates compact 1-line Jira / Workday formatted records
   */
  static generateJiraFormat(entries: TimesheetEntry[]): string {
    return entries.map(e => {
      const dur = this.formatDuration(e.roundedMinutes);
      return `[${e.projectName}] ${dur} — ${e.description} (${e.appNames.join(', ')})`;
    }).join('\n');
  }

  /**
   * Generates Markdown timesheet table
   */
  static generateMarkdown(entries: TimesheetEntry[]): string {
    const rows = entries.map(e => {
      const dur = this.formatDuration(e.roundedMinutes);
      const dec = this.formatDecimalHours(e.roundedMinutes);
      const bill = e.isBillable ? `✅ $${e.billableAmount.toFixed(2)}` : '❌ Non-billable';
      return `| ${e.date} | ${e.startTime} - ${e.endTime} | **${e.projectName}** (${e.clientName}) | ${e.description} | ${e.appNames.join(', ')} | ${dur} (${dec}h) | ${bill} |`;
    });

    return [
      '# Consolidated Timesheet Report',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '| Date | Time | Project / Client | Work Done | Tracked Apps | Duration | Billing |',
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
      ...rows,
      '',
      `**Total Tracked:** ${this.formatDuration(entries.reduce((a, b) => a + b.roundedMinutes, 0))} | **Total Billable Amount:** $${entries.reduce((a, b) => a + b.billableAmount, 0).toFixed(2)}`
    ].join('\n');
  }

  /**
   * Generates CSV spreadsheet
   */
  static generateCSV(entries: TimesheetEntry[]): string {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Client',
      'Project',
      'Description',
      'Tracked Apps',
      'Category',
      'Duration (Hours)',
      'Duration (Minutes)',
      'Is Billable',
      'Hourly Rate',
      'Total Billable Amount',
      'Status'
    ];

    const escapeCSV = (val: any) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = entries.map(e => [
      e.date,
      e.startTime,
      e.endTime,
      e.clientName,
      e.projectName,
      e.description,
      e.appNames.join('; '),
      e.category,
      (e.roundedMinutes / 60).toFixed(2),
      e.roundedMinutes,
      e.isBillable ? 'Yes' : 'No',
      e.hourlyRate,
      e.billableAmount.toFixed(2),
      e.status
    ].map(escapeCSV).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Downloads formatted content as file
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
