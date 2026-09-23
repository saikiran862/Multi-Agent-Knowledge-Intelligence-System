import React, { useState } from 'react';
import { Database, Search, X, BookOpen, Shield, HeartPulse, DollarSign, Cloud, Tag } from 'lucide-react';
import { PERMANENT_KNOWLEDGE_BASE } from '../data/knowledgeBase';
import { DomainType, DocumentChunk } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOMAIN_ICONS: Record<DomainType, React.ReactNode> = {
  'DevOps & Cloud': <Cloud className="h-3.5 w-3.5 text-blue-600" />,
  'Cybersecurity & Compliance': <Shield className="h-3.5 w-3.5 text-indigo-600" />,
  'Healthcare & HIPAA': <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />,
  'FinTech & Banking': <DollarSign className="h-3.5 w-3.5 text-amber-600" />
};

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  if (!isOpen) return null;

  const filteredChunks = PERMANENT_KNOWLEDGE_BASE.filter(chunk => {
    const matchesDomain = selectedDomain === 'all' || chunk.domain === selectedDomain;
    const matchesSearch = 
      searchTerm === '' ||
      chunk.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Permanent Knowledge Base Explorer
              </h3>
              <p className="text-xs text-slate-500">
                Immutable, ground-truth enterprise documents across 4 regulated domains
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents, sections, or keywords (e.g., RTO, HIPAA, WORM, 3DS)..."
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {['all', 'DevOps & Cloud', 'Cybersecurity & Compliance', 'Healthcare & HIPAA', 'FinTech & Banking'].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedDomain === dom
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dom === 'all' ? 'All Domains' : dom}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredChunks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching knowledge base documents found.
            </div>
          ) : (
            filteredChunks.map((chunk) => (
              <div 
                key={chunk.id} 
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    {DOMAIN_ICONS[chunk.domain]}
                    <span className="text-xs font-bold text-slate-900">
                      {chunk.documentTitle}
                    </span>
                    <span className="font-mono text-xs font-semibold text-indigo-600">
                      {chunk.citationRef}
                    </span>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {chunk.domain}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-700 mb-1.5">
                  {chunk.section} • Page {chunk.page} • Chunk ID: <code className="text-[10px] text-slate-500">{chunk.id}</code>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 font-serif leading-relaxed border border-slate-100">
                  "{chunk.content}"
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {chunk.keywords.map((kw, i) => (
                    <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-600">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredChunks.length} of {PERMANENT_KNOWLEDGE_BASE.length} knowledge chunks</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
