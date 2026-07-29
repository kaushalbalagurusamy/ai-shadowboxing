import React from 'react';

interface MediaStreamContainerProps {
  conversationUrl: string | null;
}

export function MediaStreamContainer({ conversationUrl }: MediaStreamContainerProps) {
  return (
    <div className="main-content">
      {conversationUrl ? (
        <iframe 
          src={conversationUrl} 
          allow="camera; microphone; fullscreen; display-capture" 
          className="video-frame"
        />
      ) : (
        <div className="placeholder">
          <p>Configure persona and knowledge base, then click <b>Date</b>.</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Waiting for WebRTC stream...</p>
        </div>
      )}
    </div>
  );
}
