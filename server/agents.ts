import { GoogleGenAI } from '@google/genai';
import { 
  DocumentChunk, 
  ClarificationDetection, 
  MemoryContextResolution, 
  QueryResolutionResponse, 
  ConversationTurn,
  MultiPartRequirement,
  CitationReference,
  DomainType
} from '../src/types';
import { PERMANENT_KNOWLEDGE_BASE } from '../src/data/knowledgeBase';

// Initialize Gemini SDK lazily if API key is present
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// ==========================================
// M3.1: CLARIFICATION AGENT
// ==========================================
export class ClarificationAgent {
  /**
   * Analyze user query for ambiguity, incompleteness, or multi-part conflicts
   */
  static analyze(
    query: string, 
    memoryContext?: MemoryContextResolution
  ): ClarificationDetection {
    const qLower = query.toLowerCase().trim();

    // 1. Detect multi-part query components
    const multiParts = this.decomposeMultiPart(query);

    // If query has coreference/follow-up indicators that are ALREADY resolved by memory, skip ambiguity
    if (memoryContext && memoryContext.contextSufficiency === 'sufficient' && (
      qLower.startsWith('what about') || 
      qLower.startsWith('and for') || 
      qLower.includes(' its ') || 
      qLower.includes(' it ')
    )) {
      return {
        isAmbiguous: false,
        ambiguityType: 'none',
        ambiguityScore: 0.1,
        reason: 'Contextual follow-up successfully resolved using Conversation Memory Agent.',
        clarificationQuestion: '',
        suggestedOptions: [],
        originalQuery: query,
        multiParts
      };
    }

    // 2. Ambiguity Pattern Checks
    // A: Incomplete / Too generic
    if (
      qLower === 'tell me about compliance' || 
      qLower === 'compliance' || 
      qLower === 'what are the rules?' || 
      qLower === 'rules' || 
      qLower === 'what are the policies?' ||
      (qLower.split(/\s+/).length <= 3 && (qLower.includes('policy') || qLower.includes('standard') || qLower.includes('help')))
    ) {
      return {
        isAmbiguous: true,
        ambiguityType: 'incomplete_request',
        ambiguityScore: 0.95,
        reason: 'Query is overly broad and lacks domain, framework, or operational scope.',
        clarificationQuestion: 'Which regulatory standard or operational domain would you like information on?',
        suggestedOptions: [
          'SOC 2 Type II Security & Audit Policy',
          'HIPAA Protected Health Information (PHI) Rules',
          'PCI-DSS 4.0 Payment Cardholder Standards',
          'Enterprise Cloud Disaster Recovery Guidelines'
        ],
        originalQuery: query,
        multiParts
      };
    }

    // B: Missing Context / Ambiguous Scope on Data Retention
    if (
      qLower.includes('retention') && 
      !qLower.includes('audit log') && 
      !qLower.includes('telemetry') && 
      !qLower.includes('soc 2') && 
      !qLower.includes('hipaa') && 
      !qLower.includes('database')
    ) {
      return {
        isAmbiguous: true,
        ambiguityType: 'missing_context',
        ambiguityScore: 0.88,
        reason: 'Multiple retention schedules exist across our standards (SOC 2 audit logs, system telemetry, and patient health records).',
        clarificationQuestion: 'Which data retention schedule are you inquiring about?',
        suggestedOptions: [
          'SOC 2 Audit & Financial Transaction Logs (7-year WORM storage)',
          'System Telemetry & Debug Logs (90-day archive)',
          'Clinical EMR & Patient PHI Records under HIPAA'
        ],
        originalQuery: query,
        multiParts
      };
    }

    // C: Unclear Terminology / Underspecified System (Failover)
    if (
      qLower.includes('failover') && 
      !qLower.includes('region') && 
      !qLower.includes('database') && 
      !qLower.includes('dns') && 
      !qLower.includes('k8s') && 
      !qLower.includes('postgresql')
    ) {
      return {
        isAmbiguous: true,
        ambiguityType: 'unclear_terminology',
        ambiguityScore: 0.84,
        reason: 'System failover encompasses both automated Cloud DNS multi-region routing and PostgreSQL primary replica promotion.',
        clarificationQuestion: 'Are you looking for Automated Multi-Region DNS failover or Database replica promotion procedures?',
        suggestedOptions: [
          'Cloud DNS Multi-Region Active-Passive Failover (30s health-check threshold)',
          'PostgreSQL Tier-1 Synchronous Replication & Primary Promotion (RTO ≤ 15m)'
        ],
        originalQuery: query,
        multiParts
      };
    }

    // D: Unclear Terminology (Encryption)
    if (
      qLower === 'what is the encryption standard?' || 
      qLower === 'how do we encrypt data?' ||
      (qLower.includes('encryption standard') && !qLower.includes('transit') && !qLower.includes('rest') && !qLower.includes('kms'))
    ) {
      return {
        isAmbiguous: true,
        ambiguityType: 'multiple_interpretations',
        ambiguityScore: 0.82,
        reason: 'Encryption policies distinguish strictly between In-Transit requirements (TLS 1.3) and At-Rest volume storage (AES-256-GCM / KMS).',
        clarificationQuestion: 'Do you need standards for Data in Transit, Data at Rest, or KMS Key Rotation?',
        suggestedOptions: [
          'Data in Transit (TLS 1.3 with forward secrecy ciphers)',
          'Data at Rest (AES-256-GCM hardware security module keys)',
          'KMS Customer Managed Key (CMK) annual rotation requirements'
        ],
        originalQuery: query,
        multiParts
      };
    }

    // E: Multi-part query requiring clarification if one part is conflicting or unclear
    if (multiParts.some(p => !p.canResolveDirectly)) {
      const unclearPart = multiParts.find(p => !p.canResolveDirectly)!;
      return {
        isAmbiguous: true,
        ambiguityType: 'multipart_conflict',
        ambiguityScore: 0.78,
        reason: `Multi-part query contains an ambiguous component: "${unclearPart.text}".`,
        clarificationQuestion: `You asked multiple questions. Before resolving, could you clarify: ${unclearPart.note}`,
        suggestedOptions: [
          'Resolve the primary requirement first',
          'Provide specific tier/scope for the second question'
        ],
        originalQuery: query,
        multiParts
      };
    }

    // Clear query
    return {
      isAmbiguous: false,
      ambiguityType: 'none',
      ambiguityScore: 0.05,
      reason: 'Query is specific, well-bounded, and directly resolvable against the knowledge repository.',
      clarificationQuestion: '',
      suggestedOptions: [],
      originalQuery: query,
      multiParts
    };
  }

