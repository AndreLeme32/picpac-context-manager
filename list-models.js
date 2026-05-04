require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

const models = [
  'claude-opus-4-1-20250805',
  'claude-3-5-sonnet-20241022',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-opus-20240229'
];

async function testModel(model) {
  try {
    await client.messages.create({
      model: model,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Oi' }]
    });
    return true;
  } catch (error) {
    console.error(`❌ ${model}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testando modelos Claude em ordem de preferência...\n');
  
  for (const model of models) {
    console.log(`   Testando: ${model}`);
    if (await testModel(model)) {
      console.log('\n✅ PRIMEIRO MODELO DISPONÍVEL:', model.toUpperCase());
      console.log('   Use este modelo em seus projetos!');
      process.exit(0);
    }
    console.log('');
  }
  
  console.log('\n💥 NENHUM MODELO ESTÁ DISPONÍVEL!');
  console.log('   Verifique sua chave API (CLAUDE_API_KEY) e conexão.');
  process.exit(1);
}

main().catch(console.error);