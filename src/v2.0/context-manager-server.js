require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3000;
const CONTEXT_DIR = path.join(__dirname, '../../context-files');
const AGENTS_DIR = path.join(__dirname, '../../agents');

let contexts = [];

const log = (msg) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ContextManager: ${msg}`);
};

// Middleware para log de requests
app.use((req, res, next) => {
  log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(cors());

// Função para carregar contextos
async function loadContexts() {
  log('Loading contexts from ' + path.relative(__dirname, CONTEXT_DIR));
  try {
    await fs.access(CONTEXT_DIR);
  } catch {
    log('context-files directory not found, skipping load');
    return;
  }
  try {
    const files = await fs.readdir(CONTEXT_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    log(`Found ${jsonFiles.length} JSON files`);
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(CONTEXT_DIR, file);
        const dataStr = await fs.readFile(filePath, 'utf8');
        const ctxData = JSON.parse(dataStr);
        const id = path.basename(file, '.json');
        contexts.push({ id, ...ctxData });
        log(`Loaded context: ${id}`);
      } catch (parseErr) {
        log(`Failed to parse ${file}: ${parseErr.message}`);
      }
    }
    log(`Total contexts loaded: ${contexts.length}`);
  } catch (err) {
    log(`Error reading context-files: ${err.message}`);
  }
}

// Funções para agents
async function getAgents() {
  try {
    await fs.access(AGENTS_DIR);
    const entries = await fs.readdir(AGENTS_DIR, { withFileTypes: true });
    const agents = entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    return agents;
  } catch (err) {
    log(`Agents directory error: ${err.message}`);
    return [];
  }
}

async function getAgentFiles(agent) {
  const agentPath = path.join(AGENTS_DIR, agent);
  const files = await fs.readdir(agentPath).catch(() => {
    throw new Error('Agent directory not found');
  });
  return files;
}

async function analyzeAgent(agent) {
  const agentPath = path.join(AGENTS_DIR, agent);
  try {
    const files = await fs.readdir(agentPath);
    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(agentPath, file);
      const stat = await fs.stat(filePath);
      totalSize += stat.size;
    }
    return { totalFiles: files.length, totalSize };
  } catch (err) {
    throw new Error('Agent not found');
  }
}

// Endpoints existentes
app.get('/agents', async (req, res) => {
  const agents = await getAgents();
  res.json({ agents });
});

app.get('/scan/:agent', async (req, res) => {
  const { agent } = req.params;
  try {
    const files = await getAgentFiles(agent);
    res.json({ files });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/analyze/:agent', async (req, res) => {
  const { agent } = req.params;
  try {
    const stats = await analyzeAgent(agent);
    res.json({ stats });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Endpoints de contextos
app.get('/api/v2/contexts', (req, res) => {
  res.json(contexts);
});

app.post('/api/v2/contexts', (req, res) => {
  const { name, description, content } = req.body;
  if (!name || !description || !content) {
    return res.status(400).json({ error: 'Missing required fields: name, description, content' });
  }
  const id = `ctx_${Date.now()}`;
  const newCtx = { id, name, description, content };
  contexts.push(newCtx);
  log(`Added new context: ${name} (${id})`);
  res.status(201).json(newCtx);
});

app.put('/api/v2/contexts/:id', (req, res) => {
  const id = req.params.id;
  const index = contexts.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Context not found' });
  }
  const updatedCtx = { ...contexts[index], ...req.body };
  contexts[index] = updatedCtx;
  log(`Updated context: ${id}`);
  res.json(updatedCtx);
});

app.delete('/api/v2/contexts/:id', (req, res) => {
  const id = req.params.id;
  const index = contexts.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Context not found' });
  }
  const deleted = contexts.splice(index, 1)[0];
  log(`Deleted context: ${id}`);
  res.json({ success: true, deleted });
});

// Endpoints GitHub
app.get('/api/v2/github/status', (req, res) => {
  res.json({ connected: true, message: 'GitHub integration ready' });
});

app.post('/api/v2/github/sync', async (req, res) => {
  const { filePath, fileContent, commitMessage } = req.body;
  if (!filePath || !fileContent || !commitMessage) {
    return res.status(400).json({ error: 'Missing required fields: filePath, fileContent, commitMessage' });
  }
  const fullPath = path.join(CONTEXT_DIR, filePath);
  try {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, fileContent);
    log(`Synced file: ${filePath}, commit: ${commitMessage}`);
    res.json({ success: true, message: 'File synced successfully' });
  } catch (err) {
    log(`GitHub sync error for ${filePath}: ${err.message}`);
    res.status(500).json({ error: 'Failed to sync file' });
  }
});

// Handlers de erro
googleapisapp.use((error, req, res, next) => {
  log(`Internal server error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Iniciar servidor
async function startServer() {
  try {
    await loadContexts();
    app.listen(PORT, () => {
      log(`ContextManager server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    log(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

startServer();