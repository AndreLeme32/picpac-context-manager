const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let agentsPath = process.env.AGENTS_PATH;
if (!agentsPath) {
  agentsPath = path.join(__dirname, 'agents');
}

if (!fs.existsSync(agentsPath)) {
  fs.mkdirSync(agentsPath, { recursive: true });
}

const contexts = new Map();

app.get('/api/v2/agents', (req, res) => {
  try {
    const agents = fs.readdirSync(agentsPath)
      .filter((file) => fs.statSync(path.join(agentsPath, file)).isDirectory())
      .map((agent) => ({ id: agent, path: path.join('/agents', agent) }));
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v2/context/:agentId', (req, res) => {
  const { agentId } = req.params;
  const context = contexts.get(agentId);
  if (context === undefined) {
    return res.status(404).json({ error: 'Context not found for agent' });
  }
  res.json({ agentId, context });
});

app.post('/api/v2/context/:agentId', (req, res) => {
  const { agentId } = req.params;
  const agentDir = path.join(agentsPath, agentId);
  if (!fs.existsSync(agentDir)) {
    return res.status(404).json({ error: 'Agent directory not found' });
  }
  const contextData = req.body;
  contexts.set(agentId, contextData);
  res.json({ success: true, agentId, context: contextData });
});

app.delete('/api/v2/context/:agentId', (req, res) => {
  const { agentId } = req.params;
  if (!contexts.delete(agentId)) {
    return res.status(404).json({ error: 'Context not found for agent' });
  }
  res.json({ success: true, agentId });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: 'v2', 
    agentsPath, 
    agentsCount: fs.readdirSync(agentsPath).filter(f => fs.statSync(path.join(agentsPath, f)).isDirectory()).length 
  });
});

app.use('/agents', express.static(agentsPath));

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(Context Manager v2 running on http://localhost:);
  console.log(Agents path: );
  console.log(Health check: http://localhost:/health);
});
