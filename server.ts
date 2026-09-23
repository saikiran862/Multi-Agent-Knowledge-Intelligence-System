import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { executeMultiAgentPipeline } from './server/agents';
import { PERMANENT_KNOWLEDGE_BASE, BENCHMARK_TEST_CASES } from './src/data/knowledgeBase';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      knowledgeBaseDocs: PERMANENT_KNOWLEDGE_BASE.length,
      testCasesAvailable: BENCHMARK_TEST_CASES.length
    });
  });

  // Query Resolution Endpoint (Handles M3.1 Clarification, M3.2 Memory, M3.4 Transparency)
  app.post('/api/agents/process-query', async (req, res) => {
    try {
      const { query, history, clarificationAnswer } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required.' });
      }

      const response = await executeMultiAgentPipeline(
        query,
        Array.isArray(history) ? history : [],
        typeof clarificationAnswer === 'string' ? clarificationAnswer : undefined
      );

      res.json(response);
    } catch (err: any) {
      console.error('Pipeline Execution Error:', err);
      res.status(500).json({ 
        error: 'Failed to execute multi-agent query resolution.',
        details: err?.message || String(err)
      });
    }
  });

  // Knowledge Base Endpoint
  app.get('/api/knowledge-base', (req, res) => {
    res.json({
      chunks: PERMANENT_KNOWLEDGE_BASE,
      count: PERMANENT_KNOWLEDGE_BASE.length
    });
  });

  // Benchmark Test Cases Endpoint
  app.get('/api/test-cases', (req, res) => {
    res.json({
      testCases: BENCHMARK_TEST_CASES
    });
  });

  // Run Test Case Simulation Endpoint
  app.post('/api/test-cases/run', async (req, res) => {
    try {
      const { testId, simulatedHistory } = req.body;
      const testItem = BENCHMARK_TEST_CASES.find(t => t.id === testId);
      if (!testItem) {
        return res.status(404).json({ error: 'Test case not found.' });
      }

      const response = await executeMultiAgentPipeline(
        testItem.query,
        Array.isArray(simulatedHistory) ? simulatedHistory : []
      );

      res.json({
        testItem,
        result: response,
        clarificationMatchesExpectation: response.clarificationNeeded === testItem.expectedClarification
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Test execution failed' });
    }
  });

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knowledge Platform Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
