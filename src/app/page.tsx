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
  const [activeTab, setActiveTab] = useState<"Date" | "Notes">("Date");
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
  const [masterLog, setMasterLog] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Refs for scroll sync
  const transcriptRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

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
          if (data.insights) {
            setInsights(data.insights);
            
            // Check if master log is already in metadata
            const log = data.insights.find((i: any) => i.type === 'metadata' && i.key === 'master_performance_log');
            if (log) setMasterLog(log.value);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); 
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversationId]);

  // Auto-scroll to bottom of boxes
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    if (toolsRef.current) toolsRef.current.scrollTop = toolsRef.current.scrollHeight;
  }, [insights]);

  const runSynthesis = async (id: string) => {
    setIsSynthesizing(true);
    try {
      const res = await fetch("/api/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      const data = await res.json();
      if (data.masterPerformanceLog) {
        setMasterLog(data.masterPerformanceLog);
      }
    } catch (err) {
      console.error("Synthesis failed:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

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
    setConversationUrl(null);
    setIsLoading(false);
    setActiveTab("Notes");
    
    // Trigger Gemini Zipper after session ends
    // Wait a moment for final webhooks to arrive
    setTimeout(() => runSynthesis(conversationId), 2000);
  };

  const startSparring = async () => {
    setIsLoading(true);
    setError(null);
    setInsights([]); 
    setMasterLog(null);
    setActiveTab("Date");
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

  // Extract data for the boxes
  const sessionSummary = insights.find(i => i.type === 'session_summary');
  const behavioralCues = insights.filter(i => i.type === 'behavioral_cue');
  const transcriptTurns = insights.filter(i => i.type === 'transcript_turn');

  return (
    <div className="container">
      <div className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ marginBottom: 0 }}>AI Shadowboxing</h1>
        </div>

        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'Date' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Date')}
          >
            Date
          </div>
          <div 
            className={`tab ${activeTab === 'Notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Notes')}
          >
            Notes
          </div>
        </div>
        
        {activeTab === 'Date' ? (
          <>
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
                placeholder="Define the grading rubrics and contextual knowledge..."
                rows={6}
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
                {isLoading ? "Provisioning..." : "Date"}
              </button>
            ) : (
              <button 
                className="btn btn-danger" 
                onClick={handleEndSessionManual}
                disabled={isLoading}
              >
                {isLoading ? "Ending..." : "End Session"}
              </button>
            )}
          </>
        ) : (
          <div className="notes-container" style={{ paddingBottom: '32px' }}>
            
            {/* Box 1: Transcript */}
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

            {/* Box 2: Tool Calls */}
            <div className="notes-section">
              <div className="notes-section-title">Tool Calls</div>
              <div className="scroll-box" ref={toolsRef}>
                {behavioralCues.length > 0 ? behavioralCues.map((cue, idx) => (
                  <div key={idx} className="note-item note-item-signal">
                    <div className="badge-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className={`badge ${cue.signalType === 'negative' ? 'badge-red' : 'badge-green'}`}>
                        {cue.category}: {cue.signalType}
                      </div>
                      <div className="insight-timestamp" style={{ marginTop: 0 }}>{new Date(cue.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{cue.reason}</div>
                  </div>
                )) : (
                  <div className="placeholder" style={{ fontSize: '0.8rem' }}>Raven is watching for cues...</div>
                )}
              </div>
            </div>

            {/* Box 3: Final Analysis */}
            <div className="notes-section">
              <div className="notes-section-title">Final Analysis</div>
              <div className="scroll-box" style={{ maxHeight: '180px' }}>
                {sessionSummary && sessionSummary.analysis ? Object.entries(sessionSummary.analysis).map(([key, value]: [string, any], idx) => (
                  <div key={idx} className="note-item" style={{ background: '#ffffff', borderColor: 'var(--border)' }}>
                    <div className="badge badge-blue">{key.split(':')[0]}</div>
                    <div style={{ lineHeight: '1.4' }}>{typeof value === 'string' ? value : value.answer}</div>
                    {value.turn_id && <div className="insight-timestamp">Turn ID: {value.turn_id}</div>}
                  </div>
                )) : (
                  <div className="placeholder" style={{ fontSize: '0.8rem' }}>Summary available after session end.</div>
                )}
              </div>
            </div>

            {/* Box 4: Mentor Transmission */}
            <div className="notes-section">
              <div className="notes-section-title">Mentor Transmission (Zipped Log)</div>
              <div className="scroll-box" style={{ maxHeight: 'none', background: '#f8f8fa' }}>
                {isSynthesizing ? (
                  <div className="placeholder" style={{ fontSize: '0.8rem' }}>The Zipper is interleaving streams...</div>
                ) : masterLog ? (
                  <div className="note-item" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem', background: 'transparent', border: 'none' }}>
                    {masterLog}
                  </div>
                ) : (
                  <div className="placeholder" style={{ fontSize: '0.8rem' }}>Transmission will arrive after session analysis.</div>
                )}
              </div>
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
            <p>Configure persona and knowledge base, then click <b>Date</b>.</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Waiting for WebRTC stream...</p>
          </div>
        )}
      </div>
    </div>
  );
}
