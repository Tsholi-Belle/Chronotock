import React, { useState, useMemo } from 'react';
import { TimesheetEntry, TimesheetSettings } from '../types';
import { ExporterService, ExportFormat } from '../services/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TimesheetEntry[];
  settings: TimesheetSettings;
  selectedDate: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entries,
  selectedDate,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('jira');
  const [copied, setCopied] = useState(false);
  const [exportScope, setExportScope] = useState<'selected-date' | 'all'>('selected-date');

  const filteredEntries = useMemo(() => {
    if (exportScope === 'selected-date') {
      return entries.filter((e) => e.date === selectedDate);
    }
    return entries;
  }, [entries, selectedDate, exportScope]);

  const previewContent = useMemo(() => {
    switch (selectedFormat) {
      case 'jira':
        return ExporterService.generateJiraFormat(filteredEntries);
      case 'text-summary':
      case 'text-detailed':
        return ExporterService.generateTextSummary(filteredEntries);
      case 'markdown':
        return ExporterService.generateMarkdown(filteredEntries);
      case 'csv':
        return ExporterService.generateCSV(filteredEntries);
      case 'json':
        return JSON.stringify(filteredEntries, null, 2);
      default:
        return '';
    }
  }, [selectedFormat, filteredEntries]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let filename = `timesheet-${exportScope === 'selected-date' ? selectedDate : 'all-records'}`;
    let mimeType = 'text/plain';

    if (selectedFormat === 'csv') {
      filename += '.csv';
      mimeType = 'text/csv';
    } else if (selectedFormat === 'markdown') {
      filename += '.md';
      mimeType = 'text/markdown';
    } else if (selectedFormat === 'json') {
      filename += '.json';
      mimeType = 'application/json';
    } else {
      filename += '.txt';
    }

    ExporterService.downloadFile(previewContent, filename, mimeType);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTabs: { id: ExportFormat; label: string }[] = [
    { id: 'jira', label: '1-Click Timesheet (Jira/Clockify)' },
    { id: 'text-summary', label: 'Detailed Summary' },
    { id: 'csv', label: 'CSV / Excel Spreadsheet' },
    { id: 'markdown', label: 'Markdown Table' },
    { id: 'json', label: 'JSON Data' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Export & Timesheet Input</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate formatted records ready to copy directly into any timesheet software.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-medium px-2 py-1 rounded"
          >
            Close
          </button>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-medium">Export Scope:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-lg border border-slate-300/50 dark:border-transparent">
            <button
              type="button"
              onClick={() => setExportScope('selected-date')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                exportScope === 'selected-date'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Selected Date ({selectedDate})
            </button>
            <button
              type="button"
              onClick={() => setExportScope('all')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                exportScope === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Recorded Days ({entries.length} blocks)
            </button>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {formatTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setSelectedFormat(tab.id)}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${
                selectedFormat === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code / Text Preview */}
        <div className="relative flex-1 min-h-[260px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
          <div className="bg-slate-200/70 dark:bg-slate-900/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 font-mono">
              Preview ({filteredEntries.length} items formatted)
            </span>
            <span className="text-slate-500">Ready to copy / download</span>
          </div>

          <textarea
            readOnly
            value={previewContent}
            className="flex-1 w-full p-4 bg-transparent text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none resize-none selection:bg-brand-500/30"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
          >
            Print Timesheet
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-brand-600 hover:bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-900/30'
              }`}
            >
              {copied ? 'Copied to Clipboard' : 'Copy to Clipboard'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
            >
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
