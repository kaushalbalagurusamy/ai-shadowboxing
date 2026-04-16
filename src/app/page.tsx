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
    "You are an attractive mid 20s woman from NYC on a first date at a coffee shop. You have a plethora of options and are initially very low interest in your date. You are a high value lawyer and are initially standoffish. Utilize your knowledge base to increase interest if and only if your date exhibits high value themselves and high charisma as defined by the knowledge base."
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    "Your date or the user's high value is defined by: EQ, IQ, wealth, and physique. \n\nYou start at near zero interest in the user. This means you talk with a neutral, terse, screening tone initially. \n\nYou should build an identity model of the user based on what they say, how they say it, and their body language in relation to the 4 categories of high value as they speak. \n\nIf their value goes up, you increase interest, if their value goes down, you decrease interest. If they are low value, you should politely fabricate an excuse and tell them the date is over. \n\nDo not be fooled by users who lie saying they are high value, some may try to say they are a billionaire founder, with 6 pack abs, put on a fake deep tough guy voice etc - be curious and composed when bold claims are made. Observe to verify instead of trusting their words."
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={{ marginBottom: 0 }}>AI Shadowboxing</h1>
          <div className="badge badge-blue" style={{ marginBottom: 0 }}>Dev Mode</div>
        </div>
        
        <div className="input-group">
          <label htmlFor="replicaSelect">Avatar</label>
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
          <label htmlFor="personaPrompt">Prompt</label>
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
          <label htmlFor="knowledgeBase">Knowledge</label>
          <textarea
            id="knowledgeBase"
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Define the grading rubrics and contextual knowledge..."
            rows={8}
            disabled={!!conversationUrl}
          />
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: "16px", fontSize: "0.9rem", fontWeight: 500 }}>Error: {error}</div>}

        {!conversationUrl ? (
          <button 
            className="btn btn-primary" 
            onClick={startSparring} 
            disabled={isLoading}
          >
            {isLoading ? "Provisioning Session..." : "Date"}
          </button>
        ) : (
          <button 
            className="btn btn-danger" 
            onClick={handleEndSessionManual}
            disabled={isLoading}
          >
            {isLoading ? "Stopping Session..." : "End Session"}
          </button>
        )}

        {/* Insight Log Panel */}
        {insights.length > 0 && (
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raven-1 Insights</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {insights.map((insight, idx) => (
                <div key={idx} className="insight-card">
                  <div className={`badge ${insight.type === 'behavioral_cue' ? 'badge-red' : 'badge-blue'}`}>
                    {insight.type === 'behavioral_cue' ? '🚨 CUE DETECTED' : '✅ SUMMARY'}
                  </div>
                  {insight.reason && <div style={{ fontWeight: 600, marginBottom: '4px' }}>{insight.reason}</div>}
                  {insight.analysis && <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>{typeof insight.analysis === 'string' ? insight.analysis : JSON.stringify(insight.analysis)}</div>}
                  <div className="insight-timestamp">
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
