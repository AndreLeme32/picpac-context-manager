# API Documentation - Context Manager v2

## Base URL

http://localhost:8080/api/v2

Em produção:
https://picpac-context-manager-production.up.railway.app/api/v2

---

## GET /agents

Lista todos os agentes registrados.

**Requisição:**
curl http://localhost:8080/api/v2/agents

**Resposta (200):**
{
  "agents": [
    {
      "id": "amanda",
      "name": "Amanda",
      "createdAt": "2023-10-01T12:00:00Z"
    }
  ]
}

---

## POST /agents

Registra um novo agente.

**Requisição:**
curl -X POST http://localhost:8080/api/v2/agents \
  -H "Content-Type: application/json" \
  -d '{"id": "novo-agente", "name": "Novo Agente"}'

**Resposta (201):**
{
  "id": "novo-agente",
  "name": "Novo Agente",
  "createdAt": "2023-10-01T12:05:00Z"
}

---

## GET /context/:agentId

Obtém o contexto atual de um agente.

**Requisição:**
curl http://localhost:8080/api/v2/context/amanda

**Resposta (200):**
{
  "agentId": "amanda",
  "context": {
    "sessionId": "sess-abc123",
    "userId": "user-456",
    "data": {}
  },
  "updatedAt": "2023-10-01T12:10:00Z"
}

---

## POST /context/:agentId

Cria ou atualiza o contexto de um agente.

**Requisição:**
curl -X POST http://localhost:8080/api/v2/context/amanda \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sess-123", "userId": "user-456", "data": {}}'

**Resposta (200):**
{
  "success": true,
  "updatedAt": "2023-10-01T12:15:00Z"
}

---

## DELETE /context/:agentId

Deleta o contexto de um agente.

**Requisição:**
curl -X DELETE http://localhost:8080/api/v2/context/amanda

**Resposta (200):**
{
  "success": true
}

---

## GET /health

Verifica a saúde do serviço.

**Requisição:**
curl http://localhost:8080/health

**Resposta (200):**
{
  "status": "ok",
  "version": "v2",
  "agentsPath": "/app/src/v2.0/agents",
  "agentsCount": 2
}
