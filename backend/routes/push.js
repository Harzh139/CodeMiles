const express = require('express');
const router = express.Router();
const GitHubService = require('../services/github');

router.post('/commit', async (req, res) => {
  const { repoUrl, changes } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!repoUrl || !changes || !Array.isArray(changes)) {
    return res.status(400).json({ error: 'repoUrl and changes array are required' });
  }

  try {
    const github = new GitHubService(token);
    const { owner, repo } = await github.getRepoDetails(repoUrl);
    
    // Create a single commit for all changes
    const commitMessage = changes.length > 1 
      ? `AI: Apply multiple changes (${changes.length} files)` 
      : `AI: ${changes[0].summary || 'Update ' + changes[0].filename}`;

    const commitData = await github.createSingleCommit(owner, repo, changes, commitMessage);

    res.json({ 
      commitUrl: commitData.html_url || `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
      commitSha: commitData.sha
    });
  } catch (error) {
    console.error('Push commit error:', error.response?.data || error.message);
    res.status(500).json({ error: `Push failed: ${error.message}` });
  }
});

router.post('/revert', async (req, res) => {
  const { repoUrl, changes } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const github = new GitHubService(token);
    const { owner, repo } = await github.getRepoDetails(repoUrl);
    
    // To revert, we basically swap modified and original
    const revertChanges = changes.map(c => ({
      ...c,
      modified: c.original,
      original: c.modified
    }));

    const commitMessage = `Revert: AI changes`;
    const commitData = await github.createSingleCommit(owner, repo, revertChanges, commitMessage);

    res.json({ 
      commitUrl: commitData.html_url || `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
      commitSha: commitData.sha
    });
  } catch (error) {
    console.error('Revert error:', error.response?.data || error.message);
    res.status(500).json({ error: `Revert failed: ${error.message}` });
  }
});

module.exports = router;
