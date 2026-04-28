# Context Schema - Formato Padrão

## 📋 Estrutura Base

{
  "sessionId": "sess-unique-id",
  "userId": "user-123",
  "agentId": "amanda",
  "timestamp": "2023-10-01T12:30:00Z",
  "data": {
    "conversationHistory": [],
    "metadata": {},
    "customFields": {}
  }
}

## 🔑 Campos Obrigatórios

- sessionId: ID único da sessão/conversa
- userId: ID do usuário
- agentId: ID do agente
- data: Dados da sessão

## 🔧 Campos Opcionais

- timestamp: ISO 8601 timestamp
- metadata: Metadados customizados
- ttl: Time to live em segundos

## 📝 data Object

### conversationHistory (Array)

Histórico de mensagens com role (user/assistant) e content

### metadata (Object)

language, model, temperature, maxTokens, source

### customFields (Object)

Dados específicos do agente

## ✅ Exemplo Completo

{
  "sessionId": "sess-abc123",
  "userId": "user-456",
  "agentId": "amanda",
  "timestamp": "2023-10-01T12:30:00Z",
  "data": {
    "conversationHistory": [
      {"role": "user", "content": "Olá"},
      {"role": "assistant", "content": "Oi!"}
    ],
    "metadata": {
      "language": "pt-BR",
      "model": "gpt-4"
    }
  }
}

## 🔍 Validação

Checklist antes de enviar:
- ✅ sessionId está único
- ✅ userId é válido
- ✅ conversationHistory é array
- ✅ Timestamps em ISO 8601
- ✅ Sem campos vazios

## 📏 Limites

- Tamanho máximo: 10 MB
- Mensagens no histórico: 100
- Tamanho individual: 32 KB
