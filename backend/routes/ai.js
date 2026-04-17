const express = require('express');
const router = express.Router();
const GroqService = require('../services/groq');

router.post('/change', async (req, res) => {
  const { files, instruction } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!files || !instruction) {
    return res.status(400).json({ error: 'files and instruction are required' });
  }

  try {
    const groq = new GroqService(process.env.GROQ_API_KEY);
    const changes = await groq.getCodeChanges(files, instruction);
    res.json(changes);
  } catch (error) {
    console.error('AI change error:', error.message);
    res.status(500).json({ error: 'AI processing failed or returned invalid response format. Try rephrasing.' });
  }
});

module.exports = router;
