import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StepBar from '../components/StepBar';
import DiffViewer from '../components/DiffViewer';
import { pushCommit } from '../api';
import Loader from '../components/Loader';

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

  const { changes, repoUrl } = state;

  const handlePush = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pushCommit(repoUrl, changes);
      navigate('/success', { state: { commitUrl: response.commitUrl } });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Push failed');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Pushing to GitHub..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '100px' }}>
      <h2 style={{ margin: 0, fontSize: '20px' }}>Review Changes</h2>
      <StepBar currentStep={2} />

      {error && <div className="error-message">{error}</div>}

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

      <div className="fixed-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <button onClick={() => navigate('/repo')} style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'underline' }}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handlePush}>
          Approve & Push
        </button>
      </div>
    </div>
  );
}