  /**
   * Decompose multi-part queries
   */
  static decomposeMultiPart(query: string): MultiPartRequirement[] {
    const parts: MultiPartRequirement[] = [];
    const separators = /\b(and also|and how|and what|and who|as well as|additionally|, and)\b/i;
    
    if (separators.test(query)) {
      const rawChunks = query.split(separators).filter(s => s.trim().length > 3 && !s.match(/^and/i) && !s.match(/^as well/i));
      rawChunks.forEach((chunkText, idx) => {
        const trimmed = chunkText.trim();
        const isGeneric = trimmed.length < 15 && (trimmed.includes('how') || trimmed.includes('what'));
        parts.push({
          id: `part-${idx + 1}`,
          text: trimmed,
          canResolveDirectly: !isGeneric,
          resolutionStrategy: 'resolve_together',
          note: isGeneric ? 'Requires additional context or domain specification' : 'Can be mapped directly to knowledge chunks'
        });
      });
    }

    return parts;
  }

  /**
   * Refines original query with the user's clarification response
   */
  static refineQuery(originalQuery: string, clarificationAnswer: string): string {
    const cleanOrig = originalQuery.trim().replace(/\?+$/, '');
    const cleanAnswer = clarificationAnswer.trim();
    return `${cleanOrig} specifically focused on: ${cleanAnswer}`;
  }
}

