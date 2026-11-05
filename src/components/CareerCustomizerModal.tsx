import React, { useState, useEffect } from 'react';
import { CareerTrackerConfig, IndustryPresetId } from '../types';
import { INDUSTRY_PRESETS } from '../services/storage';

interface CareerCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: CareerTrackerConfig;
  onSaveConfig: (config: CareerTrackerConfig) => void;
}

export const CareerCustomizerModal: React.FC<CareerCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
}) => {
  const [activePreset, setActivePreset] = useState<IndustryPresetId>(
    currentConfig?.industryId || 'tech'
  );
  
  const [formData, setFormData] = useState<CareerTrackerConfig>(() => {
    return currentConfig || INDUSTRY_PRESETS.tech;
  });

  const [tagInput, setTagInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentConfig) {
        setFormData(currentConfig);
        setActivePreset(currentConfig.industryId);
      } else {
        setFormData(INDUSTRY_PRESETS.tech);
        setActivePreset('tech');
      }
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: IndustryPresetId) => {
    setActivePreset(presetId);
    setFormData(INDUSTRY_PRESETS[presetId]);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.quickTags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        quickTags: [...formData.quickTags, tagInput.trim()],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      quickTags: formData.quickTags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  const presetList: {
    id: IndustryPresetId;
    title: string;
    subtitle: string;
  }[] = [
    {
      id: 'tech',
      title: 'Software & Tech',
      subtitle: 'Code files, Git branches, PRs & tickets',
    },
    {
      id: 'legal',
      title: 'Legal & Law Firms',
      subtitle: 'Matters, case files, discovery & billable hours',
    },
    {
      id: 'healthcare',
      title: 'Healthcare & Clinical',
      subtitle: 'Patient charts, therapy sessions & CPT codes',
    },
    {
      id: 'accounting',
      title: 'Accounting & Tax',
      subtitle: 'Audits, tax returns, engagements & workstreams',
    },
    {
      id: 'creative',
      title: 'Design & Architecture',
      subtitle: 'Creative assets, CAD drawings & design sprints',
    },
    {
      id: 'consulting',
      title: 'Management Consulting',
      subtitle: 'Strategy decks, deliverables & client workstreams',
    },
    {
      id: 'custom',
      title: 'Custom Career',
      subtitle: 'Tailor every single label and placeholder',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[92vh] overflow-y-auto text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Career & Industry Customization
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                {formData.industryName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize the live tracker bars, fields, and placeholders to match your exact profession.
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

        {/* 1. Industry Presets Selection */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            1. Select Industry / Profession Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {presetList.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/30'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {p.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Live Preview */}
        <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Live Tracker Bar Preview ({formData.industryName})
            </span>
            <span className="text-[10px] text-slate-500">Live preview of your customized bars</span>
          </div>

          {/* Mini Replica of the Tracker Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
            {/* Bar 1: App Selector */}
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {formData.appFieldLabel}
            </div>

            {/* Bar 2: Task / Activity Input */}
            <div className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {formData.taskPlaceholder}
            </div>

            {/* Bar 3: Project Selector */}
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              {formData.projectFieldLabel}
            </div>

            {/* Bar 4: Billable Toggle */}
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
              {formData.billableLabel}
            </div>
          </div>
        </div>

        {/* 3. Form customization */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              2. Fine-Tune Labels & Terminology
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Industry Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Career / Industry Title
                </label>
                <input
                  type="text"
                  value={formData.industryName}
                  onChange={(e) => setFormData({ ...formData, industryName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Bar 1 Label (App / Tool) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Bar 1 Label: Application / Platform
                </label>
                <input
                  type="text"
                  value={formData.appFieldLabel}
                  onChange={(e) => setFormData({ ...formData, appFieldLabel: e.target.value })}
                  placeholder="e.g. IDE & Dev Tools, Legal Platform, EHR"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Bar 2 Label (Task) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Bar 2 Label: Task / Activity Descriptor
                </label>
                <input
                  type="text"
                  value={formData.taskFieldLabel}
                  onChange={(e) => setFormData({ ...formData, taskFieldLabel: e.target.value })}
                  placeholder="e.g. Task / Git Branch, Matter Activity, CPT Code"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Bar 3 Label (Project) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Bar 3 Label: Client / Project Mapping
                </label>
                <input
                  type="text"
                  value={formData.projectFieldLabel}
                  onChange={(e) => setFormData({ ...formData, projectFieldLabel: e.target.value })}
                  placeholder="e.g. Client › Matter #, Patient › Clinic"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Task Placeholder text */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Bar 2 Placeholder Text (Instruction inside the main input bar)
              </label>
              <input
                type="text"
                value={formData.taskPlaceholder}
                onChange={(e) => setFormData({ ...formData, taskPlaceholder: e.target.value })}
                placeholder="e.g. Matter activity (e.g. Drafting Motion, Client Deposition, Case Law Research)"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Billable & Non-Billable Labels */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Bar 4 Label: Billable Button
                </label>
                <input
                  type="text"
                  value={formData.billableLabel}
                  onChange={(e) => setFormData({ ...formData, billableLabel: e.target.value })}
                  placeholder="e.g. Billable, Insurance Billable, Client Scope"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Bar 4 Label: Non-Billable Button
                </label>
                <input
                  type="text"
                  value={formData.nonBillableLabel}
                  onChange={(e) => setFormData({ ...formData, nonBillableLabel: e.target.value })}
                  placeholder="e.g. Non-Billable, Pro Bono / Admin, Overhead"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Quick Suggestion Tags */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Quick Activity Tags for this Industry
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add custom tag (e.g. Deposition, Consultation, Tax Prep)..."
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {formData.quickTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500 text-slate-400 font-bold"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSelectPreset(activePreset)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium"
            >
              Reset to Default
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md shadow-brand-900/30 transition"
              >
                Apply & Save Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
