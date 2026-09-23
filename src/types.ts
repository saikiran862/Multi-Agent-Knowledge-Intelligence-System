export type DomainType = 
  | 'DevOps & Cloud'
  | 'Cybersecurity & Compliance'
  | 'Healthcare & HIPAA'
  | 'FinTech & Banking';

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  section: string;
  page: number;
  domain: DomainType;
  content: string;
  similarityScore: number;
  citationRef: string;
  keywords: string[];
}

export type AmbiguityType = 
  | 'unclear_terminology'
  | 'missing_context'
  | 'multiple_interpretations'
  | 'incomplete_request'
  | 'multipart_conflict'
  | 'none';

export interface MultiPartRequirement {
  id: string;
  text: string;
  canResolveDirectly: boolean;
  resolutionStrategy: 'resolve_together' | 'needs_clarification' | 'sequential';
  note: string;
}

export interface ClarificationDetection {
  isAmbiguous: boolean;
  ambiguityType: AmbiguityType;
  ambiguityScore: number; // 0 to 1
  reason: string;
  clarificationQuestion: string;
  suggestedOptions: string[];
  originalQuery: string;
  multiParts?: MultiPartRequirement[];
}

export interface RelevantMemoryItem {
  turnId: string;
  role: 'user' | 'assistant';
  snippet: string;
  relevanceScore: number;
  entityMatches: string[];
  explanation: string;
}

export interface MemoryContextResolution {
  resolvedQuery: string;
  activeTopic: string | null;
  activeDomain: DomainType | null;
  trackedEntities: string[];
  relevantHistory: RelevantMemoryItem[];
  prunedCount: number;
  tokenBudget: {
    historyTokens: number;
    maxTokens: number;
  };
  contextSufficiency: 'sufficient' | 'partial' | 'missing';
  contextWarning?: string;
}

export interface CitationReference {
  ref: string; // e.g. "[1]" or "[Doc-1 §3.2]"
  chunkId: string;
  documentTitle: string;
  section: string;
  page: number;
  matchSnippet: string;
}

export interface AgentLatency {
  clarificationMs: number;
  memoryMs: number;
  retrievalMs: number;
  generationMs: number;
  totalMs: number;
}

export interface QueryResolutionResponse {
  turnId: string;
  timestamp: number;
  originalQuery: string;
  refinedQuery?: string;
  isClarificationResponse?: boolean;
  clarificationNeeded: boolean;
  clarification?: ClarificationDetection;
  answer?: string;
  confidenceScore: number; // 0 to 100
  confidenceRating: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  insufficientEvidence: boolean;
  retrievedChunks: DocumentChunk[];
  citations: CitationReference[];
  memoryContext: MemoryContextResolution;
  latency: AgentLatency;
  geminiPowered?: boolean;
}

export interface ConversationTurn {
  id: string;
  timestamp: number;
  role: 'user' | 'assistant' | 'clarification_prompt';
  query: string;
  refinedQuery?: string;
  answer?: string;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
  clarificationAnswer?: string;
  clarificationType?: AmbiguityType;
  clarificationReason?: string;
  retrievedChunks?: DocumentChunk[];
  citations?: CitationReference[];
  confidenceScore?: number;
  confidenceRating?: 'High' | 'Medium' | 'Low';
  confidenceReason?: string;
  insufficientEvidence?: boolean;
  memoryContext?: MemoryContextResolution;
  latency?: AgentLatency;
  isAudioGenerated?: boolean;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  selectedVoiceName: string | null;
  playbackRate: number;
  autoSpeak: boolean;
}

export interface TestCaseItem {
  id: string;
  title: string;
  category: 'ambiguous' | 'incomplete' | 'multipart' | 'context_followup' | 'context_switch';
  domain: DomainType;
  query: string;
  expectedClarification: boolean;
  expectedBehavior: string;
  suggestedFollowUp?: string;
  description: string;
}