// ==========================================
// M3.2: CONVERSATION MEMORY AGENT
// ==========================================
export class ConversationMemoryAgent {
  /**
   * Maintain context across multi-turn interactions
   * Resolves follow-up queries (pronouns, coreference) and prunes irrelevant context
   */
  static resolveContext(
    query: string,
    history: ConversationTurn[]
  ): MemoryContextResolution {
    const qLower = query.toLowerCase().trim();
    let resolvedQuery = query;
    let activeTopic: string | null = null;
    let activeDomain: DomainType | null = null;
    const trackedEntities: string[] = [];

    // Extract recent assistant/user turns (only successful completed turns with answers or queries)
    const validHistory = history.filter(t => t.answer && t.query);

    // Identify active domain & topic from most recent turns
    if (validHistory.length > 0) {
      const lastTurn = validHistory[validHistory.length - 1];
      if (lastTurn.retrievedChunks && lastTurn.retrievedChunks.length > 0) {
        activeDomain = lastTurn.retrievedChunks[0].domain;
        activeTopic = lastTurn.retrievedChunks[0].documentTitle;
      }
      // Collect entities mentioned in history
      validHistory.forEach(t => {
        if (t.retrievedChunks) {
          t.retrievedChunks.forEach(c => {
            c.keywords.forEach(k => {
              if (!trackedEntities.includes(k)) trackedEntities.push(k);
            });
          });
        }
      });
    }

    // Check if query is explicitly switching topics/domains
    const isDomainSwitch = 
      qLower.includes('now switch to') || 
      qLower.includes('let us talk about') || 
      qLower.includes('switch to banking') || 
      qLower.includes('switch to healthcare') || 
      qLower.includes('change topic to');

    if (isDomainSwitch) {
      if (qLower.includes('banking') || qLower.includes('fintech') || qLower.includes('pci') || qLower.includes('aml')) {
        activeDomain = 'FinTech & Banking';
      } else if (qLower.includes('health') || qLower.includes('hipaa') || qLower.includes('clinical')) {
        activeDomain = 'Healthcare & HIPAA';
      } else if (qLower.includes('security') || qLower.includes('soc 2') || qLower.includes('incident')) {
        activeDomain = 'Cybersecurity & Compliance';
      } else if (qLower.includes('cloud') || qLower.includes('devops') || qLower.includes('k8s')) {
        activeDomain = 'DevOps & Cloud';
      }
    }

    // Coreference & Pronoun resolution
    let contextSufficiency: 'sufficient' | 'partial' | 'missing' = 'sufficient';
    let contextWarning: string | undefined;

    const coreferenceKeywords = [' its ', ' it ', ' that ', ' this ', ' these ', ' those ', ' them ', 'the second one'];
    const hasPronoun = coreferenceKeywords.some(p => ` ${qLower} `.includes(p)) || 
      qLower.startsWith('what about') || 
      qLower.startsWith('how long do we keep') || 
      qLower.startsWith('how often') ||
      qLower.startsWith('and for');

    if (hasPronoun && !isDomainSwitch) {
      if (validHistory.length === 0) {
        contextSufficiency = 'missing';
        contextWarning = 'Current query refers to previous context ("it/that"), but no prior conversation turns were found.';
      } else {
        const lastTurn = validHistory[validHistory.length - 1];
        const lastSubject = lastTurn.query;
        const lastChunkTitle = lastTurn.retrievedChunks?.[0]?.section || lastTurn.retrievedChunks?.[0]?.documentTitle || 'previous subject';

        // Reconstruct resolved query
        if (qLower.includes('retention') && lastTurn.query.toLowerCase().includes('soc 2')) {
          resolvedQuery = 'What is the data retention policy for SOC 2 Type II audit logs and financial records?';
        } else if (qLower.includes('retention') && lastTurn.query.toLowerCase().includes('telemetry')) {
          resolvedQuery = 'What is the retention policy for system telemetry and debug logs?';
        } else if (qLower.startsWith('what about its') || qLower.startsWith('what is its')) {
          const attribute = qLower.replace(/what (about|is) its /, '').trim();
          resolvedQuery = `What is the ${attribute} for ${lastChunkTitle}?`;
        } else if (qLower.startsWith('and for tier-2')) {
          resolvedQuery = 'What are the RTO and RPO specifications for Tier-2 analytical workloads?';
        } else if (qLower.includes('who approves that') || qLower.includes('who escalates')) {
          resolvedQuery = `Who is notified or escalates during ${lastSubject}?`;
        } else {
          resolvedQuery = `${query} (in context of: ${lastChunkTitle})`;
        }
      }
    }

    // Score previous history items for relevance & token budget management
    const scoredHistory = validHistory.map(turn => {
      let score = 0.2; // base score for recency
      const matchWords = (turn.query + ' ' + (turn.answer || '')).toLowerCase();
      
      // Entity matches
      const matched = trackedEntities.filter(ent => qLower.includes(ent) && matchWords.includes(ent));
      score += matched.length * 0.25;

      // Recency boost for last turn
      if (turn === validHistory[validHistory.length - 1]) score += 0.35;

      // Penalize old turns if domain switched
      if (isDomainSwitch && turn.retrievedChunks?.[0]?.domain !== activeDomain) {
        score = 0.05;
      }

      const clampedScore = Math.min(1.0, Math.max(0.05, score));
      return {
        turnId: turn.id,
        role: 'assistant' as const,
        snippet: (turn.answer || '').slice(0, 140) + '...',
        relevanceScore: Number(clampedScore.toFixed(2)),
        entityMatches: matched,
        explanation: score > 0.5 ? 'Strong semantic continuity with current query entity' : 'Background conversational context'
      };
    });

    // Prune excessive or irrelevant history (relevance threshold < 0.3 if more than 3 turns)
    const filteredHistory = scoredHistory.filter(item => item.relevanceScore >= 0.25);
    const prunedCount = scoredHistory.length - filteredHistory.length;

    // Token budget calculation (approx 4 chars per token)
    const historyTokens = filteredHistory.reduce((acc, h) => acc + Math.round(h.snippet.length / 4), 0);
    const maxTokens = 1500;

    return {
      resolvedQuery,
      activeTopic,
      activeDomain,
      trackedEntities: trackedEntities.slice(0, 8),
      relevantHistory: filteredHistory.slice(-4), // keep maximum top 4 relevant turns
      prunedCount,
      tokenBudget: {
        historyTokens,
        maxTokens
      },
      contextSufficiency,
      contextWarning
    };
  }
}

