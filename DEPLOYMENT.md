# Deployment - Context Manager v2

## Deploy no Railway

### ✅ Pré-requisitos

- Conta no Railway.app
- Repositório GitHub
- Node.js 18+ instalado

### 📋 Passos de Deploy

#### 1. Conectar Repository ao Railway

1. Acesse https://railway.app
2. Clique em New Project
3. Selecione Deploy from GitHub repo
4. Autorize e selecione picpac-context-manager

#### 2. Configurar Variáveis de Ambiente

No Railway > Variables:
- PORT = 8080
- NODE_ENV = production

#### 3. Deploy Automático

Railway detecta automaticamente package.json
Deploy acontece automaticamente!

### 🔄 Redeploy Manual

1. Vá em Deployments
2. Clique em Redeploy
3. Aguarde 2-3 minutos

### 🔄 Deploy Automático (Git Push)

git add .
git commit -m "Sua mensagem"
git push origin main

Railway faz deploy automaticamente!

### 📊 Monitoramento

Ver logs:
1. Vá em Deployments → Logs
2. Ou use: railway logs

### 🔙 Rollback

1. Vá em Deployments
2. Clique em Redeploy do deployment anterior
3. Pronto! Volta para versão anterior

### ⚠️ Troubleshooting

App crashes (Erro 502):
- Verifique logs: railway logs
- Procure por erros de dependências
- Teste localmente: npm start
- Faça push: git push origin main

Port não configurada:
- Verifique se app escuta na variável PORT

Variáveis não lidas:
- Adicione variable no Railway
- Aguarde 30 segundos
- Faça redeploy

### 🚀 Verificar Deploy em Produção

curl https://picpac-context-manager-production.up.railway.app/health

Deve retornar: {"status":"ok","version":"v2",...}
