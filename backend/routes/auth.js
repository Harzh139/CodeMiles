const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo&redirect_uri=${process.env.BACKEND_URL}/auth/github/callback`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    const token = response.data.access_token;
    if (token) {
      req.session.githubToken = token;
      res.redirect(`${process.env.FRONTEND_URL}/repo`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
    }
  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
  }
});

router.get('/me', async (req, res) => {
  if (!req.session.githubToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${req.session.githubToken}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;