// ==========================================
// M3.4 & RETRIEVAL: KNOWLEDGE RETRIEVAL AGENT
// ==========================================
export class KnowledgeRetrievalAgent {
  /**
   * Hybrid retrieval engine over the permanent knowledge base
   */
  static retrieve(
    query: string, 
    activeDomain?: DomainType | null
  ): { chunks: DocumentChunk[]; insufficient: boolean; confidenceScore: number } {
    const qWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);

    // Score all permanent knowledge base chunks
    const scoredChunks = PERMANENT_KNOWLEDGE_BASE.map(chunk => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      const titleLower = chunk.documentTitle.toLowerCase();
      const sectionLower = chunk.section.toLowerCase();

      // Exact keyword matches
      chunk.keywords.forEach(kw => {
        if (query.toLowerCase().includes(kw)) {
          score += 0.35;
        }
      });

      // Query word matches
      qWords.forEach(word => {
        if (contentLower.includes(word)) score += 0.08;
        if (titleLower.includes(word)) score += 0.12;
        if (sectionLower.includes(word)) score += 0.15;
      });

      // Domain match bonus
      if (activeDomain && chunk.domain === activeDomain) {
        score += 0.15;
      }

      // Clamp score
      const finalScore = Math.min(0.98, Math.max(0.1, score));
      return {
        ...chunk,
        similarityScore: Number(finalScore.toFixed(2))
      };
    });

    // Sort descending by score
    scoredChunks.sort((a, b) => b.similarityScore - a.similarityScore);

    // Take top 3 chunks
    const topChunks = scoredChunks.slice(0, 3);
    const highestScore = topChunks[0]?.similarityScore || 0;

    // Determine confidence and evidence sufficiency
    const insufficient = highestScore < 0.50;
    const confidenceScore = Math.round(highestScore * 100);

    return {
      chunks: topChunks,
      insufficient,
      confidenceScore
    };
  }
}

