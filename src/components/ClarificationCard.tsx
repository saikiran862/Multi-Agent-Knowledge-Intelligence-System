import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, ArrowRight, CornerDownRight, CheckCircle2, Split } from 'lucide-react';
import { ClarificationDetection, AmbiguityType } from '../types';

interface ClarificationCardProps {
  clarification: ClarificationDetection;
  originalQuery: string;
  onClarify: (answer: string) => void;
  isLoading: boolean;
}

const AMBIGUITY_LABELS: Record<AmbiguityType, { title: string; color: string; bg: string; border: string }> = {
  unclear_terminology: {
    title: 'Unclear Terminology',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300'
  },
  missing_context: {
    title: 'Missing Context & Scope',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-300'
  },
  multiple_interpretations: {
    title: 'Multiple Interpretations',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-300'
  },
  incomplete_request: {
    title: 'Incomplete Request',
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-300'
  },
  multipart_conflict: {
    title: 'Multi-Part Ambiguity',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-300'
  },
  none: {
    title: 'Clear Query',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300'
  }
};

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  clarification,
  originalQuery,
  onClarify,
  isLoading
}) => {
  const [customAnswer, setCustomAnswer] = useState('');
  const badge = AMBIGUITY_LABELS[clarification.ambiguityType] || AMBIGUITY_LABELS.missing_context;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAnswer.trim() || isLoading) return;
    onClarify(customAnswer.trim());
    setCustomAnswer('');
  };

  return (
    <div 
      id="clarification-agent-container"
      className="my-4 rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm transition-all"
    >
      {/* Header with Ambiguity Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                Clarification Agent (M3.1)
              </span>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.color} ${badge.border}`}>
                {badge.title}
              </span>
            </div>
            <p className="text-xs text-amber-800/80">
              Ambiguity detected before retrieval. Context maintained while waiting for input.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono font-medium text-amber-900/70">
            Ambiguity Score: {Math.round(clarification.ambiguityScore * 100)}%
          </span>
        </div>
      </div>

      {/* Original Query Context */}
      <div className="mt-3.5 rounded-lg bg-white/80 p-3 border border-amber-200/50">
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <CornerDownRight className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-700">Original Query: </span>
            <span className="italic text-slate-800">"{originalQuery}"</span>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-amber-900/90 pl-5">
          <strong className="font-medium">Why Clarification is Required:</strong> {clarification.reason}
        </p>
      </div>

      {/* Multi-Part Breakdown if present */}
      {clarification.multiParts && clarification.multiParts.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Split className="h-3.5 w-3.5 text-indigo-600" />
            <span>Multi-Part Query Requirements Analysis:</span>
          </div>
          <div className="space-y-1.5">
            {clarification.multiParts.map((part, idx) => (
              <div key={part.id} className="flex items-start justify-between gap-2 text-xs rounded bg-slate-50 p-2 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-mono font-semibold">
                    {idx + 1}
                  </span>
                  <span className="text-slate-800 font-medium">"{part.text}"</span>
                </div>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                  part.canResolveDirectly ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {part.canResolveDirectly ? 'Direct Resolution' : 'Needs Clarification'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Question */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-900">
          {clarification.clarificationQuestion}
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Select one of the targeted options below or provide custom details to refine your query.
        </p>
      </div>

      {/* Suggested Quick Options */}
      {clarification.suggestedOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {clarification.suggestedOptions.map((option, idx) => (
            <button
              key={idx}
              id={`clarification-option-${idx}`}
              type="button"
              disabled={isLoading}
              onClick={() => onClarify(option)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs hover:bg-amber-100/70 hover:border-amber-400 hover:text-amber-900 transition-colors disabled:opacity-50 text-left"
            >
              <CheckCircle2 className="h-3 w-3 text-amber-600 shrink-0" />
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}

      {/* Custom Clarification Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          id="custom-clarification-input"
          type="text"
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          placeholder="Or type custom clarification details..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        <button
          id="submit-clarification-button"
          type="submit"
          disabled={!customAnswer.trim() || isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 focus:outline-none disabled:opacity-50 transition-colors shrink-0"
        >
          <span>Refine & Continue</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
