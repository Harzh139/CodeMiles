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
      timeout: 120000, // 2 minute timeout for large requests
    });
  }

  /**
   * Two-pass strategy for large repos:
   * Pass 1: Send file list + instruction → AI picks relevant files
   * Pass 2: Send only relevant files → AI generates changes
   */
  async getCodeChanges(files, instruction) {
    console.log(`Processing ${files.length} files for instruction: "${instruction}"`);

    // If repo is small (< 15 files), use single-pass (faster)
    if (files.length <= 15) {
      console.log('Small repo — using single-pass strategy');
      return this._singlePass(files, instruction);
    }

    // Large repo — use two-pass strategy
    console.log('Large repo — using two-pass strategy');
    return this._twoPass(files, instruction);
  }

  async _twoPass(files, instruction) {
    // PASS 1: Ask AI which files are relevant
    const fileList = files.map(f => {
      // Send path + first 3 lines as a preview
      const preview = f.content.split('\n').slice(0, 3).join('\n');
      return `- ${f.path} (preview: ${preview})`;
    }).join('\n');

    const selectPrompt = `You are a code assistant. Given the following instruction and a list of files in a repository, identify which files need to be modified.

INSTRUCTION: ${instruction}

FILES IN REPO:
${fileList}

Respond ONLY with a raw JSON array of file paths that need changes. No markdown. No explanation. No backticks.
Example: ["src/App.jsx", "src/styles.css"]
If unsure, include files that are most likely relevant. Maximum 10 files.`;

    try {
      const selectResponse = await this.api.post('/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: selectPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      let selectedContent = selectResponse.data.choices[0].message.content.trim();
      console.log('Pass 1 — Selected files:', selectedContent);

      selectedContent = this._cleanJson(selectedContent);
      const selectedPaths = JSON.parse(selectedContent);

      if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
        console.log('AI selected no files, falling back to single-pass with truncation');
        return this._singlePass(files.slice(0, 15), instruction);
      }

      // Filter to only selected files
      const relevantFiles = files.filter(f => 
        selectedPaths.some(p => f.path === p || f.path.endsWith(p) || p.endsWith(f.path))
      );

      if (relevantFiles.length === 0) {
        console.log('No matching files found, falling back to single-pass with truncation');
        return this._singlePass(files.slice(0, 15), instruction);
      }

      console.log(`Pass 2 — Sending ${relevantFiles.length} relevant files for modification`);

      // PASS 2: Send only relevant files for actual changes
      return this._singlePass(relevantFiles, instruction);

    } catch (error) {
      console.error('Two-pass selection failed, falling back:', error.message);
      // Fallback: just send first 15 files
      return this._singlePass(files.slice(0, 15), instruction);
    }
  }

  async _singlePass(files, instruction) {
    // Truncate individual file content if too long (max 500 lines per file)
    const truncatedFiles = files.map(f => {
      const lines = f.content.split('\n');
      if (lines.length > 500) {
        return {
          ...f,
          content: lines.slice(0, 500).join('\n') + '\n\n// ... [TRUNCATED - file has ' + lines.length + ' total lines]'
        };
      }
      return f;
    });

    const codebaseContext = truncatedFiles.map(f => `File: ${f.path}\nContent:\n${f.content}`).join('\n\n---\n\n');
    
    const systemPrompt = `You are a precise code editing assistant. You will receive:
1. A codebase (files with their content)
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
      
      content = this._cleanJson(content);
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('JSON Parse Error — Groq returned invalid JSON');
        throw new Error('Groq returned invalid JSON — try a more specific instruction');
      }
      const groqMsg = error.response?.data?.error?.message || error.message;
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new Error(groqMsg || 'Unknown Groq error');
    }
  }

  _cleanJson(content) {
    // Remove markdown code fences if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    return content.trim();
  }
}

module.exports = GroqService;
