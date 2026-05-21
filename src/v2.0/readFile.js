const { Octokit } = require("@octokit/rest");

async function readFile(req, res) {
  const { owner, repository, filePath, branch = "main" } = req.query;
  if (!owner || !repository || !filePath) {
    return res.status(400).json({ error: "Missing required parameters: owner, repository, filePath" });
  }
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  try {
    const { data: contentData } = await octokit.repos.getContent({
      owner,
      repo: repository,
      path: filePath,
      ref: branch,
    });
    const content = Buffer.from(contentData.content, "base64").toString("utf-8");
    const size = contentData.size;
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo: repository,
      path: filePath,
      sha: branch,
      per_page: 1,
    });
    const lastModified = commits.length > 0 ? commits[0].commit.committer.date : null;
    return res.json({
      owner,
      repository,
      filePath,
      branch,
      content,
      lastModified,
      size,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: "File or repository not found", details: error.message });
    }
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

module.exports = readFile;