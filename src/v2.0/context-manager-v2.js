const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const uploadFileToGitHub = require('../../github-integration');
const axios = require('axios');
const contextsDir = path.join(__dirname, '../../context-files');
if (!fs.existsSync(contextsDir)) {
  fs.mkdirSync(contextsDir, { recursive: true });
}
let contexts = {};
function loadContexts() {
  contexts = {};
  try {
    const files = fs.readdirSync(contextsDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        const filePath = path.join(contextsDir, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          contexts[id] = content;
        } catch (e) {
          console.error(`Erro ao carregar contexto ${file}:`, e);
        }
      }
    });
  } catch (e) {
    console.error('Erro ao ler pasta de contextos:', e);
  }
}
loadContexts();

// Variáveis e funções de sincronização
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_PATH = process.env.GITHUB_PATH || 'contexts';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

async function syncContextToGithub(contextId, content) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('Sincronização GitHub desabilitada: configuração ausente');
    return;
  }
  try {
    const filePath = `${GITHUB_PATH}/${contextId}.json`;
    await uploadFileToGitHub({
      token: GITHUB_TOKEN,
      repo: GITHUB_REPO,
      path: filePath,
      content: JSON.stringify(content, null, 2),
      branch: GITHUB_BRANCH,
      message: `Atualizar contexto ${contextId}`
    });
    console.log(`Contexto ${contextId} sincronizado com GitHub`);
  } catch (error) {
    console.error(`Falha ao sincronizar ${contextId} com GitHub:`, error);
  }
}

async function syncDeleteToGithub(contextId) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('Sincronização GitHub desabilitada: configuração ausente');
    return;
  }
  try {
    const filePath = `${GITHUB_PATH}/${contextId}.json`;
    const { data: fileInfo } = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    await axios.delete(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      data: {
        message: `Deletar contexto ${contextId}`,
        sha: fileInfo.sha,
        branch: GITHUB_BRANCH,
      },
    });
    console.log(`Contexto ${contextId} deletado do GitHub`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`Contexto ${contextId} não encontrado no GitHub`);
    } else {
      console.error(`Falha ao deletar ${contextId} do GitHub:`, error);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/api/v2/agents', (req, res) => {
  res.json({ agents: [] });
});

const contextDir = path.join(__dirname, 'contexts');
if (!fs.existsSync(contextDir)) {
  fs.mkdirSync(contextDir, { recursive: true });
}

const contextPath = path.join(contextDir, 'context.json');

app.get('/api/v2/context', (req, res) => {
  try {
    if (fs.existsSync(contextPath)) {
      const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      res.json(context);
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler context' });
  }
});

app.post('/api/v2/context', (req, res) => {
  try {
    fs.writeFileSync(contextPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Context atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar context' });
  }
});

app.get('/api/v2/github/contexts', (req, res) => {
  res.json({ contexts: [] });
});

app.get('/api/v2/github/status', (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  if (token && token.length > 0) {
    res.json({ connected: true, message: 'Integração com GitHub conectada.' });
  } else {
    res.json({ connected: false, message: 'Variável de ambiente GITHUB_TOKEN não configurada.' });
  }
});

app.post('/api/v2/github/sync', async (req, res) => {
  try {
    const { filePath, fileContent, commitMessage } = req.body;
    if (!filePath || !fileContent || !commitMessage) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios ausentes: filePath, fileContent, commitMessage' 
      });
    }
    const result = await uploadFileToGitHub(filePath, fileContent, commitMessage);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro no sync GitHub:', error);
    res.status(500).json({ 
      error: 'Falha ao sincronizar arquivo com GitHub', 
      details: error.message 
    });
  }
});

app.get('/api/v2/contexts', (req, res) => {
  res.json({ contexts: Object.values(contexts) });
});

app.post('/api/v2/contexts', async (req, res) => {
  try {
    const { id, context: newContext } = req.body;
    if (!id || !newContext) {
      return res.status(400).json({ error: 'id e context são obrigatórios' });
    }
    const filePath = path.join(contextsDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(newContext, null, 2));
    loadContexts();
    await syncContextToGithub(id, newContext);
    res.json({ success: true, message: 'Contexto adicionado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar contexto' });
  }
});

app.put('/api/v2/contexts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const newContext = req.body;
    if (!newContext || typeof newContext !== 'object') {
      return res.status(400).json({ error: 'Corpo da requisição inválido' });
    }
    const filePath = path.join(contextsDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(newContext, null, 2));
    loadContexts();
    await syncContextToGithub(id, newContext);
    res.json({ success: true, message: 'Contexto atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar contexto' });
  }
});

app.delete('/api/v2/contexts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.join(contextsDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      loadContexts();
      await syncDeleteToGithub(id);
      res.json({ success: true, message: 'Contexto removido' });
    } else {
      res.status(404).json({ error: 'Contexto não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover contexto' });
  }
});

// Novos endpoints de leitura do GitHub
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]]/g, '\$&');
}

