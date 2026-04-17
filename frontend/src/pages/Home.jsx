import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAuthUrl } from '../api';
import { Navigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Home() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  if (loading) return null;
  if (user) return <Navigate to="/repo" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flex: 1 }}>
      <div className="animate-float" style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src={logo} alt="CodeMiles Logo" style={{ width: '100px', height: '100px', marginBottom: '16px', borderRadius: '24px', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }} />
        <h1 style={{ fontSize: '48px', margin: 0, textShadow: '0 0 20px rgba(99,102,241,0.5)', letterSpacing: '-1px' }}>CodeMiles</h1>
        <p style={{ color: 'var(--secondary)', fontFamily: 'Space Mono', fontSize: '14px', marginTop: '8px' }}>AI-Powered Git Assistant</p>
      </div>

      {error && (
        <div className="error-message" style={{ width: '100%', marginBottom: '24px' }}>
          Authentication failed. Please try again.
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '320px', marginTop: 'auto', marginBottom: '40px' }}>
        <button 
          className="btn-primary" 
          onClick={() => window.location.href = getAuthUrl()}
        >
          Login with GitHub
        </button>
      </div>
    </div>
  );
}
