import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StepBar from '../components/StepBar';
import { CheckCircle, ExternalLink } from 'lucide-react';

export default function Success() {
  const { state } = useLocation();
  const navigate = useNavigate();

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
          <a 
            href={state.commitUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', transition: 'all 0.2s', width: '100%' }}
          >
            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              View Commit
            </div>
            <ExternalLink size={18} />
          </a>
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
