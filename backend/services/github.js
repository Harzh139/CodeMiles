const axios = require('axios');

class GitHubService {
  constructor(token) {
    this.token = token;
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }

  async getUser() {
    const response = await this.api.get('/user');
    return response.data;
  }

  async getRepoDetails(repoUrl) {
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1];
    return { owner, repo };
  }

  async getRepoFiles(repoUrl) {
    const { owner, repo } = await this.getRepoDetails(repoUrl);
    
    // Get default branch
    const repoInfo = await this.api.get(`/repos/${owner}/${repo}`);
    const defaultBranch = repoInfo.data.default_branch;

    // Get recursive tree
    const treeResponse = await this.api.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    const tree = treeResponse.data.tree;

    const files = [];
    const MAX_FILES = 200;
    const MAX_FILE_SIZE = 100 * 1024; // 100KB
    const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.zip', '.exe', '.lock'];
    const IGNORED_PATHS = ['node_modules/', '.git/', 'package-lock.json', 'yarn.lock'];

    let count = 0;
    for (const item of tree) {
      if (item.type === 'blob' && count < MAX_FILES) {
        const isIgnored = IGNORED_PATHS.some(p => item.path.startsWith(p)) || 
                         IGNORED_EXTENSIONS.some(ext => item.path.endsWith(ext));
        
        if (!isIgnored) {
          try {
            const fileContentResponse = await this.api.get(`/repos/${owner}/${repo}/contents/${item.path}`);
            // Check size (though Contents API might vary, we check the item size from tree if available or after fetch)
            if (fileContentResponse.data.size <= MAX_FILE_SIZE) {
              const content = Buffer.from(fileContentResponse.data.content, 'base64').toString('utf8');
              files.push({
                path: item.path,
                content: content,
                sha: fileContentResponse.data.sha
              });
              count++;
            }
          } catch (error) {
            console.error(`Error fetching ${item.path}:`, error.message);
          }
        }
      }
    }

    return { files, owner, repo, branch: defaultBranch };
  }

  async updateFile(owner, repo, path, content, sha, message) {
    const response = await this.api.put(`/repos/${owner}/${repo}/contents/${path}`, {
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });
    return response.data;
  }
}

module.exports = GitHubService;
