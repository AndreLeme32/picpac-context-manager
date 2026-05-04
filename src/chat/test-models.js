require('dotenv').config({ path: '../../.env' });

const Anthropic = require('@anthropic-ai/sdk');

if (!process.env.CLAUDE_API_KEY) {
  console.error('❌ CLAUDE_API_KEY não encontrada no .env');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

const models = [
  'claude-opus-4-1-20250805',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-3-opus-20240229'
];

let workingModels = [];

(async () => {
  for (const model of models) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }]
      });
      console.log(`✅ MODELO FUNCIONA: ${model}`);
      workingModels.push(model);
    } catch (error) {
      console.log(`❌ MODELO NÃO FUNCIONA: ${model} - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  if (workingModels.length > 0) {
    console.log(`✅ Recomendação para chat-server.js: use o modelo "${workingModels[0]}"`);
  } else {
    console.log('❌ Nenhum modelo funciona! Verifique sua API key e conexão.');
  }
})();