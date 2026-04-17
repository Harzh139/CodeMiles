import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StepBar from '../components/StepBar';
import { CheckCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { revertCommit } from '../api';
import Loader from '../components/Loader';

export default function Success() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [reverted, setReverted] = React.useState(false);

  const handleRevert = async () => {
    if (!state?.repoUrl || !state?.changes) return;
    
    setLoading(true);
    setError('');
    try {
      await revertCommit(state.repoUrl, state.changes);
      setReverted(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Revert failed');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Reverting changes..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <h2 style={{ margin: 0, fontSize: '20px', textAlign: 'center' }}>Done</h2>
      <StepBar currentStep={3} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '-40px' }}>
        <div style={{ color: 'var(--success)', marginBottom: '24px' }} className="animate-float">
          <CheckCircle size={80} strokeWidth={1} />
        </div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Pushed! 🚀</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px', maxWidth: '280px' }}>
          Your code has been successfully pushed to the repository.
        </p>

        {state?.commitUrl && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a 
              href={state.commitUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', transition: 'all 0.2s' }}
            >
              <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                View Commit
              </div>
              <ExternalLink size={18} />
            </a>

            {!reverted ? (
              <button 
                onClick={handleRevert}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--error)', borderColor: 'rgba(248, 113, 113, 0.2)' }}
              >
                <RotateCcw size={18} />
                Revert this change
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--success)', fontSize: '14px', fontWeight: 600 }}>
                ✓ Changes reverted successfully
              </div>
            )}
            
            {error && <div className="error-message" style={{ marginTop: '8px' }}>{error}</div>}
          </div>
        )}
      </div>

      <div className="fixed-bottom">
        <button className="btn-primary" onClick={() => navigate('/repo')}>
          Make another change
        </button>
      </div>
    </div>
  );
}
