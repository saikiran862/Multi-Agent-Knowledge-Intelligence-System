import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Zap,
  Info,
  Layers
} from 'lucide-react';
import { DocumentChunk, CitationReference, AgentLatency } from '../types';

interface TransparencyPanelProps {
  retrievedChunks: DocumentChunk[];
  citations: CitationReference[];
  confidenceScore: number;
  confidenceRating: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  insufficientEvidence: boolean;
  latency?: AgentLatency;
  geminiPowered?: boolean;
  selectedChunkId: string | null;
  onSelectChunk: (chunkId: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TransparencyPanel: React.FC<TransparencyPanelProps> = ({
  retrievedChunks,
  citations,
  confidenceScore,
  confidenceRating,
  confidenceReason,
  insufficientEvidence,
  latency,
  geminiPowered,
  selectedChunkId,
  onSelectChunk,
  isOpen,
  onToggle
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ratingColor = 
    confidenceRating === 'High' 
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
      : confidenceRating === 'Medium' 
      ? 'text-amber-700 bg-amber-50 border-amber-200' 
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <div 
      id="response-transparency-panel"
      className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all"
    >
      {/* Collapsible Header */}
      <button
        id="transparency-toggle-button"
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Response Transparency & Evidence Panel (M3.4)
              </span>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ratingColor}`}>
                {confidenceRating} Confidence ({confidenceScore}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {retrievedChunks.length} verified source chunks retrieved • Citations linked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {geminiPowered && (
            <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
              <Sparkles className="h-3 w-3" />
              <span>Gemini 3.8 Flash</span>
            </span>
          )}
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-slate-100">
          {/* Confidence & Evidence Summary Box */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">System Confidence Breakdown: </span>
                <span className="text-slate-600">{confidenceReason}</span>
              </div>
            </div>

            {/* Insufficient Evidence Warning Banner */}
            {insufficientEvidence && (
              <div className="mt-2.5 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Low Evidence Alert: </strong>
                  <span>
                    No document in the knowledge base exceeded the 0.55 similarity threshold. The response is synthesized cautiously and may omit proprietary details.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Evidence vs Synthesis Explainer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Raw Source Chunks (Immutable Ground Truth)</span>
            </div>
            <span className="italic">Click any chunk card to highlight its citation</span>
          </div>

          {/* Retrieved Source Chunks List */}
          <div className="space-y-3">
            {retrievedChunks.map((chunk, idx) => {
              const isSelected = selectedChunkId === chunk.id;
              const simPercent = Math.round(chunk.similarityScore * 100);

              return (
                <div
                  key={chunk.id}
                  id={`chunk-card-${chunk.id}`}
                  onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Chunk Metadata Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {chunk.citationRef}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {chunk.domain}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-slate-600">
                        Similarity: {simPercent}%
                      </span>
                      {/* Similarity Bar */}
                      <div className="h-2 w-16 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            simPercent >= 85 ? 'bg-emerald-500' : simPercent >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${simPercent}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(chunk.content, chunk.id);
                        }}
                        title="Copy raw chunk excerpt"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        {copiedId === chunk.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Document & Section Header */}
                  <div className="mb-2">
                    <h5 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{chunk.documentTitle}</span>
                    </h5>
                    <div className="text-[11px] text-slate-500 pl-5">
                      {chunk.section} • Page {chunk.page} • Chunk ID: <span className="font-mono text-[10px]">{chunk.id}</span>
                    </div>
                  </div>

                  {/* Raw Content Excerpt */}
                  <div className="rounded-lg bg-slate-50/90 p-2.5 text-xs text-slate-800 font-serif leading-relaxed border border-slate-100">
                    "{chunk.content}"
                  </div>

                  {/* Keywords */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {chunk.keywords.map((kw, kIdx) => (
                      <span key={kIdx} className="rounded bg-white px-1.5 py-0.5 text-[9px] font-mono text-slate-500 border border-slate-100">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Latency Breakdown Bar */}
          {latency && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Agent Execution Latency</span>
                </div>
                <span className="font-mono text-indigo-600">{latency.totalMs}ms total</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-slate-500">
                <div className="rounded bg-white p-1 border border-slate-100">
                  <span className="block text-slate-400">Clarification</span>
                  <span className="font-mono font-medium text-slate-700">{latency.clarificationMs}ms</span>
                </div>
                <div className="rounded bg-white p-1 border border-slate-100">
                  <span className="block text-slate-400">Memory</span>
                  <span className="font-mono font-medium text-slate-700">{latency.memoryMs}ms</span>
                </div>
                <div className="rounded bg-white p-1 border border-slate-100">
                  <span className="block text-slate-400">Retrieval</span>
                  <span className="font-mono font-medium text-slate-700">{latency.retrievalMs}ms</span>
                </div>
                <div className="rounded bg-white p-1 border border-slate-100">
                  <span className="block text-slate-400">Generation</span>
                  <span className="font-mono font-medium text-slate-700">{latency.generationMs}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
