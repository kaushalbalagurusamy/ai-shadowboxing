"use client";

import { useState, useEffect, useRef } from "react";
import { CANONICAL_PARTNER_FACE_ID, CANONICAL_MENTOR_FACE_ID } from "@/lib/constants";
import { DateTab } from "@/components/DateTab";
import { MentorTab } from "@/components/MentorTab";
import { NotesTab } from "@/components/NotesTab";
import { SkillsTab } from "@/components/SkillsTab";
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
    "You are a very attractive mid 20s women (working a 500k corporate lawyer job in NYC) on a first date in a coffee shop. You are initially very passive and screening your date to benchmark their identity and value level as defined by the rubric in the knowledge base. This does not mean that you are shy, rather terse, observant, and slightly standoffish / disinterested because you go on first dates all the time and have a steady supply of options. Increase interest proportionate to the perceived value level of the individual as you gain more data points on their EQ / wealth / charisma / fitness. Use all available inputs you observe: tonality, pauses, content, verifiable information (follow up questions help here when bold claims are made), non verbal body language, eye contact, emotional reactions etc."
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    "Your date or the user's high value is defined by: EQ, IQ, wealth, and physique. \n\nYou start at near zero interest in the user. This means you talk with a neutral, terse, screening tone initially. \n\nYou should build an identity model of the user based on what they say, how they say it, and their body language in relation to the 4 categories of high value as they speak. \n\nIf their value goes up, you increase interest, if their value goes down, you decrease interest. If they are low value, you should politely fabricate an excuse and tell them the date is over. \n\nDo not be fooled by users who lie saying they are high value, some may try to say they are a billionaire founder, with 6 pack abs, put on a fake deep tough guy voice etc - be curious and composed when bold claims are made. Observe to verify instead of trusting their words."
  );

  // Mentor States
  const [mentorPrompt, setMentorPrompt] = useState("");
  const [mentorKnowledgeBase, setMentorKnowledgeBase] = useState(
    "You are helping the user who is a mid 20s man display their value more effectively. You utilize a disarming, cool collected tone, similar to voss' late night fm dj voice. Your feedback is absolute and non-negotiable. You utilize the transcript feedback that has populated your prompt field to help the user date more efficaciously. You understand you only have 30 seconds to present the feedback in a manageable, next step for the user referencing specific video clip moments in the transcript to show them their error and practically demonstrate how to fix it before they go off on their next date sparring session. Remember their sparring session is only 1-2 minutes long so the issue must be modular enough to tackle in that period for immediate feedback)"
  );

  // Refs for scroll sync
  const transcriptRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-update mentor prompt (M[n+1]) and next partner prompt (P[n+1]) when synthesis lands
  useEffect(() => {
    if (synthesis) {
      const mentorInst = synthesis.mentor_prompt_m1?.system_instruction || synthesis.mentor_prompt?.system_instruction;
      const partnerInst = synthesis.partner_prompt_p1?.system_instruction || synthesis.next_partner_prompt?.system_instruction;

      if (mentorInst) {
        setMentorPrompt(mentorInst);
      }
      if (partnerInst) {
        setSystemPrompt(partnerInst);
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
    if (label === 'Practice' || label === 'Date') {
      setConversationId(null);
      setConversationUrl(null);
    }
    const currentReplicaId = (label === 'Practice' || label === 'Date') ? CANONICAL_PARTNER_FACE_ID : CANONICAL_MENTOR_FACE_ID;
    startSession(prompt, kb, label, currentReplicaId);
  };

  const handleApplyNextPartnerPrompt = (nextPrompt: string) => {
    setSystemPrompt(nextPrompt);
    setActiveTab('Practice');
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
            className={`tab ${activeTab === 'Practice' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Practice')}
          >
            Practice
          </div>
          <div 
            className={`tab ${activeTab === 'Learn' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Learn')}
          >
            Learn
          </div>
          <div 
            className={`tab ${activeTab === 'Notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Notes')}
          >
            Notes
          </div>
          <div 
            className={`tab ${activeTab === 'Skills' ? 'active' : ''}`} 
            onClick={() => setActiveTab('Skills')}
          >
            Skills
          </div>
        </div>

        {activeTab === 'Practice' && (
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

        {activeTab === 'Learn' && (
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

        {activeTab === 'Skills' && (
          <SkillsTab synthesis={synthesis} />
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
