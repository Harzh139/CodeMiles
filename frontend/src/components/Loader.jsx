import React from 'react';

export default function Loader({ text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 40, flex: 1 }}>
      <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '24px' }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          border: '3px solid transparent',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
      <p className="animate-pulse" style={{ color: 'var(--text-main)', fontWeight: 500 }}>
        {text || 'Loading...'}
      </p>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