// ==========================================
// RESPONSE GENERATION AGENT WITH CITATIONS
// ==========================================
export class ResponseGenerationAgent {
  /**
   * Synthesize grounded answer with embedded citation links
   */
  static async generateAnswer(
    query: string,
    resolvedQuery: string,
    chunks: DocumentChunk[],
    confidenceScore: number,
    memoryContext: MemoryContextResolution
  ): Promise<{ answer: string; citations: CitationReference[]; geminiPowered: boolean }> {
    const gemini = getGeminiClient();
    const citations: CitationReference[] = chunks.map((c, i) => ({
      ref: `[${i + 1}]`,
      chunkId: c.id,
      documentTitle: c.documentTitle,
      section: c.section,
      page: c.page,
      matchSnippet: c.content.slice(0, 110) + '...'
    }));

    // If Gemini client is available, leverage server-side Gemini 3.8 Flash
    if (gemini && process.env.GEMINI_API_KEY) {
      try {
        const evidencePrompt = chunks.map((c, i) => 
          `Evidence Chunk [${i + 1}] (${c.documentTitle}, ${c.section}, Page ${c.page}):\n"${c.content}"`
        ).join('\n\n');

        const systemPrompt = `You are the Response Generation Agent in an enterprise knowledge platform.
Your task is to provide an accurate, concise, grounded response to the user's query based ONLY on the provided evidence chunks.
Rules:
1. Cite supporting claims using exact bracket references like [1], [2] corresponding to the evidence chunks.
2. If evidence is insufficient, explicitly state what information is missing.
3. Be professional, direct, and structured. Do not use generic filler.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `User Query: "${resolvedQuery}"\n\nSupporting Evidence:\n${evidencePrompt}\n\nPlease generate a grounded answer with citations.`,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2
          }
        });

        if (response.text && response.text.trim().length > 0) {
          return {
            answer: response.text.trim(),
            citations,
            geminiPowered: true
          };
        }
      } catch (err) {
        console.error('Gemini call fallback to grounded template:', err);
      }
    }

    // Built-in Grounded Template Synthesizer (Zero-Failure Guarantee)
    const primary = chunks[0];
    const secondary = chunks[1];

    let answer = '';
    if (confidenceScore >= 75) {
      answer = `Based on the verified enterprise documentation in **${primary.documentTitle}** (${primary.section}), `;
      answer += `${primary.content} [1]`;
      if (secondary && secondary.similarityScore > 0.6) {
        answer += `\n\nFurthermore, **${secondary.documentTitle}** (${secondary.section}) establishes that: ${secondary.content} [2]`;
      }
    } else if (confidenceScore >= 50) {
      answer = `According to **${primary.documentTitle}** (${primary.section}): ${primary.content} [1]\n\n*(Note: Confidence is moderate. Verify specific organizational parameters for edge-case exceptions.)*`;
    } else {
      answer = `The knowledge repository contains limited evidence regarding this query. The closest available standard is found in **${primary.documentTitle}** (${primary.section}): "${primary.content}" [1]. Additional domain clarification is recommended.`;
    }

    return {
      answer,
      citations,
      geminiPowered: false
    };
  }
}

// ==========================================
// MASTER AGENT ORCHESTRATOR
// ==========================================
export async function executeMultiAgentPipeline(
  query: string,
  history: ConversationTurn[] = [],
  clarificationAnswer?: string
): Promise<QueryResolutionResponse> {
  const startTime = Date.now();
  const latency = {
    clarificationMs: 0,
    memoryMs: 0,
    retrievalMs: 0,
    generationMs: 0,
    totalMs: 0
  };

  const turnId = `turn-${Date.now()}`;

  // Step 1: Conversation Memory Context Resolution
  const memStart = Date.now();
  const memoryContext = ConversationMemoryAgent.resolveContext(query, history);
  latency.memoryMs = Date.now() - memStart;

  // Step 2: Clarification Check (or Refinement if user answered clarification)
  const clarStart = Date.now();
  let effectiveQuery = memoryContext.resolvedQuery;
  let refinedQuery: string | undefined;

  if (clarificationAnswer) {
    refinedQuery = ClarificationAgent.refineQuery(query, clarificationAnswer);
    effectiveQuery = refinedQuery;
  }

  const clarification = ClarificationAgent.analyze(effectiveQuery, memoryContext);
  latency.clarificationMs = Date.now() - clarStart;

  // If clarification is required and no clarification answer was provided yet
  if (clarification.isAmbiguous && !clarificationAnswer) {
    latency.totalMs = Date.now() - startTime;
    return {
      turnId,
      timestamp: Date.now(),
      originalQuery: query,
      clarificationNeeded: true,
      clarification,
      confidenceScore: Math.round((1 - clarification.ambiguityScore) * 100),
      confidenceRating: 'Low',
      confidenceReason: `Clarification required: ${clarification.reason}`,
      insufficientEvidence: true,
      retrievedChunks: [],
      citations: [],
      memoryContext,
      latency
    };
  }

  // Step 3: Retrieval Agent
  const retStart = Date.now();
  const retrievalResult = KnowledgeRetrievalAgent.retrieve(effectiveQuery, memoryContext.activeDomain);
  latency.retrievalMs = Date.now() - retStart;

  // Step 4: Confidence & Rating Assessment
  const confidenceScore = retrievalResult.confidenceScore;
  const confidenceRating: 'High' | 'Medium' | 'Low' = 
    confidenceScore >= 80 ? 'High' : confidenceScore >= 55 ? 'Medium' : 'Low';
  
  const confidenceReason = confidenceRating === 'High'
    ? `Strong semantic alignment (Score: ${confidenceScore}%) with primary policy documents and multi-chunk verification.`
    : confidenceRating === 'Medium'
    ? `Moderate evidence match (Score: ${confidenceScore}%). Key terms matched but some specific parameters require cross-referencing.`
    : `Low similarity score (${confidenceScore}%). Query may fall outside current knowledge corpus bounds.`;

  // Step 5: Response Generation Agent
  const genStart = Date.now();
  const { answer, citations, geminiPowered } = await ResponseGenerationAgent.generateAnswer(
    query,
    effectiveQuery,
    retrievalResult.chunks,
    confidenceScore,
    memoryContext
  );
  latency.generationMs = Date.now() - genStart;
  latency.totalMs = Date.now() - startTime;

  return {
    turnId,
    timestamp: Date.now(),
    originalQuery: query,
    refinedQuery,
    isClarificationResponse: Boolean(clarificationAnswer),
    clarificationNeeded: false,
    clarification,
    answer,
    confidenceScore,
    confidenceRating,
    confidenceReason,
    insufficientEvidence: retrievalResult.insufficient,
    retrievedChunks: retrievalResult.chunks,
    citations,
    memoryContext,
    latency,
    geminiPowered
  };
}
