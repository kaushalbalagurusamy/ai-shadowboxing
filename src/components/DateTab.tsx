import React from 'react';

interface DateTabProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  knowledgeBase: string;
  setKnowledgeBase: (kb: string) => void;
  conversationUrl: string | null;
  error: string | null;
  isLoading: boolean;
  onStartSession: (prompt: string, kb: string, label: string) => void;
}

export function DateTab({
  systemPrompt,
  setSystemPrompt,
  knowledgeBase,
  setKnowledgeBase,
  conversationUrl,
  error,
  isLoading,
  onStartSession,
}: DateTabProps) {
  return (
    <>
      <div className="input-group">
        <label htmlFor="personaPrompt">Prompt</label>
        <textarea
          id="personaPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Define the avatar's personality..."
          rows={6}
          disabled={!!conversationUrl}
        />
      </div>

      <div className="input-group">
        <label htmlFor="knowledgeBase">Knowledge</label>
        <textarea
          id="knowledgeBase"
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          placeholder="Define the grading rubrics..."
          rows={6}
          disabled={!!conversationUrl}
        />
      </div>

      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "16px", fontSize: "0.9rem", fontWeight: 500 }}>
          Error: {error}
        </div>
      )}

      {!conversationUrl && (
        <button 
          className="btn btn-primary" 
          onClick={() => onStartSession(systemPrompt, knowledgeBase, 'Date')} 
          disabled={isLoading}
        >
          {isLoading ? "Provisioning..." : "Date"}
        </button>
      )}
    </>
  );
}
