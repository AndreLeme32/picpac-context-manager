const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Função para encontrar .env no cwd ou diretórios pais
function findDotEnv(startDir) {
  let dir = path.resolve(startDir);
  const checked = [];
  while (true) {
    checked.push(path.relative(process.cwd(), dir) || dir);
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      console.log(`✅ .env encontrado em: ${envPath}`);
      return envPath;
    }
    const parentDir = path.dirname(dir);
    if (parentDir === dir) {
      break;
    }
    dir = parentDir;
  }
  console.log('🔍 Diretórios verificados sem .env:', checked.reverse().join(' → '));
  return null;
}

// Setup inicial
console.log('🚀 Inicializando claude-integration.js...');
console.log('📁 Diretório de trabalho atual (CWD):', process.cwd());

const envPath = findDotEnv(process.cwd());
let apiKey = process.env.CLAUDE_API_KEY;
let diagnosticInfo = '';

if (!envPath) {
  console.error('❌ Arquivo .env NÃO encontrado em nenhum diretório pai do CWD.');
  console.error('💡 Solução: Crie .env no CWD ou diretório pai com: CLAUDE_API_KEY=sk-ant-...');
  diagnosticInfo = 'Arquivo .env não encontrado.';
} else {
  console.log(`📄 Carregando .env com path ABSOLUTO: ${envPath}`);
  const result = dotenv.config({ path: envPath, debug: true });
  if (result.error) {
    console.error('❌ Erro ao carregar dotenv:', result.error.message);
    diagnosticInfo = `Erro dotenv: ${result.error.message}`;
  } else {
    console.log('✅ dotenv carregado com sucesso!');
  }
  apiKey = process.env.CLAUDE_API_KEY;
}

// Verificação detalhada da API_KEY
console.log('🔑 Verificando CLAUDE_API_KEY...');
if (!apiKey || apiKey.trim() === '') {
  console.error('❌ CLAUDE_API_KEY NÃO está definida em process.env!');
  if (envPath) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      console.log('\n📋 CONTEÚDO COMPLETO do .env (para diagnóstico):');
      console.log('---');
      console.log(content);
      console.log('---');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);
      const keyLineIndex = lines.findIndex(line => line.startsWith('CLAUDE_API_KEY='));
      if (keyLineIndex === -1) {
        console.error('\n🚨 PROBLEMA IDENTIFICADO: Nenhuma linha "CLAUDE_API_KEY=" no .env.');
        console.error('💡 Adicione: CLAUDE_API_KEY=sua-chave-aqui');
      } else {
        const keyLine = lines[keyLineIndex];
        console.error(`\n🚨 PROBLEMA IDENTIFICADO: Linha encontrada (linha ${keyLineIndex + 1}): ${keyLine}`);
        console.error('Mas não carregada. Possíveis causas:');
        console.error('- Espaços antes/depois do =');
        console.error('- Aspas desnecessárias');
        console.error('- Valor vazio');
        console.error('- Linha comentada (#)');
        console.error('💡 Corrija para: CLAUDE_API_KEY=sk-ant-... (sem espaços/aspas)');
      }
    } catch (readErr) {
      console.error('❌ Erro ao ler .env para diagnóstico:', readErr.message);
    }
  }
  diagnosticInfo += ' CLAUDE_API_KEY vazia ou ausente após carregamento.';
} else {
  console.log('✅ CLAUDE_API_KEY carregada com sucesso (primeiros 10 chars):', apiKey.substring(0, 10) + '...');
}

// Função principal de integração com Claude
async function claudeChat(prompt, options = {}) {
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'CLAUDE_API_KEY não configurada.',
      details: `Erro: ${diagnosticInfo || 'Chave ausente no .env.'}. Configure no .env e reinicie.`,
      solution: '1. Crie .env com CLAUDE_API_KEY=sk-ant-...\n2. Sem espaços ou aspas extras.\n3. Reinicie o processo.'
    };
  }

  const defaults = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.7,
  };
  const config = { ...defaults, ...options };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        success: false,
        error: `Erro API: ${response.status} - ${errorData}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content[0].text,
      usage: data.usage,
      fullResponse: data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro de conexão/rede: ${error.message}`,
    };
  }
}

// Exporta a função
module.exports = { claudeChat, sendMessage: claudeChat };

// Exemplo de uso (se executado diretamente)
if (require.main === module) {
  (async () => {
    console.log('\n🧪 Teste de exemplo:');
    const result = await claudeChat('Explique brevemente o que é JavaScript.');
    if (result.success) {
      console.log('\n✅ Resposta do Claude:', result.content);
    } else {
      console.log('\n❌ Erro:', result.error);
      console.log('Detalhes:', result.details);
    }
  })();
}