async function getGithubData(endpoint) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN não configurado');
  }
  const ts = new Date().toISOString();
  try {
    const response = await axios.get(`https://api.github.com${endpoint}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'context-manager-v2'
      }
    });
    console.log(`[${ts}] GitHub API ${endpoint.slice(0, 50)}... - OK`);
    return response.data;
  } catch (error) {
    console.error(`[${ts}] GitHub API ${endpoint.slice(0, 50)}... - ERROR ${error.response?.status || '???'} : ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

app.get('/api/v2/github/read', async (req, res) => {
  const ts = new Date().toISOString();
  try {
    const { owner, repo, ref = 'main', path: p = '' } = req.query;
    if (!owner || !repo) {
      console.log(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: owner e repo obrigatórios`);
      return res.status(400).json({ error: 'Parâmetros owner e repo são obrigatórios' });
    }
    const safePath = encodeURIComponent(p);
    const endpoint = `/repos/${owner}/${repo}/contents/${safePath}?ref=${ref}`;
    const data = await getGithubData(endpoint);
    console.log(`[${ts}] ${req.method} ${req.originalUrl} - OK (${Array.isArray(data) ? data.length : 'obj'})`);
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: ${error.message}`);
    res.status(status).json({ error: error.response?.data?.message || error.message });
  }
});

app.get('/api/v2/github/tree', async (req, res) => {
  const ts = new Date().toISOString();
  try {
    const { owner, repo, ref = 'main' } = req.query;
    if (!owner || !repo) {
      console.log(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: owner e repo obrigatórios`);
      return res.status(400).json({ error: 'Parâmetros owner e repo são obrigatórios' });
    }
    const endpoint = `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
    const data = await getGithubData(endpoint);
    console.log(`[${ts}] ${req.method} ${req.originalUrl} - OK (${data.tree?.length || 0} itens)`);
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: ${error.message}`);
    res.status(status).json({ error: error.response?.data?.message || error.message });
  }
});

app.get('/api/v2/github/files', async (req, res) => {
  const ts = new Date().toISOString();
  try {
    const { owner, repo, ref = 'main', pattern = '*' } = req.query;
    if (!owner || !repo) {
      console.log(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: owner e repo obrigatórios`);
      return res.status(400).json({ error: 'Parâmetros owner e repo são obrigatórios' });
    }
    const endpoint = `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
    const treeData = await getGithubData(endpoint);
    const regexStr = '^' + escapeRegex(pattern).replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$';
    const regex = new RegExp(regexStr, 'i');
    const files = (treeData.tree || []).filter(item => item.type === 'blob' && regex.test(item.path));
    console.log(`[${ts}] ${req.method} ${req.originalUrl} - OK (${files.length} arquivos)`);
    res.json({ files, total: files.length, pattern });
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: ${error.message}`);
    res.status(status).json({ error: error.response?.data?.message || error.message });
  }
});

app.post('/api/v2/github/read-file', async (req, res) => {
  const ts = new Date().toISOString();
  try {
    const { owner, repo, ref = 'main' } = req.query;
    const { path: filePath } = req.body;
    if (!owner || !repo) {
      console.log(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: owner e repo obrigatórios`);
      return res.status(400).json({ error: 'Parâmetros owner e repo são obrigatórios' });
    }
    if (!filePath) {
      console.log(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: path obrigatório`);
      return res.status(400).json({ error: 'Path do arquivo obrigatório no body' });
    }
    const safePath = encodeURIComponent(filePath);
    const endpoint = `/repos/${owner}/${repo}/contents/${safePath}?ref=${ref}`;
    const data = await getGithubData(endpoint);
    if (!data.content) {
      return res.status(404).json({ error: 'Arquivo não encontrado ou é diretório' });
    }
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    const result = {
      path: data.path,
      name: data.name,
      sha: data.sha,
      size: data.size,
      content
    };
    console.log(`[${ts}] ${req.method} ${req.originalUrl} - OK (${data.size} bytes)`);
    res.json(result);
  } catch (error) {
    const status = error.response?.status || 500;
    console.error(`[${ts}] ${req.method} ${req.originalUrl} - ERROR: ${error.message}`);
    res.status(status).json({ error: error.response?.data?.message || error.message });
  }
});

app.get('/api/v2/contexts/sync/status', (req, res) => {
  const status = {
    enabled: !!(GITHUB_TOKEN && GITHUB_REPO),
    repo: GITHUB_REPO || 'Não configurado',
    path: GITHUB_PATH,
    branch: GITHUB_BRANCH,
    localCount: Object.keys(contexts).length,
  };
  res.json(status);
});

async function initialSyncToGithub() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('Sincronização inicial pulada: GitHub não configurado');
    return;
  }
  console.log('Executando sincronização inicial para GitHub...');
  const syncPromises = Object.entries(contexts).map(([id, content]) =>
    syncContextToGithub(id, content)
  );
  await Promise.all(syncPromises);
  console.log('Sincronização inicial concluída.');
}

initialSyncToGithub().catch(console.error);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});