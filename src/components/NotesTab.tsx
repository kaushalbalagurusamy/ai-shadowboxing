import React, { RefObject } from 'react';
import { SessionInsight } from '@/lib/insightStore';
import { SessionSynthesis } from '@/hooks/useSessionInsights';

interface NotesTabProps {
  insights: SessionInsight[];
  masterLog: string | null;
  synthesis: SessionSynthesis | null;
  isSynthesizing: boolean;
  transcriptRef: RefObject<HTMLDivElement | null>;
  toolsRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  onApplyNextPartnerPrompt: (prompt: string) => void;
}

export function NotesTab({
  insights,
  masterLog,
  synthesis,
  isSynthesizing,
  transcriptRef,
  toolsRef,
  videoRef,
  onApplyNextPartnerPrompt,
}: NotesTabProps) {
  const sessionSummary = insights.find(i => i.type === 'session_summary');
  const behavioralCues = insights.filter(i => i.type === 'behavioral_cue');
  const transcriptTurns = insights.filter(i => i.type === 'transcript_turn');

  const firstInsight = transcriptTurns.length > 0 ? transcriptTurns[0] : (behavioralCues.length > 0 ? behavioralCues[0] : null);
  const startTime = firstInsight && firstInsight.timestamp ? new Date(firstInsight.timestamp).getTime() : null;

  const handleCueClick = (timestamp?: string) => {
    if (!timestamp || !startTime || !videoRef.current) return;
    const offsetSeconds = Math.max(0, (new Date(timestamp).getTime() - startTime) / 1000);
    videoRef.current.currentTime = offsetSeconds;
    videoRef.current.play().catch(e => console.error("Playback failed:", e));
  };

  return (
    <div className="notes-container" style={{ paddingBottom: '32px' }}>
      
      {sessionSummary?.recordingUrl && (
        <div className="notes-section">
          <div className="notes-section-title">Session Recording</div>
          <video 
            ref={videoRef} 
            src={sessionSummary.recordingUrl} 
            controls 
            style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', background: '#000' }}
          />
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Click on any Tool Call below to jump to that moment in the video.</div>
        </div>
      )}

      <div className="notes-section">
        <div className="notes-section-title">Transcript</div>
        <div className="scroll-box" ref={transcriptRef}>
          {transcriptTurns.length > 0 ? transcriptTurns.map((turn, idx) => (
            <div key={idx} className={`note-item note-item-${turn.role}`}>
              <div className="note-label">{turn.role === 'assistant' ? 'Partner' : 'You'}</div>
              {turn.text}
            </div>
          )) : (
            <div className="placeholder" style={{ fontSize: '0.8rem' }}>Awaiting dialogue...</div>
          )}
        </div>
      </div>

      <div className="notes-section">
        <div className="notes-section-title">Tool Calls</div>
        <div className="scroll-box" ref={toolsRef}>
          {behavioralCues.length > 0 ? behavioralCues.map((cue, idx) => (
            <div 
              key={idx} 
              className="note-item note-item-signal" 
              style={{ cursor: sessionSummary?.recordingUrl ? 'pointer' : 'default' }}
              onClick={() => handleCueClick(cue.timestamp)}
            >
              <div className="badge-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className={`badge ${cue.signalType === 'negative' ? 'badge-red' : 'badge-green'}`}>
                  {cue.category}: {cue.signalType}
                </div>
                <div className="insight-timestamp" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {sessionSummary?.recordingUrl && <span>▶</span>}
                  {cue.timestamp ? new Date(cue.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>{cue.reason}</div>
            </div>
          )) : (
            <div className="placeholder" style={{ fontSize: '0.8rem' }}>Raven is watching for cues...</div>
          )}
        </div>
      </div>

      <div className="notes-section">
        <div className="notes-section-title">Final Analysis</div>
        <div className="scroll-box" style={{ maxHeight: '150px' }}>
          {sessionSummary && sessionSummary.analysis ? Object.entries(sessionSummary.analysis).map(([key, value], idx) => {
            const valAny = value as { answer?: string; turn_id?: string } | string;
            return (
              <div key={idx} className="note-item" style={{ background: '#ffffff', borderColor: 'var(--border)' }}>
                <div className="badge badge-blue">{key.split(':')[0]}</div>
                <div style={{ lineHeight: '1.4' }}>{typeof valAny === 'string' ? valAny : valAny.answer}</div>
                {typeof valAny !== 'string' && valAny?.turn_id && <div className="insight-timestamp">Turn ID: {valAny.turn_id}</div>}
              </div>
            );
          }) : (
            <div className="placeholder" style={{ fontSize: '0.8rem' }}>Summary available after session end.</div>
          )}
        </div>
      </div>

      <div className="notes-section">
        <div className="notes-section-title">Mentor Transmission</div>
        <div className="scroll-box" style={{ maxHeight: 'none', background: '#f8f8fa' }}>
          {isSynthesizing ? (
            <div className="placeholder" style={{ fontSize: '0.8rem' }}>Coach is synthesizing performance...</div>
          ) : synthesis ? (
            <div className="notes-container" style={{ gap: '12px' }}>
              <div className="insight-card" style={{ background: '#ffffff', border: 'none' }}>
                <div className="badge-row" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {Object.entries(synthesis.audit.scores).map(([k, v]) => (
                    <div key={k} className="badge badge-blue" style={{ marginBottom: 0 }}>{k}: {v}/10</div>
                  ))}
                </div>
                <div className="note-label" style={{ color: 'var(--danger)' }}>Primary Weakness</div>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{synthesis.audit.primary_weakness}</div>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.4', opacity: 0.8 }}>{synthesis.audit.rationale}</div>
              </div>
              
              <div className="note-item" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', background: '#ffffff', borderColor: 'var(--border)' }}>
                <div className="note-label">Mentor Prompt (M1)</div>
                {synthesis.mentor_prompt.system_instruction}
              </div>

              <div className="note-item" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', background: '#ffffff', borderColor: 'var(--border)' }}>
                <div className="note-label">Next Partner Prompt (P1)</div>
                {synthesis.next_partner_prompt.system_instruction}
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '12px', fontSize: '0.75rem', padding: '6px 12px', width: 'auto' }}
                  onClick={() => onApplyNextPartnerPrompt(synthesis.next_partner_prompt.system_instruction)}
                >
                  Apply P1 to Next Date
                </button>
              </div>

              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '0.7rem', cursor: 'pointer', opacity: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>View Zipped Log</summary>
                <div className="note-item" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem', background: 'transparent', border: 'none', marginTop: '8px' }}>
                  {masterLog}
                </div>
              </details>
            </div>
          ) : (
            <div className="placeholder" style={{ fontSize: '0.8rem' }}>Transmission will arrive after session analysis.</div>
          )}
        </div>
      </div>

    </div>
  );
}
