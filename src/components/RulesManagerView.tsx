import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  Search, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Tag
} from 'lucide-react';
import { CategorizationRule, TrackedApp, Project, Client } from '../types';
import { ConsolidationEngine } from '../services/consolidation';

interface RulesManagerViewProps {
  rules: CategorizationRule[];
  apps: TrackedApp[];
  projects: Project[];
  clients: Client[];
  onAddRule: (rule: CategorizationRule) => void;
  onUpdateRule: (rule: CategorizationRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
}

export const RulesManagerView: React.FC<RulesManagerViewProps> = ({
  rules,
  apps,
  projects,
  clients,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [testInput, setTestInput] = useState('checkout-form.tsx — acme-checkout');
  const [testAppId, setTestAppId] = useState('app-vscode');

  // New Rule Form
  const [name, setName] = useState('');
  const [appId, setAppId] = useState('');
  const [matchField, setMatchField] = useState<'windowTitle' | 'appName' | 'url'>('windowTitle');
  const [matchType, setMatchType] = useState<'contains' | 'startsWith' | 'regex' | 'exact'>('contains');
  const [pattern, setPattern] = useState('');
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || '');
  const [isBillable, setIsBillable] = useState(true);
  const [tag, setTag] = useState('');

  // Interactive Rule Tester Evaluation
  const testResult = React.useMemo(() => {
    if (!testInput) return null;
    return ConsolidationEngine.applyRulesToLog(
      { appId: testAppId, windowTitle: testInput },
      rules,
      apps,
      projects,
      clients
    );
  }, [testInput, testAppId, rules, apps, projects, clients]);

  const matchedProj = projects.find((p) => p.id === testResult?.projectId);
  const matchedClient = clients.find((c) => c.id === testResult?.clientId);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pattern.trim()) return;

    const proj = projects.find((p) => p.id === targetProjectId);
    const clientId = proj ? proj.clientId : (clients[0]?.id || '');

    const newRule: CategorizationRule = {
      id: `rule-${Date.now()}`,
      name: name.trim(),
      isEnabled: true,
      appId: appId || undefined,
      matchField,
      matchType,
      pattern: pattern.trim(),
      targetProjectId,
      targetClientId: clientId,
      isBillable,
      tag: tag.trim() || undefined,
    };

    onAddRule(newRule);
    setShowAddModal(false);
    // Reset
    setName('');
    setPattern('');
    setTag('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-400" />
            Automatic Work Categorization Rules
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rules automatically map window titles, file names, and URLs to the appropriate Project, Client, and Billing category.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-900/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Categorization Rule</span>
        </button>
      </div>

      {/* Interactive Rule Tester Sandbox */}
      <div className="glass-panel p-5 rounded-2xl space-y-3 bg-gradient-to-r from-slate-900/90 via-brand-950/20 to-slate-900/90 border-brand-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-400" />
            Interactive Rule Tester Sandbox
          </div>
          <span className="text-[11px] text-slate-400">
            Type any sample window title to test rule matching
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* App Selector */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Simulated App</label>
            <select
              value={testAppId}
              onChange={(e) => setTestAppId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-brand-500"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Test Input */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Sample Window Title / URL
            </label>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="e.g. checkout-form.tsx — acme-checkout"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Evaluation Output */}
        <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Matched Result:</span>
            {testResult?.matchedRule ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/30">
                <Check className="w-3 h-3 text-emerald-400" />
                Rule: "{testResult.matchedRule.name}"
              </span>
            ) : (
              <span className="text-amber-400 font-medium bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Default App Fallback
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 font-medium">
            <div className="text-slate-300">
              Project: <span className="text-brand-300 font-semibold">{matchedProj?.name}</span>
            </div>
            <div className="text-slate-300">
              Client: <span className="text-slate-100">{matchedClient?.name}</span>
            </div>
            <div
              className={`font-semibold ${
                testResult?.isBillable ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {testResult?.isBillable ? 'Billable ($)' : 'Non-Billable'}
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">
            Active Rules ({rules.length})
          </h3>
          <span className="text-xs text-slate-500">Evaluated in order</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {rules.map((rule) => {
            const targetProj = projects.find((p) => p.id === rule.targetProjectId);
            const targetClient = clients.find((c) => c.id === rule.targetClientId);
            const matchedApp = apps.find((a) => a.id === rule.appId);

            return (
              <div
                key={rule.id}
                className={`p-4 hover:bg-slate-900/60 transition flex flex-wrap items-center justify-between gap-4 text-xs ${
                  rule.isEnabled ? '' : 'opacity-50'
                }`}
              >
                {/* Rule info */}
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        rule.isEnabled
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {rule.isEnabled && <Check className="w-3 h-3" />}
                    </button>
                    <span className="font-bold text-sm text-slate-100">{rule.name}</span>
                    {rule.tag && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        <Tag className="w-2.5 h-2.5 text-brand-400" />
                        {rule.tag}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] flex-wrap">
                    <span>If</span>
                    <span className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {matchedApp ? matchedApp.shortName : 'Any App'}
                    </span>
                    <span>window title</span>
                    <span className="text-brand-300 font-semibold">{rule.matchType}</span>
                    <span className="text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">
                      "{rule.pattern}"
                    </span>
                  </div>
                </div>

                {/* Target Mapping */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold text-slate-200">
                      {targetProj?.name || 'Unknown Project'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {targetClient?.name} •{' '}
                      <span className={rule.isBillable ? 'text-emerald-400' : 'text-slate-500'}>
                        {rule.isBillable ? 'Billable' : 'Non-billable'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      title="Delete Rule"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Auto-Categorization Rule</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jira ACME Tickets, Stripe Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target App</label>
                  <select
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Any Application</option>
                    {apps.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Match Type</label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="contains">Contains Substring</option>
                    <option value="startsWith">Starts With</option>
                    <option value="exact">Exact Match</option>
                    <option value="regex">Regular Expression</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Pattern to Match *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-checkout, PROJ-, stripe.com"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Project</label>
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
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

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Task Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend, DevOps"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ruleBillable"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="rounded border-slate-800 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="ruleBillable" className="text-slate-300 font-medium cursor-pointer">
                  Mark matching sessions as Billable
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition shadow-md shadow-brand-900/30"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
