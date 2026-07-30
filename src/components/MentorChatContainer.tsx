import React, { useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MentorChatContainerProps {
  conversationId: string;
}

export function MentorChatContainer({ conversationId }: MentorChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userMessage: currentInput,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message to Mentor');
      }

      const mentorMsg: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, mentorMsg]);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        💬 Debrief with M1 Mentor
      </h3>
      
      <div style={{ 
        maxHeight: '260px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px',
        paddingRight: '8px',
        marginBottom: '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Ask M1 any follow-up questions about your performance, behavioral cues, or how to handle specific moments better.
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: m.role === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${m.role === 'user' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, marginBottom: '4px' }}>
                {m.role === 'user' ? 'You' : 'M1 Mentor'} • {m.timestamp}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{ alignSelf: 'flex-start', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            M1 Mentor is analyzing...
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '8px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask M1 about specific turns or cues..."
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '10px 14px',
            color: 'var(--text-color)',
            fontSize: '0.9rem'
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{ whiteSpace: 'nowrap' }}
        >
          {isLoading ? 'Sending...' : 'Ask M1'}
        </button>
      </div>
    </div>
  );
}
