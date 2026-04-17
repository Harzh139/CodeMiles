import React, { useMemo } from 'react';
import { diffLines } from 'diff';

export default function DiffViewer({ original, modified }) {
  const diffParts = useMemo(() => {
    return diffLines(original || '', modified || '');
  }, [original, modified]);

  return (
    <div style={{
      background: '#0d0d12',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: 'Space Mono',
      fontSize: '13px',
      border: '1px solid var(--border)',
      marginTop: '12px'
    }}>
      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--diff-add-text)' }}>
            <span>🟢</span> Added
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--diff-rem-text)' }}>
            <span>🔴</span> Removed
          </div>
        </div>
      </div>
      <div style={{ padding: '12px', overflowX: 'auto' }}>
        {diffParts.map((part, index) => {
          if (!part.added && !part.removed && part.value.trim() === '') return null;
          
          let bgColor = 'transparent';
          let textColor = 'var(--text-main)';
          let prefix = ' ';
          
          if (part.added) {
            bgColor = 'var(--diff-add-bg)';
            textColor = 'var(--diff-add-text)';
            prefix = '+';
          } else if (part.removed) {
            bgColor = 'var(--diff-rem-bg)';
            textColor = 'var(--diff-rem-text)';
            prefix = '-';
          } // Unchanged lines remain transparent

          return (
            <div key={index} style={{ 
              background: bgColor, 
              color: textColor,
              padding: '2px 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              opacity: (!part.added && !part.removed) ? 0.5 : 1
            }}>
              {part.value.split('\n').map((line, i) => {
                if (i === part.value.split('\n').length - 1 && line === '') return null;
                return (
                  <div key={i} style={{ display: 'flex' }}>
                    <span style={{ width: '24px', flexShrink: 0, opacity: 0.5, userSelect: 'none' }}>{prefix}</span>
                    <span>{line}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
