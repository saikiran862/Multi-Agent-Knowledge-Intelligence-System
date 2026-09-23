import React from 'react';
import { 
  Database, 
  Cpu, 
  Layers, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import { MemoryContextResolution } from '../types';

interface MemoryInspectorProps {
  memoryContext?: MemoryContextResolution;
  onClearMemory: () => void;
  turnCount: number;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  memoryContext,
  onClearMemory,
  turnCount
}) => {
  if (!memoryContext) return null;

  const {
    activeTopic,
    activeDomain,
    trackedEntities,
    relevantHistory,
    prunedCount,
    tokenBudget,
    contextSufficiency,
    contextWarning,
    resolvedQuery
  } = memoryContext;

  const budgetPercent = Math.min(100, Math.round((tokenBudget.historyTokens / tokenBudget.maxTokens) * 100));

  return (
    <div 
      id="memory-inspector-panel"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Conversation Memory Agent (M3.2)
            </h3>
            <p className="text-[11px] text-slate-500">
              Multi-turn state tracking & context pruning
            </p>
          </div>
        </div>

        <button
          id="clear-memory-button"
          onClick={onClearMemory}
          title="Reset conversation memory"
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Ephemeral vs Permanent Separation Notice */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
          <span>Storage Isolation:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800">
            Memory: Session Ephemeral
          </span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
            KB: Permanent Immutable
          </span>
        </div>
      </div>

      {/* Active Context Indicators */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Active Domain
          </span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">
            {activeDomain || 'None yet (Awaiting query)'}
          </span>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Active Topic / Subject
          </span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5" title={activeTopic || ''}>
            {activeTopic ? activeTopic.slice(0, 24) + '...' : 'General Knowledge'}
          </span>
        </div>
      </div>

      {/* Resolved Query Coreference if modified */}
      {resolvedQuery && (
        <div className="mt-2.5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2 text-xs">
          <span className="text-[10px] font-semibold text-indigo-700 block">
            Coreference Resolution & Entity Injection:
          </span>
          <p className="mt-0.5 font-mono text-[11px] text-slate-700 break-words">
            {resolvedQuery}
          </p>
        </div>
      )}

      {/* Tracked Entities */}
      {trackedEntities.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1.5">
            <Tag className="h-3 w-3 text-slate-400" />
            <span>Tracked Entities & Concepts ({trackedEntities.length}):</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trackedEntities.map((entity, i) => (
              <span 
                key={i}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Token Budget Utilization Bar */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-500" />
            <span>Context Budget ({tokenBudget.historyTokens} / {tokenBudget.maxTokens} tokens)</span>
          </div>
          <span className="font-semibold text-slate-700">{budgetPercent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              budgetPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.max(4, budgetPercent)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>Active turns: {relevantHistory.length}</span>
          <span>Pruned turns: {prunedCount} (irrelevant pruned)</span>
        </div>
      </div>

      {/* Context Warning if missing */}
      {contextWarning && (
        <div className="mt-2.5 flex items-start gap-1.5 rounded bg-amber-50 p-2 text-xs text-amber-800 border border-amber-200">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{contextWarning}</span>
        </div>
      )}
    </div>
  );
};
