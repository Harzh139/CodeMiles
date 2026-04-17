const express = require('express');
const router = express.Router();
const GitHubService = require('../services/github');

router.post('/read', async (req, res) => {
  const { repoUrl } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    const githubData = await new GitHubService(token).getRepoFiles(repoUrl);
    res.json(githubData);
  } catch (error) {
    console.error('Repo read error:', error.message);
    res.status(500).json({ error: 'Failed to read repository' });
  }
});

module.exports = router;
