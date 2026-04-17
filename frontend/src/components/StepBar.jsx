import React from 'react';

export default function StepBar({ currentStep }) {
  const steps = [1, 2, 3]; // 1: Repo/Instruction, 2: Diff, 3: Success

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px', marginTop: '16px' }}>
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isPast = step < currentStep;
        return (
          <div 
            key={step}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isActive ? 'var(--secondary)' : (isPast ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
              boxShadow: isActive ? '0 0 10px var(--secondary)' : 'none',
              transition: 'all 0.3s ease'
            }}
          />
        );
      })}
    </div>
  );
}
