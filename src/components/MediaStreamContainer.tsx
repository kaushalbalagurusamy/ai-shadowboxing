import React from 'react';
import { ReceptivityTier } from '@/lib/interestController';

interface MediaStreamContainerProps {
  conversationUrl: string | null;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  receptivityScore?: number;
  receptivityTier?: ReceptivityTier;
}

export function MediaStreamContainer({ 
  conversationUrl, 
  iframeRef, 
  receptivityScore = 50, 
  receptivityTier = 'SCREENING' 
}: MediaStreamContainerProps) {
  const getTierColor = (tier: ReceptivityTier) => {
    switch (tier) {
      case 'LOCKED': return '#ff4444';
      case 'OPEN': return '#00ffcc';
      case 'SCREENING':
      default: return '#f0b90b';
    }
  };

  const getTierDescription = (tier: ReceptivityTier) => {
    switch (tier) {
      case 'LOCKED': return 'Low Patience • High Screening';
      case 'OPEN': return 'Receptive • High Banter';
      case 'SCREENING':
      default: return 'Evaluating Frame • Neutral';
    }
  };

  return (
    <div className="main-content" style={{ position: 'relative' }}>
      {conversationUrl ? (
        <>
          <iframe 
            ref={iframeRef}
            src={conversationUrl} 
            allow="camera; microphone; fullscreen; display-capture" 
            className="video-frame"
          />
          {/* Receptivity Governor Real-Time HUD (ADR 0006) */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(10, 15, 25, 0.85)',
            border: `1px solid ${getTierColor(receptivityTier)}`,
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#ffffff',
            fontFamily: 'monospace',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px ${getTierColor(receptivityTier)}33`,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '180px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ color: getTierColor(receptivityTier) }}>
                ● {receptivityTier}
              </span>
              <span style={{ opacity: 0.9 }}>
                {Math.round(receptivityScore)} / 100
              </span>
            </div>
            {/* Score progress bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(0, Math.min(100, receptivityScore))}%`,
                height: '100%',
                background: getTierColor(receptivityTier),
                transition: 'width 0.3s ease-out',
              }} />
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
              {getTierDescription(receptivityTier)}
            </div>
          </div>
        </>
      ) : (
        <div className="placeholder">
          <p>Configure persona and knowledge base, then click <b>Date</b>.</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Waiting for WebRTC stream...</p>
        </div>
      )}
    </div>
  );
}

