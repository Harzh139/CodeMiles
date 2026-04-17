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
    
    // We need to commit each file
    // Note: GitHub's API allows updating one file at a time or creating a tree and a single commit.
    // The requirement says: GET each file's current SHA, PUT updated content, All files pushed in sequence.
    
    for (const change of changes) {
      if (!change.filename) continue;
      
      // Get current file to get its SHA
      let sha;
      try {
        const fileData = await github.api.get(`/repos/${owner}/${repo}/contents/${change.filename}`);
        sha = fileData.data.sha;
      } catch (err) {
        // File might not exist (creating a new file? The prompt only asks to modify, but if not found we might still try or fail)
        if (err.response && err.response.status === 404) {
          // It's a new file, no SHA
        } else {
          throw new Error(`Could not find ${change.filename} in repo`);
        }
      }

      await github.updateFile(owner, repo, change.filename, change.modified, sha, `fix: ${change.summary || 'Update ' + change.filename}`);
    }

    // Finally return a commit URL (just returning the commits page since we made sequential commits)
    const commitsResp = await github.api.get(`/repos/${owner}/${repo}/commits`);
    const lastCommit = commitsResp.data[0];

    res.json({ commitUrl: lastCommit.html_url });
  } catch (error) {
    console.error('Push commit error:', error.response?.data || error.message);
    res.status(500).json({ error: `Push failed: ${error.message}` });
  }
});

module.exports = router;
