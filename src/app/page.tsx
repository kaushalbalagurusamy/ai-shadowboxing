"use client";

import { useState, useEffect, useRef } from "react";

const CORE_AVATARS = [
  { id: "r9d30b0e55ac", name: "Luna" },
  { id: "rf4703150052", name: "Charlie" },
  { id: "rc2146c13e81", name: "Olivia" },
  { id: "r4317e64d25a", name: "Gloria" },
  { id: "r6ae5b6efc9d", name: "Anna" },
  { id: "r9c55f9312fb", name: "Steph - Office V1" },
  { id: "r1a4e22fa0d9", name: "Benjamin" },
  { id: "r68fe8906e53", name: "Mary - Office" },
  { id: "r67d1c9cac37", name: "Jackie - Office V2" },
  { id: "ra066ab28864", name: "Raj" }
];

export default function Home() {
  const [replicaId, setReplicaId] = useState(CORE_AVATARS[0].id);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a charismatic, slightly challenging conversation partner. You are testing the user's ability to hold a fluid, confident conversation. If they hesitate or break eye contact, gently call them out. Maintain a natural, casual tone like a first date at a coffee shop."
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    "Rubric 1: Confidence - Measured by steady speaking pace and lack of filler words.\nRubric 2: Engagement - Measured by asking follow-up questions.\nRubric 3: Assertiveness - Measured by holding opinions gently but firmly."
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);

  // Ref to store conversationId for cleanup
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
    
    // Start polling for insights when conversation starts
    let interval: NodeJS.Timeout;
    if (conversationId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/tavus/insights?conversationId=${conversationId}`);
          const data = await res.json();
          if (data.insights) setInsights(data.insights);
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversationId]);

  const endSession = async (idToEnd: string) => {
    try {
      await fetch("/api/tavus/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: idToEnd }),
      });
    } catch (err) {
      console.error("Failed to end session on cleanup:", err);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (conversationIdRef.current) {
        // Use sendBeacon for more reliable cleanup on close
        const blob = new Blob(
          [JSON.stringify({ conversationId: conversationIdRef.current })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/tavus/end", blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (conversationIdRef.current) {
        endSession(conversationIdRef.current);
      }
    };
  }, []);

  const handleEndSessionManual = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    await endSession(conversationId);
    // Don't clear conversationId immediately so we can see final summary
    setConversationUrl(null);
    setIsLoading(false);
  };

  const startSparring = async () => {
    setIsLoading(true);
    setError(null);
    setInsights([]); // Reset insights for new session
    try {
      const res = await fetch("/api/tavus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, knowledgeBase, replicaId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to start conversation");
      }
      
      setConversationUrl(data.url);
      setConversationId(data.conversationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="sidebar">
        <h1>AI Shadowboxing</h1>
        
        <div className="input-group">
          <label htmlFor="replicaSelect">Sparring Partner (Avatar)</label>
          <select 
            id="replicaSelect" 
            value={replicaId} 
            onChange={(e) => setReplicaId(e.target.value)}
            disabled={!!conversationUrl}
          >
            {CORE_AVATARS.map((avatar) => (
              <option key={avatar.id} value={avatar.id}>
                {avatar.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="personaPrompt">Persona Prompt</label>
          <textarea
            id="personaPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define the avatar's personality..."
            rows={8}
            disabled={!!conversationUrl}
          />
        </div>

        <div className="input-group">
          <label htmlFor="knowledgeBase">Knowledge Base (Rubrics)</label>
          <textarea
            id="knowledgeBase"
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Define the grading rubrics and contextual knowledge..."
            rows={8}
            disabled={!!conversationUrl}
          />
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>Error: {error}</div>}

        {!conversationUrl ? (
          <button 
            className="btn" 
            onClick={startSparring} 
            disabled={isLoading}
          >
            {isLoading ? "Provisioning Session..." : "Start Sparring (P0)"}
          </button>
        ) : (
          <button 
            className="btn" 
            style={{ backgroundColor: "var(--danger)" }}
            onClick={handleEndSessionManual}
            disabled={isLoading}
          >
            {isLoading ? "Stopping Session..." : "End Session"}
          </button>
        )}

        {/* Insight Log Panel */}
        {insights.length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>Raven-1 Insights</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {insights.map((insight, idx) => (
                <div key={idx} style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '8px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    {insight.type === 'behavioral_cue' ? '🚨 CUE DETECTED' : '✅ SESSION SUMMARY'}
                  </div>
                  {insight.reason && <div>Reason: {insight.reason}</div>}
                  {insight.analysis && <div>Summary: {JSON.stringify(insight.analysis)}</div>}
                  <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>
                    {new Date(insight.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        {conversationUrl ? (
          <iframe 
            src={conversationUrl} 
            allow="camera; microphone; fullscreen; display-capture" 
            className="video-frame"
          />
        ) : (
          <div className="placeholder">
            <p>Configure persona and knowledge base, then click <b>Start Sparring</b>.</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Waiting for WebRTC stream...</p>
          </div>
        )}
      </div>
    </div>
  );
}
