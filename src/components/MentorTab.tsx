import React, { useState, useEffect, useRef } from 'react';
import { SessionSynthesis } from '@/hooks/useSessionInsights';

interface MentorTabProps {
  mentorPrompt: string;
  setMentorPrompt: (prompt: string) => void;
  mentorKnowledgeBase: string;
  setMentorKnowledgeBase: (kb: string) => void;
  conversationUrl: string | null;
  error: string | null;
  isLoading: boolean;
  isSynthesizing: boolean;
  synthesis: SessionSynthesis | null;
  onStartSession: (prompt: string, kb: string, label: string) => void;
}

export function MentorTab({
  mentorPrompt,
  setMentorPrompt,
  mentorKnowledgeBase,
  setMentorKnowledgeBase,
  conversationUrl,
  error,
  isLoading,
  isSynthesizing,
  synthesis,
  onStartSession,
}: MentorTabProps) {
  const isButtonEnabled = !!synthesis && !!mentorPrompt.trim() && !isLoading && !isSynthesizing;
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const [activeClipLabel, setActiveClipLabel] = useState<string | null>(null);

  const clips = synthesis?.mentor_prompt_m1?.clips || [];
  const recordingUrl = synthesis?.recordingUrl;

  // L11 Performance Optimization: Proactive RAM pre-buffering of video clips before WebRTC stream starts
  useEffect(() => {
    if (mainVideoRef.current && recordingUrl && clips.length > 0) {
      const firstClip = clips[0];
      mainVideoRef.current.src = recordingUrl;
      mainVideoRef.current.preload = "auto";
      mainVideoRef.current.currentTime = firstClip.clip_start_time;
    }
  }, [recordingUrl, clips]);

  // Dual-Phase Sync Engine (requestAnimationFrame Audio Clock Sync)
  useEffect(() => {
    if (!conversationUrl || clips.length === 0) return;

    speechStartTimeRef.current = Date.now();
    let animId: number;

    const syncLoop = () => {
      if (!speechStartTimeRef.current) return;
      const elapsedSeconds = (Date.now() - speechStartTimeRef.current) / 1000;

      clips.forEach(clip => {
        const clipDuration = clip.clip_end_time - clip.clip_start_time;
        if (
          elapsedSeconds >= clip.speech_offset_seconds &&
          elapsedSeconds < clip.speech_offset_seconds + clipDuration
        ) {
          setActiveClipLabel(clip.label);
          if (mainVideoRef.current) {
            mainVideoRef.current.volume = 0.15; // -18dB Audio Ducking for live Darius commentary
            if (mainVideoRef.current.paused) {
              mainVideoRef.current.currentTime = clip.clip_start_time;
              mainVideoRef.current.play().catch(() => {});
            } else if (mainVideoRef.current.currentTime >= clip.clip_end_time) {
              mainVideoRef.current.pause();
            }
          }
        } else if (elapsedSeconds >= clip.speech_offset_seconds + clipDuration) {
          if (mainVideoRef.current && !mainVideoRef.current.paused) {
            mainVideoRef.current.pause();
            setActiveClipLabel(null);
          }
        }
      });

      animId = requestAnimationFrame(syncLoop);
    };

    animId = requestAnimationFrame(syncLoop);

    return () => {
      cancelAnimationFrame(animId);
      if (mainVideoRef.current) {
        mainVideoRef.current.pause();
        mainVideoRef.current.src = "";
        mainVideoRef.current.load();
      }
    };
  }, [conversationUrl, clips]);

  const handleLearnClick = () => {
    if (!isButtonEnabled) return;
    onStartSession(mentorPrompt, mentorKnowledgeBase, 'Mentor');
  };

  return (
    <>
      {/* Zoom-Style Split UI when Mentor WebRTC Call is Active */}
      {conversationUrl ? (
        <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '16px', marginBottom: '24px' }}>
          
          {/* Main Stage (70%): Recorded Practice Video Player with Evidence Clips */}
          <div style={{ background: '#000000', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '360px', border: '1px solid var(--border)' }}>
            <video
              ref={mainVideoRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
            />

            {/* Real-time Clip Overlay */}
            {activeClipLabel && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  left: '16px', 
                  background: 'rgba(0,0,0,0.75)', 
                  color: '#00ffcc', 
                  padding: '6px 14px', 
                  borderRadius: '6px', 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  fontFamily: 'monospace',
                  border: '1px solid rgba(0,255,204,0.4)' 
                }}
              >
                EVIDENCE CLIP: {activeClipLabel} (-18dB Ducked Audio)
              </div>
            )}
          </div>

          {/* Side Panel (30%): Uninterruptible Mentor Stream */}
          <div style={{ background: '#111116', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse" style={{ color: '#00c864' }}>●</span> Darius (Mentor)
              </div>
              <div className="badge badge-green" style={{ fontSize: '0.7rem', padding: '4px 8px', marginBottom: '12px' }}>
                Uninterruptible 45s Debrief
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', opacity: 0.7, color: '#ffffff', lineHeight: '1.4' }}>
              Darius is delivering your 45-second hybrid debrief. Evidence clips play on the Main Stage with ducked audio during Phase 2.
          </div>
        </div>

        </div>
      ) : (
        <>
          <div className="input-group">
            <label htmlFor="mentorPrompt">Mentor Prompt</label>
            <textarea
              id="mentorPrompt"
              value={mentorPrompt}
              onChange={(e) => setMentorPrompt(e.target.value)}
              placeholder="The synthesized mentor instructions will appear here post-date..."
              rows={10}
              disabled={!!conversationUrl}
            />
          </div>

          <div className="input-group">
            <label htmlFor="mentorKnowledge">Mentor Knowledge</label>
            <textarea
              id="mentorKnowledge"
              value={mentorKnowledgeBase}
              onChange={(e) => setMentorKnowledgeBase(e.target.value)}
              placeholder="Define the mentor's evaluation logic..."
              rows={4}
              disabled={!!conversationUrl}
            />
          </div>

          {error && (
            <div style={{ color: "var(--danger)", marginBottom: "16px", fontSize: "0.9rem", fontWeight: 500 }}>
              Error: {error}
            </div>
          )}

          <div className="mentor-status" style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', border: '1px dashed var(--border)' }}>
            {isSynthesizing ? (
              <div style={{ color: 'var(--pastel-green-text)', fontWeight: 600 }}>
                <span className="pulse">●</span> Synthesis in progress...
              </div>
            ) : synthesis ? (
              <div>
                <div style={{ color: 'var(--pastel-green-text)', fontWeight: 600, marginBottom: '8px' }}>
                  ✓ Post-Session Knowledge Loaded
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleLearnClick} 
                  style={{ background: 'var(--pastel-green)', color: 'var(--pastel-green-text)', borderColor: 'transparent', width: '100%' }}
                  disabled={!isButtonEnabled}
                >
                  {isLoading ? "Provisioning..." : "Learn"}
                </button>
              </div>
            ) : (
              <div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleLearnClick} 
                  style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}
                  disabled={true}
                >
                  Learn
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
