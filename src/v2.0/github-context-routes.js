const express = require('express');
const multer = require('multer');
const simpleGit = require('simple-git');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const router = express.Router();

const upload = multer({ dest: os.tmpdir() });

function findGitRoot(startPath = process.cwd()) {
  let currentPath = path.resolve(startPath);
  while (currentPath !== path.dirname(currentPath)) {
    const gitPath = path.join(currentPath, '.git');
    if (fs.existsSync(gitPath)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  throw new Error('Raiz do repositório Git não encontrada');
}

router.post('/api/v2/github/upload', upload.array('files'), async (req, res) => {
  try {
    const repoRoot = findGitRoot();
    const contextDir = path.join(repoRoot, 'context-files');
    await fsp.mkdir(contextDir, { recursive: true });

    const files = req.files || [];
    const savedFiles = [];

    for (const file of files) {
      const originalName = file.originalname || `uploaded-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const destPath = path.join(contextDir, originalName);
      await fsp.rename(file.path, destPath);
      savedFiles.push(originalName);
    }

    if (files.length === 0) {
      return res.json({ success: true, message: 'Nenhum arquivo enviado' });
    }

    const message = req.body.message || 'Upload de arquivos via API';
    const git = simpleGit(repoRoot);

    await git.add('context-files/');
    await git.commit(message);
    const pushResult = await git.push();

    res.json({ success: true, savedFiles, pushResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/v2/github/commit-push', async (req, res) => {
  try {
    const repoRoot = findGitRoot();
    const message = req.body.message || 'Commit e push automático';
    const git = simpleGit(repoRoot);

    const status = await git.status();
    if (!status.files || status.files.length === 0) {
      return res.json({ success: true, message: 'Nenhuma alteração pendente' });
    }

    await git.add('.');
    await git.commit(message);
    const pushResult = await git.push();

    res.json({ success: true, commitMessage: message, pushResult });
  } catch (error) {
    console.error(error);
    if (error.message.includes('nothing to commit') || error.message.includes('nenhuma')) {
      res.json({ success: true, message: 'Nenhuma alteração para commit' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

module.exports = router;