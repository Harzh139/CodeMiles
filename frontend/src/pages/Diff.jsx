import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StepBar from '../components/StepBar';
import DiffViewer from '../components/DiffViewer';
import { pushCommit, getCodeChanges, readRepo } from '../api';
import Loader from '../components/Loader';
import { RefreshCcw, FileText, AlertCircle } from 'lucide-react';

export default function Diff() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If accessed directly without state
  if (!state || !state.changes) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p>No changes found.</p>
        <button className="btn-secondary" onClick={() => navigate('/repo')} style={{ marginTop: '16px' }}>Back to Repo</button>
      </div>
    );
  }

  const { changes, repoUrl, instruction } = state;

  const handlePush = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pushCommit(repoUrl, changes);
      navigate('/success', { state: { commitUrl: response.commitUrl, repoUrl, changes } });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Push failed');
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      // We might need to re-read repo if files changed, but for simple regenerate let's just re-run AI
      // The original repoData.files was passed in state if we want, or we can just re-read or use existing
      const repoData = await readRepo(repoUrl);
      const newChanges = await getCodeChanges(repoData.files, instruction);
      
      if (!Array.isArray(newChanges) || newChanges.length === 0) {
        throw new Error('Regeneration produced no changes.');
      }
      
      navigate('/diff', { state: { repoUrl, changes: newChanges, instruction }, replace: true });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Regeneration failed');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Pushing to GitHub..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Review Changes</h2>
        <div style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: 600 }}>
          {changes.length} {changes.length === 1 ? 'file' : 'files'} changed
        </div>
      </div>
      
      <StepBar currentStep={2} />

      {error && <div className="error-message">{error}</div>}

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-main)' }}>
          <FileText size={18} />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Files to be modified:</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {changes.map((c, i) => (
            <li key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--secondary)' }} />
              {c.filename}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {changes.map((change, idx) => (
          <div key={idx} className="card">
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--secondary)' }}>{change.filename}</h3>
            {change.summary && (
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                {change.summary}
              </p>
            )}
            <DiffViewer original={change.original} modified={change.modified} />
          </div>
        ))}
      </div>

      <div className="fixed-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <AlertCircle size={14} />
          Review changes before creating a commit
        </div>

        <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleRegenerate} 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            <RefreshCcw size={16} />
            Regenerate
          </button>
          
          <button className="btn-primary" onClick={handlePush} style={{ flex: 2 }}>
            Approve & Push
          </button>
        </div>
        
        <button onClick={() => navigate('/repo')} style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'underline' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
