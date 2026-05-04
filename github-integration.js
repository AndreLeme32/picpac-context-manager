const dotenv = require('dotenv');
dotenv.config();

const { Octokit } = require('@octokit/rest');

async function uploadFileToGitHub(filePath, fileContent, commitMessage) {
  // Valida token GitHub
  if (!process.env.GITHUB_TOKEN) {
    return { success: false, error: 'GITHUB_TOKEN não encontrado nas variáveis de ambiente' };
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const owner = 'AndreLeme32';
  const repo = 'picpac-context-manager';
  const branch = 'main';

  try {
    const result = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(fileContent, 'utf8').toString('base64'),
      branch
    });

    return { success: true, message: 'Arquivo enviado/atualizado com sucesso!', data: result.data };
  } catch (error) {
    console.error('Erro ao fazer upload para GitHub:', error);

    if (error.status === 401) {
      return { success: false, error: 'Falha de autenticação: Token inválido ou expirado' };
    } else if (error.status === 404) {
      return { success: false, error: 'Repositório não encontrado ou sem acesso' };
    } else if (error.status === 422) {
      return { success: false, error: 'Conflito na branch ou arquivo bloqueado' };
    } else {
      return { success: false, error: error.message || 'Erro desconhecido na API do GitHub' };
    }
  }
}

module.exports = { uploadFileToGitHub };