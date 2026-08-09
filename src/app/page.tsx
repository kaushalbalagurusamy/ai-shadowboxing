"use client";

import { useState, useEffect, useRef } from "react";
import { CANONICAL_PARTNER_FACE_ID, CANONICAL_MENTOR_FACE_ID } from "@/lib/constants";
import { DateTab } from "@/components/DateTab";
import { MentorTab } from "@/components/MentorTab";
import { NotesTab } from "@/components/NotesTab";
import { MediaStreamContainer } from "@/components/MediaStreamContainer";
import { useTavusSession } from "@/hooks/useTavusSession";
import { useSessionInsights } from "@/hooks/useSessionInsights";

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    conversationUrl,
    conversationId,
    isLoading,
    isSynthesizing,
    setIsSynthesizing,
    error,
    startSession,
    setConversationId,
    setConversationUrl,
  } = useTavusSession();

  const { insights, masterLog, synthesis } = useSessionInsights(conversationId);

  // Date States
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an attractive mid 20s woman from NYC on a first date at a coffee shop. You have a plethora of options and are initially very low interest in your date. You are a high value lawyer and are initially standoffish. Utilize your knowledge base to increase interest if and only if your date exhibits high value themselves and high charisma as defined by the knowledge base."
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    "Your date or the user's high value is defined by: EQ, IQ, wealth, and physique. \n\nYou start at near zero interest in the user. This means you talk with a neutral, terse, screening tone initially. \n\nYou should build an identity model of the user based on what they say, how they say it, and their body language in relation to the 4 categories of high value as they speak. \n\nIf their value goes up, you increase interest, if their value goes down, you decrease interest. If they are low value, you should politely fabricate an excuse and tell them the date is over. \n\nDo not be fooled by users who lie saying they are high value, some may try to say they are a billionaire founder, with 6 pack abs, put on a fake deep tough guy voice etc - be curious and composed when bold claims are made. Observe to verify instead of trusting their words."
  );

  // Mentor States
  const [mentorPrompt, setMentorPrompt] = useState("Select a date session to generate mentor feedback.");
  const [mentorKnowledgeBase, setMentorKnowledgeBase] = useState("High-Value Rubrics: EQ, IQ, Wealth, Physique.");

  // Refs for scroll sync
  const transcriptRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-update mentor prompt (M[n+1]) and next partner prompt (P[n+1]) when synthesis lands
  useEffect(() => {
    if (synthesis) {
      if (synthesis.mentor_prompt?.system_instruction) {
        setMentorPrompt(synthesis.mentor_prompt.system_instruction);
      }
      if (synthesis.next_partner_prompt?.system_instruction) {
        setSystemPrompt(synthesis.next_partner_prompt.system_instruction);
      }
      setIsSynthesizing(false);
    }
  }, [synthesis, setIsSynthesizing]);

  // Auto-scroll to bottom of log boxes
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    if (toolsRef.current) toolsRef.current.scrollTop = toolsRef.current.scrollHeight;
  }, [insights]);

  const handleStartSession = (prompt: string, kb: string, label: string) => {
    if (label === 'Date') {
      setConversationId(null);
      setConversationUrl(null);
    }
    const currentReplicaId = label === 'Date' ? CANONICAL_PARTNER_FACE_ID : CANONICAL_MENTOR_FACE_ID;
    startSession(prompt, kb, label, currentReplicaId);
  };

  const handleApplyNextPartnerPrompt = (nextPrompt: string) => {
    setSystemPrompt(nextPrompt);
    setActiveTab('Date');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            className={`tab ${activeTab === 'Mentor' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Mentor')}
          >
            Mentor
          </div>
          <div 
            className={`tab ${activeTab === 'Notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Notes')}
          >
            Notes
          </div>
        </div>

        {activeTab === 'Date' && (
          <DateTab
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            knowledgeBase={knowledgeBase}
            setKnowledgeBase={setKnowledgeBase}
            conversationUrl={conversationUrl}
            error={error}
            isLoading={isLoading}
            onStartSession={handleStartSession}
          />
        )}

        {activeTab === 'Mentor' && (
          <MentorTab
            mentorPrompt={mentorPrompt}
            setMentorPrompt={setMentorPrompt}
            mentorKnowledgeBase={mentorKnowledgeBase}
            setMentorKnowledgeBase={setMentorKnowledgeBase}
            conversationUrl={conversationUrl}
            error={error}
            isLoading={isLoading}
            isSynthesizing={isSynthesizing}
            synthesis={synthesis}
            onStartSession={handleStartSession}
          />
        )}

        {activeTab === 'Notes' && (
          <NotesTab
            insights={insights}
            masterLog={masterLog}
            synthesis={synthesis}
            isSynthesizing={isSynthesizing}
            transcriptRef={transcriptRef}
            toolsRef={toolsRef}
            videoRef={videoRef}
            onApplyNextPartnerPrompt={handleApplyNextPartnerPrompt}
            conversationId={conversationId}
          />
        )}
      </div>

      <MediaStreamContainer conversationUrl={conversationUrl} />

      <div style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#00ffcc',
        padding: '4px 10px',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        borderRadius: '4px',
        zIndex: 9999,
        pointerEvents: 'none',
        border: '1px solid rgba(0,255,204,0.3)'
      }}>
        v1.0.2 (PAL Fix - Gabby)
      </div>
    </div>
  );
}
