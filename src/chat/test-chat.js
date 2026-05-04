const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Anthropic = require('@anthropic-ai/sdk');

async function test() {
  console.log('🧪 Testando Claude API...');
  console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'Carregada ✅' : 'NÃO ENCONTRADA ❌');

  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY não está configurada!');
    process.exit(1);
  }

  const client = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
  });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Diga olá em uma palavra' }]
    });

    console.log('✅ Resposta do Claude:', response.content[0].text);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();