import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  Bot, 
  User, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  BookOpen, 
  Mic, 
  RefreshCw,
  Info,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { 
  ConversationTurn, 
  QueryResolutionResponse, 
  MemoryContextResolution, 
  TestCaseItem,
  DomainType 
} from './types';
import { useVoice } from './hooks/useVoice';
import { Navbar } from './components/Navbar';
import { ClarificationCard } from './components/ClarificationCard';
import { MemoryInspector } from './components/MemoryInspector';
import { VoiceControls } from './components/VoiceControls';
import { TransparencyPanel } from './components/TransparencyPanel';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';

const SUGGESTED_QUERIES = [
  'What are the RTO requirements for tier-1 databases?',
  'What is the policy on data retention?',
  'Tell me about compliance',
  'What are the cash reporting thresholds for SAR and CTR?'
];

export default function App() {
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [memoryContext, setMemoryContext] = useState<MemoryContextResolution | undefined>(undefined);
  const [openTransparency, setOpenTransparency] = useState<Record<string, boolean>>({});
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [benchmarksOpen, setBenchmarksOpen] = useState(false);
  const [kbModalOpen, setKbModalOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<{
    testItem: TestCaseItem;
    result: QueryResolutionResponse;
    clarificationMatchesExpectation: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check health and Gemini status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setGeminiConfigured(Boolean(data.geminiConfigured));
      })
      .catch(err => console.warn('Health check warning:', err));
  }, []);

  // Voice Interaction Hook
  const voice = useVoice((transcribedText) => {
    // When final voice transcript arrives
    if (transcribedText) {
      setCurrentQuery(transcribedText);
    }
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  // Execute query through multi-agent pipeline
  const processQuery = async (queryText: string, clarificationAnswer?: string) => {
    if (!queryText.trim() || isLoading) return;

    // Interrupt any ongoing speech playback
    voice.stopSpeaking();

    const turnId = `turn-${Date.now()}`;
    const userQuery = queryText.trim();
    setIsLoading(true);

    // Optimistically record user turn if not answering clarification
    if (!clarificationAnswer) {
      const pendingTurn: ConversationTurn = {
        id: turnId,
        timestamp: Date.now(),
        role: 'user',
        query: userQuery
      };
      setHistory(prev => [...prev, pendingTurn]);
      setCurrentQuery('');
    }

    try {
      const response = await fetch('/api/agents/process-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          history,
          clarificationAnswer
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: QueryResolutionResponse = await response.json();

      // Update memory context in state
      if (data.memoryContext) {
        setMemoryContext(data.memoryContext);
      }

      if (data.clarificationNeeded && data.clarification) {
        // Clarification Agent flagged query as ambiguous or incomplete
        const clarTurn: ConversationTurn = {
          id: `clar-${Date.now()}`,
          timestamp: Date.now(),
          role: 'clarification_prompt',
          query: userQuery,
          clarificationQuestion: data.clarification.clarificationQuestion,
          clarificationOptions: data.clarification.suggestedOptions,
          clarificationType: data.clarification.ambiguityType,
          clarificationReason: data.clarification.reason,
          confidenceScore: data.confidenceScore,
          confidenceRating: data.confidenceRating,
          memoryContext: data.memoryContext
        };
        setHistory(prev => [...prev, clarTurn]);
      } else {
        // Successful Response Generation
        const assistantTurn: ConversationTurn = {
          id: `asst-${Date.now()}`,
          timestamp: Date.now(),
          role: 'assistant',
          query: userQuery,
          refinedQuery: data.refinedQuery,
          answer: data.answer,
          retrievedChunks: data.retrievedChunks,
          citations: data.citations,
          confidenceScore: data.confidenceScore,
          confidenceRating: data.confidenceRating,
          confidenceReason: data.confidenceReason,
          insufficientEvidence: data.insufficientEvidence,
          memoryContext: data.memoryContext,
          latency: data.latency
        };

        setHistory(prev => [...prev, assistantTurn]);

        // Auto-open transparency panel for the latest response
        setOpenTransparency(prev => ({ ...prev, [assistantTurn.id]: true }));

        // If Auto-Speak is enabled, read the answer aloud
        if (voice.voiceState.autoSpeak && data.answer) {
          voice.speakText(data.answer);
        }
      }
    } catch (err: any) {
      console.error('Query processing error:', err);
      const errorTurn: ConversationTurn = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        role: 'assistant',
        query: userQuery,
        answer: `I encountered a communication issue while processing the query. Please verify that the local service is running and try again. (${err?.message || 'Network error'})`,
        confidenceScore: 0,
        confidenceRating: 'Low',
        confidenceReason: 'Error occurred during pipeline execution',
        insufficientEvidence: true,
        retrievedChunks: []
      };
      setHistory(prev => [...prev, errorTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Clarification submission
  const handleClarificationResponse = (answer: string, originalQuery: string) => {
    processQuery(originalQuery, answer);
  };

  // Reset conversation session
  const handleResetSession = () => {
    voice.stopSpeaking();
    voice.stopListening();
    setHistory([]);
    setMemoryContext(undefined);
    setOpenTransparency({});
    setSelectedChunkId(null);
    setLastTestResult(null);
  };

  // Run Benchmark Test
  const handleRunTest = async (testItem: TestCaseItem) => {
    setActiveTestId(testItem.id);
    setIsLoading(true);

    // Prepare simulated history for context-dependent tests
    let simulatedHistory: ConversationTurn[] = [];
    if (testItem.category === 'context_followup') {
      simulatedHistory = [
        {
          id: 'prev-1',
          timestamp: Date.now() - 60000,
          role: 'user',
          query: 'What is the SOC 2 Type II audit log retention standard?'
        },
        {
          id: 'prev-2',
          timestamp: Date.now() - 30000,
          role: 'assistant',
          query: 'What is the SOC 2 Type II audit log retention standard?',
          answer: 'Under SOC 2 Type II and ISO 27001, audit logs must be preserved for 7 years in immutable WORM storage.',
          confidenceScore: 95,
          confidenceRating: 'High',
          retrievedChunks: [
            {
              id: 'chunk-sec-01',
              documentId: 'doc-soc2-policy',
              documentTitle: 'Corporate Information Security & Data Governance Policy',
              section: '§6.1 Audit Log & Evidence Retention Schedule',
              page: 15,
              domain: 'Cybersecurity & Compliance',
              content: 'All authentication logs and audit trails must be retained in WORM S3 buckets for 7 years.',
              similarityScore: 0.95,
              citationRef: '[Doc 4, §6.1]',
              keywords: ['soc 2', 'retention', 'audit logs']
            }
          ]
        }
      ];
      setHistory(simulatedHistory);
    }

    try {
      const response = await fetch('/api/test-cases/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testItem.id,
          simulatedHistory
        })
      });

      const data = await response.json();
      setLastTestResult(data);

      // Append result to chat history
      if (data.result.clarificationNeeded && data.result.clarification) {
        setHistory(prev => [
          ...prev,
          {
            id: `test-user-${Date.now()}`,
            timestamp: Date.now(),
            role: 'user',
            query: testItem.query
          },
          {
            id: `test-clar-${Date.now()}`,
            timestamp: Date.now(),
            role: 'clarification_prompt',
            query: testItem.query,
            clarificationQuestion: data.result.clarification.clarificationQuestion,
            clarificationOptions: data.result.clarification.suggestedOptions,
            clarificationType: data.result.clarification.ambiguityType,
            clarificationReason: data.result.clarification.reason,
            confidenceScore: data.result.confidenceScore,
            confidenceRating: data.result.confidenceRating,
            memoryContext: data.result.memoryContext
          }
        ]);
      } else {
        const asstId = `test-asst-${Date.now()}`;
        setHistory(prev => [
          ...prev,
          {
            id: `test-user-${Date.now()}`,
            timestamp: Date.now(),
            role: 'user',
            query: testItem.query
          },
          {
            id: asstId,
            timestamp: Date.now(),
            role: 'assistant',
            query: testItem.query,
            refinedQuery: data.result.refinedQuery,
            answer: data.result.answer,
            retrievedChunks: data.result.retrievedChunks,
            citations: data.result.citations,
            confidenceScore: data.result.confidenceScore,
            confidenceRating: data.result.confidenceRating,
            confidenceReason: data.result.confidenceReason,
            insufficientEvidence: data.result.insufficientEvidence,
            memoryContext: data.result.memoryContext,
            latency: data.result.latency
          }
        ]);
        setOpenTransparency(prev => ({ ...prev, [asstId]: true }));
      }

      if (data.result.memoryContext) {
        setMemoryContext(data.result.memoryContext);
      }
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      setIsLoading(false);
      setActiveTestId(null);
    }
  };

  // Render text with interactive citation badges
  const renderTextWithCitations = (text: string, turnId: string, chunks?: any[]) => {
    // Regex matches [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);
    return (
      <span>
        {parts.map((part, i) => {
          const match = part.match(/\[(\d+)\]/);
          if (match) {
            const citationIndex = parseInt(match[1], 10) - 1;
            const targetChunk = chunks && chunks[citationIndex];
            const isSelected = targetChunk && selectedChunkId === targetChunk.id;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (targetChunk) {
                    setSelectedChunkId(isSelected ? null : targetChunk.id);
                    setOpenTransparency(prev => ({ ...prev, [turnId]: true }));
                  }
                }}
                title={targetChunk ? `Jump to Evidence: ${targetChunk.documentTitle} (${targetChunk.section})` : 'Citation'}
                className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-mono font-bold transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 scale-105'
                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                }`}
              >
                {part}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  // Latest assistant response text for voice playback
  const lastAssistantTurn = [...history].reverse().find(t => t.role === 'assistant' && t.answer);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <Navbar
        geminiConfigured={geminiConfigured}
        activeDomain={memoryContext?.activeDomain || null}
        onResetSession={handleResetSession}
        onOpenKnowledgeBase={() => setKbModalOpen(true)}
        onToggleBenchmarks={() => setBenchmarksOpen(!benchmarksOpen)}
        benchmarksOpen={benchmarksOpen}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 flex flex-col gap-4">
        {/* Benchmarks Validation Hub (Collapsible drawer/accordion) */}
        {benchmarksOpen && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <BenchmarkRunner
              onRunTest={handleRunTest}
              isRunning={isLoading}
              activeTestId={activeTestId}
              lastTestResult={lastTestResult}
            />
          </div>
        )}

        {/* Core Layout: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Left Column: Chat Conversation Thread */}
          <div className="lg:col-span-8 flex flex-col h-[calc(100vh-140px)] min-h-[550px] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50/60 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                <span>Multi-Agent Conversation Pipeline</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{history.length} turns in memory</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-500">M3.1 • M3.2 • M3.3 • M3.4 Ready</span>
              </div>
            </div>

            {/* Conversation Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                /* Empty State / Welcome Screen */
                <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 max-w-md mx-auto">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100 shadow-xs">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Enterprise Knowledge Retrieval Platform
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Powered by <strong>Clarification Agent (M3.1)</strong> for ambiguity detection, <strong>Conversation Memory Agent (M3.2)</strong> for multi-turn continuity, <strong>Web Speech API (M3.3)</strong>, and <strong>Response Transparency Panel (M3.4)</strong>.
                  </p>

                  {/* Suggested Query Buttons */}
                  <div className="mt-5 w-full space-y-1.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block px-1">
                      Try an initial query:
                    </span>
                    {SUGGESTED_QUERIES.map((query, i) => (
                      <button
                        key={i}
                        id={`suggested-query-${i}`}
                        onClick={() => processQuery(query)}
                        className="w-full text-left rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-900 transition-colors flex items-center justify-between group"
                      >
                        <span className="font-medium">"{query}"</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Render Conversation Turns */
                history.map((turn, index) => (
                  <div key={turn.id} className="space-y-3">
                    {/* User Message */}
                    {turn.role === 'user' && (
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-2.5 text-xs text-white shadow-xs">
                          <p className="font-medium leading-relaxed">{turn.query}</p>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Clarification Agent Prompt Card (M3.1) */}
                    {turn.role === 'clarification_prompt' && (
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-bold">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1 max-w-[92%]">
                          <ClarificationCard
                            clarification={{
                              isAmbiguous: true,
                              ambiguityType: turn.clarificationType || 'missing_context',
                              ambiguityScore: 0.85,
                              reason: turn.clarificationReason || 'Ambiguity detected in user query.',
                              clarificationQuestion: turn.clarificationQuestion || 'Please provide clarification:',
                              suggestedOptions: turn.clarificationOptions || [],
                              originalQuery: turn.query
                            }}
                            originalQuery={turn.query}
                            onClarify={(answer) => handleClarificationResponse(answer, turn.query)}
                            isLoading={isLoading}
                          />
                        </div>
                      </div>
                    )}

                    {/* Assistant Grounded Response (M3.4) */}
                    {turn.role === 'assistant' && (
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex-1 max-w-[92%] space-y-2">
                          <div className="rounded-2xl rounded-tl-xs border border-slate-200 bg-white p-4 text-xs text-slate-800 shadow-2xs">
                            {/* Refined Query indicator if user answered clarification */}
                            {turn.refinedQuery && (
                              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] text-amber-800">
                                <span className="font-semibold">Refined from Clarification:</span>
                                <span className="italic">"{turn.refinedQuery}"</span>
                              </div>
                            )}

                            {/* Grounded Natural Language Answer with Citations */}
                            <div className="font-normal leading-relaxed text-slate-800 text-[13px] whitespace-pre-line">
                              {renderTextWithCitations(turn.answer || '', turn.id, turn.retrievedChunks)}
                            </div>

                            {/* Response Metadata & Vocal Control Bar */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                                  turn.confidenceRating === 'High'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : turn.confidenceRating === 'Medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>{turn.confidenceRating} Confidence ({turn.confidenceScore}%)</span>
                                </span>

                                {turn.latency && (
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {turn.latency.totalMs}ms
                                  </span>
                                )}
                              </div>

                              {/* Text-to-Speech Play button for this response */}
                              {turn.answer && (
                                <button
                                  type="button"
                                  onClick={() => voice.speakText(turn.answer!)}
                                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  <Mic className="h-3 w-3" />
                                  <span>Listen Aloud</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Response Transparency Panel (M3.4) */}
                          {turn.retrievedChunks && turn.retrievedChunks.length > 0 && (
                            <TransparencyPanel
                              retrievedChunks={turn.retrievedChunks}
                              citations={turn.citations || []}
                              confidenceScore={turn.confidenceScore || 0}
                              confidenceRating={turn.confidenceRating || 'Medium'}
                              confidenceReason={turn.confidenceReason || ''}
                              insufficientEvidence={Boolean(turn.insufficientEvidence)}
                              latency={turn.latency}
                              selectedChunkId={selectedChunkId}
                              onSelectChunk={setSelectedChunkId}
                              isOpen={Boolean(openTransparency[turn.id])}
                              onToggle={() =>
                                setOpenTransparency(prev => ({
                                  ...prev,
                                  [turn.id]: !prev[turn.id]
                                }))
                              }
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white animate-spin">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </div>
                  <span>Clarification, Memory & Retrieval Agents coordinating...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Query Input Bar */}
            <div className="border-t border-slate-200 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processQuery(currentQuery);
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input & Speech Controls (M3.3) */}
                <VoiceControls
                  voiceState={voice.voiceState}
                  availableVoices={voice.availableVoices}
                  onStartListening={voice.startListening}
                  onStopListening={voice.stopListening}
                  onSpeak={voice.speakText}
                  onPauseSpeech={voice.pauseSpeaking}
                  onResumeSpeech={voice.resumeSpeaking}
                  onStopSpeech={voice.stopSpeaking}
                  onSetVoice={voice.setVoice}
                  onSetPlaybackRate={voice.setPlaybackRate}
                  onToggleAutoSpeak={voice.toggleAutoSpeak}
                  onClearError={voice.clearError}
                  onSendTranscript={(transcriptText) => {
                    setCurrentQuery(transcriptText);
                    processQuery(transcriptText);
                  }}
                  currentResponseText={lastAssistantTurn?.answer}
                />

                {/* Text Input Field */}
                <input
                  id="query-text-input"
                  type="text"
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  placeholder="Ask an enterprise question or click mic to speak..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                />

                {/* Submit Button */}
                <button
                  id="send-query-button"
                  type="submit"
                  disabled={!currentQuery.trim() || isLoading}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  <span>Ask</span>
                  <Send className="h-3.5 w-3.5 ml-1.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Memory Agent Inspector & System Telemetry */}
          <div className="lg:col-span-4 space-y-4">
            {/* Conversation Memory Agent Inspector (M3.2) */}
            <MemoryInspector
              memoryContext={memoryContext}
              onClearMemory={handleResetSession}
              turnCount={history.length}
            />

            {/* Architecture Overview Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-xs space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                <span>Milestone 3 Architecture</span>
              </h4>

              <div className="space-y-2 text-[11px] text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-800">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-800">Clarification Agent (M3.1):</strong> Detects ambiguous queries, multi-part requirements, and formulates targeted follow-up prompts before retrieval.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-indigo-100 text-[10px] font-bold text-indigo-800">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-800">Conversation Memory (M3.2):</strong> Resolves pronouns and coreference ("its retention", "that tier") while isolating session memory from permanent knowledge.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-purple-100 text-[10px] font-bold text-purple-800">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-800">Web Speech Module (M3.3):</strong> Real-time microphone capture with audio waveform, TTS speech playback, and browser error fallbacks.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-100 text-[10px] font-bold text-emerald-800">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-800">Transparency Panel (M3.4):</strong> Inspectable evidence drawer, similarity scores, citation linking [1], and confidence scoring.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Permanent Knowledge Base Explorer Modal */}
      <KnowledgeBaseModal
        isOpen={kbModalOpen}
        onClose={() => setKbModalOpen(false)}
      />
    </div>
  );
}
