import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { readRepo, getCodeChanges } from '../api';
import StepBar from '../components/StepBar';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function Repo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, handleLogout } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('gh_token', token);
      window.history.replaceState({}, '', '/repo');
    }
  }, [searchParams]);
  
  const [repoUrl, setRepoUrl] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl || !instruction) return;
    
    setError('');
    setLoading(true);
    
    try {
      setLoadingText('Reading your codebase...');
      const repoData = await readRepo(repoUrl);
      
      setLoadingText('AI is thinking...');
      const changes = await getCodeChanges(repoData.files, instruction);
      
      if (!Array.isArray(changes)) {
        throw new Error('AI returned an unexpected response, try rephrasing');
      }

      if (changes.length === 0) {
        throw new Error('AI determined no changes were needed for that instruction.');
      }

      // Pass state to diff page
      navigate('/diff', { state: { repoUrl, changes } });
      
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text={loadingText} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>New Change</h2>
        <button onClick={handleLogout} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogOut size={16} /> 
          <span style={{ fontSize: '14px' }}>Logout</span>
        </button>
      </div>
      
      <StepBar currentStep={1} />
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>GitHub Repository URL</label>
            <input 
              type="url" 
              className="input-field" 
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>What should we change?</label>
            <textarea 
              className="input-field" 
              placeholder="e.g. change the hero heading font size to 48px in src/styles/main.css"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={4}
              required
              style={{ resize: 'none' }}
            />
          </div>
        </div>
        
        <div className="fixed-bottom">
          <button type="submit" className="btn-primary" disabled={!repoUrl || !instruction}>
            Generate Diff
          </button>
        </div>
      </form>
    </div>
  );
}
