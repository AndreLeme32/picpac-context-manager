const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// CORS para permitir requisições de outros domínios
const cors = require('cors');
app.use(cors());

const AGENTS = ['Amanda', 'Atlas', 'Decisor', 'BlingBot'];
const BASE_DIR = 'C:\\Users\\André\\Desktop\\picpac-v2-claude\\Agents';

function getAgentDir(agent) {
  return path.join(BASE_DIR, agent, 'src', 'v2.0');
}

function listFiles(dir) {
  const results = [];
  const recurse = (currentDir) => {
    let files;
    try {
      files = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      return;
    }
    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);
      if (file.isDirectory()) {
        recurse(fullPath);
      } else {
        const relPath = path.relative(dir, fullPath).replace(/\\\\/g, '/');
        results.push(relPath);
      }
    }
  };
  recurse(dir);
  return results;
}

function readCodeFile(agentDir, relPath) {
  const fullPath = path.join(agentDir, relPath.split('/').join(path.sep));
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
  } catch (err) {
    // ignore
  }
  return null;
}

function writeCodeFile(agentDir, relPath, content) {
  const fullPath = path.join(agentDir, relPath.split('/').join(path.sep));
  const dirPath = path.dirname(fullPath);
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  } catch (err) {
    throw new Error(`Falha ao escrever arquivo: ${err.message}`);
  }
}

function analyzeAgent(agentDir) {
  const files = listFiles(agentDir);
  let totalLines = 0;
  files.forEach((f) => {
    const content = readCodeFile(agentDir, f);
    if (content) {
      totalLines += content.split('\n').length;
    }
  });
  return {
    numFiles: files.length,
    totalLines,
    files
  };
}

// Endpoint antigo: GET /code/:agent
app.get('/code/:agent', (req, res) => {
  const agent = req.params.agent;
  if (!AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agente inválido' });
  }
  const agentDir = getAgentDir(agent);
  if (!fs.existsSync(agentDir)) {
    return res.status(404).json({ error: 'Diretório do agente não encontrado' });
  }
  const files = listFiles(agentDir);
  const code = {};
  files.forEach((f) => {
    const content = readCodeFile(agentDir, f);
    if (content !== null) {
      code[f] = content;
    }
  });
  res.json({ agent, files: code });
});

// Novo: GET /full-code/:agent (similar ao /code)
app.get('/full-code/:agent', (req, res) => {
  const agent = req.params.agent;
  if (!AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agente inválido' });
  }
  const agentDir = getAgentDir(agent);
  if (!fs.existsSync(agentDir)) {
    return res.status(404).json({ error: 'Diretório do agente não encontrado' });
  }
  const files = listFiles(agentDir);
  const code = {};
  files.forEach((f) => {
    const content = readCodeFile(agentDir, f);
    if (content !== null) {
      code[f] = content;
    }
  });
  res.json({ agent, files: code });
});

// Novo: GET /file-list/:agent
app.get('/file-list/:agent', (req, res) => {
  const agent = req.params.agent;
  if (!AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agente inválido' });
  }
  const agentDir = getAgentDir(agent);
  if (!fs.existsSync(agentDir)) {
    return res.status(404).json({ error: 'Diretório do agente não encontrado' });
  }
  const files = listFiles(agentDir);
  res.json({ agent, files });
});

// Antigo: GET /project-health
app.get('/project-health', (req, res) => {
  const health = AGENTS.map((a) => ({
    agent: a,
    exists: fs.existsSync(getAgentDir(a)),
    numFiles: (() => {
      const dir = getAgentDir(a);
      if (!fs.existsSync(dir)) return 0;
      return listFiles(dir).length;
    })()
  }));
  res.json({
    healthy: health.every((h) => h.exists && h.numFiles > 0),
    details: health
  });
});

// Antigo: GET /analyze/:agent
app.get('/analyze/:agent', (req, res) => {
  const agent = req.params.agent;
  if (!AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agente inválido' });
  }
  const agentDir = getAgentDir(agent);
  if (!fs.existsSync(agentDir)) {
    return res.status(404).json({ error: 'Diretório do agente não encontrado' });
  }
  const analysis = analyzeAgent(agentDir);
  res.json({ agent, ...analysis });
});

// Antigo: POST /analyze-integration
app.post('/analyze-integration', (req, res) => {
  const analyses = AGENTS.map((a) => {
    const agentDir = getAgentDir(a);
    if (!fs.existsSync(agentDir)) {
      return { agent: a, error: 'Diretório não encontrado' };
    }
    const analysis = analyzeAgent(agentDir);
    return { agent: a, ...analysis };
  });
  res.json({ analyses });
});

// Novo: GET /full-analysis
app.get('/full-analysis', (req, res) => {
  const analyses = AGENTS.map((a) => {
    const agentDir = getAgentDir(a);
    if (!fs.existsSync(agentDir)) {
      return { agent: a, error: 'Diretório não encontrado' };
    }
    const analysis = analyzeAgent(agentDir);
    return { agent: a, ...analysis };
  });
  res.json({ analyses });
});

// Novo: POST /apply-fix/:agent
app.post('/apply-fix/:agent', (req, res) => {
  const agent = req.params.agent;
  const { filePath, newContent } = req.body;
  if (!filePath || newContent === undefined) {
    return res.status(400).json({ error: 'filePath e newContent são obrigatórios' });
  }
  if (!AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agente inválido' });
  }
  const agentDir = getAgentDir(agent);
  if (!fs.existsSync(agentDir)) {
    return res.status(404).json({ error: 'Diretório do agente não encontrado' });
  }
  try {
    writeCodeFile(agentDir, filePath, newContent);
    res.json({ success: true, agent, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Novo: POST /bulk-apply-fixes
app.post('/bulk-apply-fixes', (req, res) => {
  const fixes = req.body.fixes;
  if (!Array.isArray(fixes)) {
    return res.status(400).json({ error: 'Campo fixes deve ser um array' });
  }
  const results = [];
  for (const fix of fixes) {
    const { agent, filePath, newContent } = fix;
    try {
      if (!agent || !filePath || newContent === undefined) {
        throw new Error('agent, filePath e newContent são obrigatórios em cada fix');
      }
      if (!AGENTS.includes(agent)) {
        throw new Error('Agente inválido');
      }
      const agentDir = getAgentDir(agent);
      if (!fs.existsSync(agentDir)) {
        throw new Error('Diretório do agente não encontrado');
      }
      writeCodeFile(agentDir, filePath, newContent);
      results.push({ success: true, agent, filePath });
    } catch (err) {
      results.push({ success: false, agent, filePath, error: err.message });
    }
  }
  res.json({ results });
});

// Novo: GET /validate-integration
app.get('/validate-integration', (req, res) => {
  const validations = AGENTS.map((a) => {
    const agentDir = getAgentDir(a);
    const dirExists = fs.existsSync(agentDir);
    let hasFiles = false;
    if (dirExists) {
      try {
        hasFiles = listFiles(agentDir).length > 0;
      } catch {}
    }
    return {
      agent: a,
      dirExists,
      hasFiles
    };
  });
  res.json({
    valid: validations.every((v) => v.dirExists && v.hasFiles),
    details: validations
  });
});

// Root endpoint para teste
app.get('/', (req, res) => {
  res.json({ status: 'Context Manager v2 rodando', agents: AGENTS, port: 3000 });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});