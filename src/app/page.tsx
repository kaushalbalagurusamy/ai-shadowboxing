"use client";

import { useState } from "react";

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a charismatic, slightly challenging conversation partner. You are testing the user's ability to hold a fluid, confident conversation. If they hesitate or break eye contact, gently call them out. Maintain a natural, casual tone like a first date at a coffee shop."
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    "Rubric 1: Confidence - Measured by steady speaking pace and lack of filler words.\nRubric 2: Engagement - Measured by asking follow-up questions.\nRubric 3: Assertiveness - Measured by holding opinions gently but firmly."
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startSparring = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tavus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, knowledgeBase }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to start conversation");
      }
      
      setConversationUrl(data.url);
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
          <label htmlFor="personaPrompt">Persona Prompt</label>
          <textarea
            id="personaPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define the avatar's personality..."
            rows={8}
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
          />
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>Error: {error}</div>}

        <button 
          className="btn" 
          onClick={startSparring} 
          disabled={isLoading || !!conversationUrl}
        >
          {isLoading ? "Provisioning Session..." : conversationUrl ? "Session Active" : "Start Sparring (P0)"}
        </button>
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
