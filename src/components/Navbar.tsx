import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Database, 
  RotateCcw, 
  FlaskConical, 
  ShieldCheck, 
  HelpCircle, 
  Mic, 
  Layers
} from 'lucide-react';
import { DomainType } from '../types';

interface NavbarProps {
  geminiConfigured: boolean;
  activeDomain: DomainType | null;
  onResetSession: () => void;
  onOpenKnowledgeBase: () => void;
  onToggleBenchmarks: () => void;
  benchmarksOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  geminiConfigured,
  activeDomain,
  onResetSession,
  onOpenKnowledgeBase,
  onToggleBenchmarks,
  benchmarksOpen
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Milestone 3 Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                Multi-Agent Knowledge Intelligence System
              </h1>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/70">
                Milestone 3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Clarification Agent • Conversation Memory • Web Speech API • Response Transparency
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Active Domain Pill */}
          {activeDomain && (
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>Domain: {activeDomain}</span>
            </div>
          )}

          {/* Gemini Engine Badge */}
          <div 
            title={geminiConfigured ? 'Gemini 3.8 Flash Server API Active' : 'Offline Grounded Pipeline Active (API key can be added in Settings > Secrets)'}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              geminiConfigured 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span className="hidden md:inline">{geminiConfigured ? 'Gemini 3.8 Flash' : 'Grounded Multi-Agent RAG'}</span>
            <span className="md:hidden">{geminiConfigured ? 'Gemini' : 'RAG'}</span>
          </div>

          {/* Knowledge Base Explorer Button */}
          <button
            id="open-kb-button"
            type="button"
            onClick={onOpenKnowledgeBase}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Knowledge Corpus</span>
          </button>

          {/* Benchmarks Hub Button */}
          <button
            id="toggle-benchmarks-button"
            type="button"
            onClick={onToggleBenchmarks}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors shadow-2xs ${
              benchmarksOpen 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Test Benchmarks</span>
          </button>

          {/* Reset Session Button */}
          <button
            id="reset-session-button"
            type="button"
            onClick={onResetSession}
            title="Reset Conversation Memory & Clear History"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
