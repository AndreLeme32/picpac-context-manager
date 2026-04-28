# Guia de Integração - Context Manager v2

## Para Novos Agentes

### 1️⃣ Registrar o Agente

curl -X POST http://localhost:8080/api/v2/agents \
  -H "Content-Type: application/json" \
  -d '{"id": "seu-agente", "name": "Seu Agente"}'

### 2️⃣ Enviar Contexto Inicial

curl -X POST http://localhost:8080/api/v2/context/seu-agente \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sess-unique-id", "userId": "user-123", "data": {}}'

### 3️⃣ Recuperar Contexto

curl http://localhost:8080/api/v2/context/seu-agente

### 4️⃣ Atualizar Contexto Após Processar

curl -X POST http://localhost:8080/api/v2/context/seu-agente \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sess-123", "userId": "user-123", "data": {}}'

## Fluxo de Comunicação

Agente → GET /api/v2/context/:agentId (recupera contexto)
Agente processa mensagem
Agente → POST /api/v2/context/:agentId (atualiza contexto)

## Boas Práticas

✅ Sempre recupere contexto antes de processar
✅ Use sessionId único por conversa
✅ Implemente retry com backoff exponencial
✅ Valide dados antes de enviar
✅ Log de todas as operações
✅ Use timestamps ISO 8601
