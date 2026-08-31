import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Check, X, Calendar, DollarSign, Tag, Layers } from 'lucide-react';
import { TimesheetEntry, Project, Client, TrackedApp, AppCategory } from '../types';
import { ConsolidationEngine } from '../services/consolidation';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TimesheetEntry) => void;
  initialEntry?: TimesheetEntry | null;
  projects: Project[];
  clients: Client[];
  apps: TrackedApp[];
  selectedDate: string;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  projects,
  clients,
  apps,
  selectedDate,
}) => {
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [description, setDescription] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>(['app-vscode']);
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(85);
  const [detailsText, setDetailsText] = useState('');

  useEffect(() => {
    if (initialEntry) {
      setDate(initialEntry.date);
      setStartTime(initialEntry.startTime);
      setEndTime(initialEntry.endTime);
      setProjectId(initialEntry.projectId);
      setDescription(initialEntry.description);
      setSelectedAppIds(initialEntry.appIds || []);
      setIsBillable(initialEntry.isBillable);
      setHourlyRate(initialEntry.hourlyRate || 85);
      setDetailsText(initialEntry.details ? initialEntry.details.join('\n') : '');
    } else {
      setDate(selectedDate);
      setStartTime('09:00');
      setEndTime('10:30');
      setProjectId(projects[0]?.id || '');
      setDescription('');
      setSelectedAppIds(['app-vscode']);
      setIsBillable(true);
      setHourlyRate(85);
      setDetailsText('');
    }
  }, [initialEntry, isOpen, selectedDate, projects]);

  if (!isOpen) return null;

  const calculateMinutes = () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return Math.max(1, diff);
  };

  const handleToggleApp = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const proj = projects.find((p) => p.id === projectId) || projects[0];
    const client = clients.find((c) => c.id === proj?.clientId) || clients[0];
    const selectedApps = apps.filter((a) => selectedAppIds.includes(a.id));
    const appNames = selectedApps.map((a) => a.shortName);

    const rawMinutes = calculateMinutes();
    const roundedMinutes = rawMinutes; // exact or rounded
    const billableAmount = isBillable ? (roundedMinutes / 60) * hourlyRate : 0;

    const details = detailsText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    const entry: TimesheetEntry = {
      id: initialEntry?.id || `ts-manual-${Date.now()}`,
      date,
      startTime,
      endTime,
      durationMinutes: rawMinutes,
      roundedMinutes,
      projectId: proj.id,
      projectName: proj.name,
      clientId: client.id,
      clientName: client.name,
      appIds: selectedAppIds,
      appNames: appNames.length > 0 ? appNames : ['Manual Entry'],
      category: 'productivity',
      description: description.trim(),
      details: details.length > 0 ? details : [description.trim()],
      isBillable,
      hourlyRate,
      billableAmount: Math.round(billableAmount * 100) / 100,
      status: initialEntry?.status || 'draft',
      rawLogIds: initialEntry?.rawLogIds || [],
      isManual: true,
      color: proj.color,
    };

    onSave(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            {initialEntry ? 'Edit Timesheet Entry' : 'Log Time Block'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Date & Time Range */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Project & Client *</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                const p = projects.find((proj) => proj.id === e.target.value);
                if (p && p.hourlyRate) setHourlyRate(p.hourlyRate);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
            >
              {projects.map((p) => {
                const c = clients.find((cli) => cli.id === p.clientId);
                return (
                  <option key={p.id} value={p.id}>
                    {c ? `${c.name} › ` : ''}{p.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Work Description / Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implemented Apple Pay support & fixed checkout validation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Tracked Apps selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Tracked Apps Involved</label>
            <div className="flex flex-wrap gap-1.5">
              {apps.map((app) => {
                const selected = selectedAppIds.includes(app.id);
                return (
                  <button
                    type="button"
                    key={app.id}
                    onClick={() => handleToggleApp(app.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      selected
                        ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {app.shortName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-tasks / Details (optional) */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Sub-tasks / Notes (One per line)</label>
            <textarea
              rows={3}
              placeholder="e.g.&#10;- Refactored Stripe webhook handler&#10;- Added unit tests in Jest"
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px] focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Billing & Rate */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="modalBillable"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="rounded border-slate-800 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="modalBillable" className="text-slate-300 font-medium cursor-pointer">
                Billable to Client
              </label>
            </div>

            {isBillable && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Hourly Rate ($/hr)</label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition shadow-md shadow-brand-900/30"
            >
              {initialEntry ? 'Save Changes' : 'Log Time Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
