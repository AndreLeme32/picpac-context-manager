# Context Manager v2 - PicPac

## 🎯 Descrição

O **Context Manager v2** é um gerenciador centralizado de contextos para agentes de IA da PicPac. Ele permite que múltiplos agentes (Amanda, Atlas, etc.) compartilhem e gerenciem contextos de conversas de forma sincronizada e persistente.

### ✨ Recursos Principais
- Armazenamento centralizado de contextos
- API RESTful para agentes
- Integração fácil com novos agentes
- Persistência de dados entre sessões
- Health check e monitoramento
- Totalmente funcional em produção

## 🚀 Como Rodar Localmente

npm install
npm start

Servidor rodará em **http://localhost:8080**

## 📡 Endpoints Disponíveis

- GET /health - Health check
- GET /api/v2/agents - Lista agentes
- POST /api/v2/agents - Cria agente
- GET /api/v2/context/:agentId - Obter contexto
- POST /api/v2/context/:agentId - Atualizar contexto
- DELETE /api/v2/context/:agentId - Deletar contexto

## 📚 Documentação

- [API.md](./API.md) - Referência detalhada de endpoints
- [INTEGRATION.md](./INTEGRATION.md) - Guia para integrar novos agentes
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy no Railway
- [CONTEXT_SCHEMA.md](./CONTEXT_SCHEMA.md) - Schema padrão de contextos

## ✅ Status

🟢 **Operacional** - Rodando em produção no Railway
- Endpoint: https://picpac-context-manager-production.up.railway.app
- Health check: /health retorna status OK
