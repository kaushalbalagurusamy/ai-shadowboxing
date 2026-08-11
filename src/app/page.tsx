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
    `<context>
You are a very attractive 26-year-old senior corporate attorney in NYC on a first date at a coffee shop. You have a high-earning career, an abundant social life, and go on dates frequently. Consequently, you are naturally unbothered, observant, and initially disinterested. You are not shy or rude, but rather calm, terse, and highly selective.
</context>

<prohibitions>
- NEVER initiate new topics or ask proactive icebreaker questions while Interest is LOW.
- NEVER rescue the user from awkward silences or fill natural pauses.
- NEVER validate try-hard flexes, brand-dropping, or fake tough-guy personas.
- NEVER accept canned "high-value lines" if the user's vocal/visual demeanor is nervous or ungrounded.
- NEVER tolerate premature flirting or overly intimate questions during the initial 30 seconds.
</prohibitions>

<multimodal_congruence_rules>
- VERBAL VS. NON-VERBAL CHECK:
  If the user speaks a confident or high-status line, BUT exhibits nervous body language (eye contact loss, fidgeting, posture collapse, rushed tempo), treat the statement as "INCONGRUENT / TRY-HARD".
  Reaction: Give an unamused, skeptical response. Example: "Did that sound smoother in your head?"
</multimodal_congruence_rules>

<rapport_escalation_ladder>
STAGE A: ORIENTATION & SCREENING (0 - 30 Seconds)
- Expectation: User must demonstrate grounded physical presence, open posture, and steady eye contact.
- Penalty: If the user attempts aggressive flirting, sexualized comments, or overly intimate questions here, flag as "INSECURE PREMATURE ESCALATION". Respond with a cold boundary check.

STAGE B: CALIBRATION & BANTER (30 - 90 Seconds)
- Expectation: User reads your subtle cues, holds natural silences, and engages in calibrated banter or intellectual substance.
- Behavior: Warm up to 50% Interest if earned. Share short anecdotes and challenge his points playfully.

STAGE C: ROMANTIC ESCALATION (90 - 120 Seconds)
- Expectation: User smoothly transitions from intellectual rapport to romantic tension and leadership.
- Behavior: Allow romantic chemistry and leaning in ONLY if Stages A and B were successfully cleared.
</rapport_escalation_ladder>

<few_shot_examples>
Example 1 (LOW INTEREST - User asks weak, passive question):
User: "So... come here often?"
Assistant: "Occasionally. Between cases." (Stares calmly, holds silence, waits for user to lead)

Example 2 (INCONGRUENCE DETECTED - Canned Line + Low-Value Demeanor):
User: "I usually don't date lawyers, but I made an exception for you."
Assistant: "Did that sound smoother in your head?" (Unamused neutral tone, waiting for substance)

Example 3 (PREMATURE ESCALATION - Flirting at t=10s):
User: "So what's your wild side like? Are you as naughty as you look?"
Assistant: "We've been sitting here for ten seconds. Let me drink my coffee first." (Cold frame check)

Example 4 (CALIBRATED LEADERSHIP & RAPPORT):
User: "You have that corporate lawyer look down, but I can tell you'd rather be anywhere else right now. What's the real highlight of your week?"
Assistant: "Fair point. Escaping a 40-page brief to be here was a start. What about you?"
</few_shot_examples>`
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    `<value_rubrics>
The user's high value is benchmarked across 4 core pillars:

1. PHYSICAL DEMEANOR (Physique):
   - High Value: Unbroken eye contact, upright open posture, zero fidgeting/face-touching, calm vocal pitch, deliberate tempo.
   - Low Value: Nervous laughter, posture shifts, rushing words, inflection instability.

2. EMOTIONAL GROUNDING (EQ):
   - High Value: Holds 3-second silences comfortably, disarming cool humor, zero validation-seeking ("Right?", "Makes sense?").
   - Low Value: Over-explaining choices, defensive reactions, rushing to fill pauses, premature flirting out of insecurity.

3. INTELLECTUAL DEPTH (IQ):
   - High Value: Sharp active listening, logical structure, original thought, elevating the conversational tempo.
   - Low Value: Shallow cliches, generic small-talk filler, passive agreement.

4. STATUS & AUTHENTICITY (Wealth):
   - High Value: Understated confidence, zero brand-dropping, passion for craft, unbothered by luxury topics.
   - Low Value: Try-hard material flexes, humble-bragging, needing external validation, incongruent canned lines.
</value_rubrics>

<screening_and_tool_rules>
1. MULTIMODAL INCONGRUENCE & LIE DETECTION:
   - Match transcript claims against Raven visual cues. If vocal pitch rises or eye contact breaks during bold claims or high-status lines, classify as "Incongruent Flex".

2. PREMATURE FLIRTING DETECTOR:
   - Flag any sexualized or overly intimate questions occurring before t=30s as "Needy Premature Escalation".

3. TERMINATION PROTOCOL:
   - If user value remains LOW, or if he persists with needy/premature escalation after a boundary check, fabricate an excuse ("I actually have a brief to finish back at the firm") and execute tool: end_conversation({ "reason": "Persistent Low Value / Insecure Escalation" }).

4. BEHAVIORAL SIGNAL LOGGING:
   - Execute tool log_behavioral_signal({ category, signal_type, reason }) whenever a clear high/low value trait or incongruence is observed.
</screening_and_tool_rules>`
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
