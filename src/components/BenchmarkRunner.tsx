import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Split, 
  Repeat, 
  Shuffle, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { BENCHMARK_TEST_CASES } from '../data/knowledgeBase';
import { TestCaseItem, QueryResolutionResponse } from '../types';

interface BenchmarkRunnerProps {
  onRunTest: (testItem: TestCaseItem) => void;
  isRunning: boolean;
  activeTestId: string | null;
  lastTestResult: {
    testItem: TestCaseItem;
    result: QueryResolutionResponse;
    clarificationMatchesExpectation: boolean;
  } | null;
}

const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  ambiguous: {
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    label: 'Ambiguous Query (M3.1)',
    color: 'text-amber-700 bg-amber-50 border-amber-200'
  },
  incomplete: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: 'Incomplete Request (M3.1)',
    color: 'text-purple-700 bg-purple-50 border-purple-200'
  },
  multipart: {
    icon: <Split className="h-3.5 w-3.5" />,
    label: 'Multi-Part Query (M3.1)',
    color: 'text-blue-700 bg-blue-50 border-blue-200'
  },
  context_followup: {
    icon: <Repeat className="h-3.5 w-3.5" />,
    label: 'Context Follow-Up (M3.2)',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
  },
  context_switch: {
    icon: <Shuffle className="h-3.5 w-3.5" />,
    label: 'Context Switching (M3.2)',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
  }
};

export const BenchmarkRunner: React.FC<BenchmarkRunnerProps> = ({
  onRunTest,
  isRunning,
  activeTestId,
  lastTestResult
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredTests = BENCHMARK_TEST_CASES.filter(t => 
    filterCategory === 'all' ? true : t.category === filterCategory
  );

  return (
    <div id="benchmark-test-hub" className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <span>Multi-Agent Validation Suite (M3.1 & M3.2 Benchmarks)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Automated test harnesses for Ambiguity, Clarification, Multi-Part, Follow-Ups & Domain Switching
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1">
          {['all', 'ambiguous', 'incomplete', 'multipart', 'context_followup', 'context_switch'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All (6)' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Test Case Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredTests.map((test) => {
          const catMeta = CATEGORY_ICONS[test.category] || CATEGORY_ICONS.ambiguous;
          const isActive = activeTestId === test.id;
          const isCurrentResult = lastTestResult?.testItem.id === test.id;

          return (
            <div
              key={test.id}
              id={`test-card-${test.id}`}
              className={`rounded-lg border p-3 transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-300'
                  : isCurrentResult
                  ? 'border-slate-300 bg-slate-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${catMeta.color}`}>
                    {catMeta.icon}
                    <span>{catMeta.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {test.domain}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-900">
                  {test.title}
                </h4>

                <p className="mt-1 font-serif text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                  "{test.query}"
                </p>

                <p className="mt-1.5 text-[10px] text-slate-500 leading-normal">
                  <strong className="text-slate-700">Expected: </strong>
                  {test.expectedBehavior}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isCurrentResult && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                      lastTestResult.clarificationMatchesExpectation ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {lastTestResult.clarificationMatchesExpectation ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Passed Expected Behavior</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          <span>Check Pipeline Output</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <button
                  id={`run-test-${test.id}`}
                  type="button"
                  disabled={isRunning}
                  onClick={() => onRunTest(test)}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{isActive ? 'Testing...' : 'Run Simulation'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
