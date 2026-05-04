const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (!process.env.CLAUDE_API_KEY) {
  console.error('CLAUDE_API_KEY is required');
  process.exit(1);
}

const { Anthropic } = require('@anthropic-ai/sdk');
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const app = express();
const PORT = 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

app.get('/', (req, res) => {
  log('Serving index.html');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  log('Chat request received');
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    log('Fetching contexts...');
    const contextsRes = await fetch('http://localhost:3000/api/v2/contexts');
    if (!contextsRes.ok) {
      throw new Error(`Failed to fetch contexts: ${contextsRes.status}`);
    }
    const contexts = await contextsRes.json();

    const prompt = `Você é um assistente com conhecimento completo do projeto. Use os seguintes contextos para responder:\n\nContextos do projeto:\n${JSON.stringify(contexts, null, 2)}\n\nPergunta do usuário: ${message}\n\nResponda de forma útil, usando o conhecimento dos contextos.`;

    log('Sending to Claude...');
    const claudeRes = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = claudeRes.content[0].text;
    log('Claude response sent');
    res.json({ reply });
  } catch (error) {
    log(`Chat error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/context', async (req, res) => {
  log('Context request');
  try {
    const resp = await fetch('http://localhost:3000/api/v2/contexts');
    if (!resp.ok) {
      throw new Error(`Failed: ${resp.status}`);
    }
    const data = await resp.json();
    res.json(data);
  } catch (error) {
    log(`Context error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  log('Sync request');
  try {
    const { filePath, fileContent, commitMessage } = req.body;
    if (!filePath || !fileContent || !commitMessage) {
      return res.status(400).json({ error: 'filePath, fileContent, and commitMessage are required' });
    }

    const resp = await fetch('http://localhost:3000/api/v2/github/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, fileContent, commitMessage }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Sync failed: ${resp.status} ${errText}`);
    }

    const data = await resp.json();
    res.json(data);
  } catch (error) {
    log(`Sync error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync/status', async (req, res) => {
  log('Sync status request');
  try {
    const resp = await fetch('http://localhost:3000/api/v2/github/status');
    if (!resp.ok) {
      throw new Error(`Status failed: ${resp.status}`);
    }
    const data = await resp.json();
    res.json(data);
  } catch (error) {
    log(`Status error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});