const axios = require('axios');

class GroqService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: 'https://api.groq.com/openai/v1',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getCodeChanges(files, instruction) {
    const codebaseContext = files.map(f => `File: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');
    
    const systemPrompt = `You are a precise code editing assistant. You will receive:
1. A full codebase (multiple files with their content)
2. A plain English instruction describing what to change

Your job:
- Identify exactly which file(s) need to change to fulfill the instruction
- Make ONLY the minimal change needed
- Never touch files unrelated to the instruction
- Never delete working code that is unrelated to the change
- Preserve all imports, exports, comments, and formatting conventions of the original
- If the instruction is ambiguous, make the safest minimal change

Respond ONLY with a raw JSON array. No markdown. No explanation. No backticks.
Format:
[
  {
    "filename": "relative/path/to/file.ext",
    "original": "full original file content",
    "modified": "full modified file content",
    "summary": "one line: what changed and why"
  }
]

If no changes are needed, return an empty array: []`;

    const userPrompt = `INSTRUCTION: ${instruction}\n\nCODEBASE:\n${codebaseContext}`;

    try {
      const response = await this.api.post('/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 32000
      });

      let content = response.data.choices[0].message.content.trim();
      console.log('Groq raw response (first 500 chars):', content.substring(0, 500));
      
      // Remove possible markdown backticks if AI ignores system prompt instructions
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('JSON Parse Error — Groq returned invalid JSON');
      }
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new Error('AI processing failed');
    }
  }
}

module.exports = GroqService;
