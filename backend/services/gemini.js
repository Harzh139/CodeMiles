const axios = require('axios');

class GeminiService {
  constructor(apiKey, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Two-pass strategy for large repos:
   * Pass 1: Send file list + instruction → AI picks relevant files
   * Pass 2: Send only relevant files → AI generates changes
   */
  async getCodeChanges(files, instruction) {
    console.log(`[Gemini] Processing ${files.length} files for instruction: "${instruction}"`);

    // If repo is small (< 15 files), use single-pass (faster)
    if (files.length <= 15) {
      console.log('[Gemini] Small repo — using single-pass strategy');
      return this._singlePass(files, instruction);
    }

    // Large repo — use two-pass strategy
    console.log('[Gemini] Large repo — using two-pass strategy');
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
      const selectedContent = await this._callGemini(selectPrompt, {
        temperature: 0.1,
        responseMimeType: 'application/json'
      });

      console.log('[Gemini] Pass 1 — Selected files:', selectedContent);

      const cleanedContent = this._cleanJson(selectedContent);
      const selectedPaths = JSON.parse(cleanedContent);

      if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
        console.log('[Gemini] AI selected no files, falling back to single-pass with truncation');
        return this._singlePass(files.slice(0, 15), instruction);
      }

      // Filter to only selected files
      const relevantFiles = files.filter(f => 
        selectedPaths.some(p => f.path === p || f.path.endsWith(p) || p.endsWith(f.path))
      );

      if (relevantFiles.length === 0) {
        console.log('[Gemini] No matching files found, falling back to single-pass with truncation');
        return this._singlePass(files.slice(0, 15), instruction);
      }

      console.log(`[Gemini] Pass 2 — Sending ${relevantFiles.length} relevant files for modification`);

      // PASS 2: Send only relevant files for actual changes
      return this._singlePass(relevantFiles, instruction);

    } catch (error) {
      console.error('[Gemini] Two-pass selection failed, falling back:', error.message);
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
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const content = await this._callGemini(fullPrompt, {
        temperature: 0.1,
        responseMimeType: 'application/json'
      });

      console.log('[Gemini] Raw response (first 500 chars):', content.substring(0, 500));
      
      const cleanedContent = this._cleanJson(content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('[Gemini] JSON Parse Error — AI returned invalid JSON');
        throw new Error('AI returned invalid JSON — try a more specific instruction');
      }
      console.error('[Gemini] API Error:', error.message);
      throw new Error(error.message || 'Unknown Gemini error');
    }
  }

  async _callGemini(prompt, options = {}) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.1,
        responseMimeType: options.responseMimeType || 'text/plain'
      }
    };

    try {
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minute timeout
      });

      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        throw new Error('Invalid response form Gemini API');
      }

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Gemini API Error: ${msg}`);
    }
  }

  _cleanJson(content) {
    // Remove markdown code fences if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    return content.trim();
  }
}

module.exports = GeminiService;
