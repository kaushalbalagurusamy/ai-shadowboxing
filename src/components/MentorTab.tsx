import React from 'react';
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

  const handleLearnClick = () => {
    if (!isButtonEnabled) return;
    onStartSession(mentorPrompt, mentorKnowledgeBase, 'Mentor');
  };

  return (
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

      {!conversationUrl && (
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
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '12px' }}>
                Mentor feedback pending. Complete a Date session to generate personalized debrief instructions.
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleLearnClick} 
                style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}
                disabled={true}
              >
                Learn (Requires Completed Date)
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
