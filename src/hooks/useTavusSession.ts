import { useState, useEffect, useRef } from 'react';
import { InterestController, ReceptivityTier, PhysicsConfig } from '@/lib/interestController';
import { TargetEmotion } from '@/lib/rubrics';

export function useTavusSession() {
  const [activeTab, setActiveTab] = useState<"Practice" | "Notes" | "Skills" | "Learn">("Practice");
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Governor State & Edge-Triggered Bridge (ADR 0006)
  const interestControllerRef = useRef<InterestController>(new InterestController(50.0));
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [receptivityScore, setReceptivityScore] = useState<number>(50.0);
  const [receptivityTier, setReceptivityTier] = useState<ReceptivityTier>('SCREENING');
  const [currentPhysics, setCurrentPhysics] = useState<PhysicsConfig>({
    interruptibility: 'low',
    patience: 'medium',
  });

  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Dispatch edge-triggered commands to Tavus iframe contentWindow (SLA <= 5ms)
  const dispatchIframeCommand = (physics: PhysicsConfig, emotion: TargetEmotion) => {
    if (!iframeRef.current?.contentWindow) return;

    // 1. Conversational Physics (Interruptibility & Patience)
    iframeRef.current.contentWindow.postMessage({
      type: 'conversation.sensitivity',
      properties: {
        interruptibility: physics.interruptibility,
        patience: physics.patience,
      },
    }, '*');

    // 2. Micro-Expression Override
    iframeRef.current.contentWindow.postMessage({
      type: 'conversation.emotion',
      properties: {
        emotion,
      },
    }, '*');
  };

  // Listen for Tavus iframe messages (Session end + Behavioral Signals)
  useEffect(() => {
    const handleTavusMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // 1. Session Termination Detection
      if (
        (data.event_type === 'conversation.tool_call' && data.name === 'end_conversation') ||
        (data.event_type === 'conversation.participant_left')
      ) {
        console.log(`Session end event detected: ${data.event_type}. Terminating session...`);
        terminateSession();
        return;
      }

      // 2. Real-Time Behavioral Signal Interception (Governor Loop <= 30ms SLA)
      if (
        (data.event_type === 'conversation.perception_tool_call' || data.event_type === 'conversation.tool_call') &&
        (data.name === 'log_behavioral_signal' || data.properties?.function_name === 'log_behavioral_signal')
      ) {
        const args = data.properties?.arguments || data.arguments || {};
        const step = interestControllerRef.current.applySignal({
          signalId: args.signal_id,
          category: args.category,
          signalType: args.signal_type,
          magnitude: args.magnitude,
          reason: args.reason,
          timestamp: Date.now(),
        });

        setReceptivityScore(step.score);
        setReceptivityTier(step.tier);
        setCurrentPhysics(step.physics);

        // Immediate edge dispatch back to Tavus iframe without server round trip
        dispatchIframeCommand(step.physics, step.emotion);
      }
    };

    window.addEventListener('message', handleTavusMessage);
    return () => window.removeEventListener('message', handleTavusMessage);
  }, [conversationId]);

  // Temporal Leaky Integration (Idle Relaxation: 1s interval tick)
  useEffect(() => {
    if (!conversationUrl) return;

    const interval = setInterval(() => {
      const decay = interestControllerRef.current.tickIdleDecay();
      if (decay.decayed) {
        setReceptivityScore(decay.newScore);
        if (decay.tierChanged) {
          setReceptivityTier(decay.tier);
          setCurrentPhysics(decay.physics);
          dispatchIframeCommand(decay.physics, decay.emotion);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conversationUrl]);

  // Browser unload beacon for session cleanup
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
        fetch("/api/tavus/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: conversationIdRef.current }),
        }).catch((e) => console.error("Failed cleanup on unmount:", e));
      }
    };
  }, []);

  const endSession = async (idToEnd: string) => {
    try {
      await fetch("/api/tavus/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: idToEnd }),
      });
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const terminateSession = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    await endSession(conversationId);
    setConversationUrl(null);
    setIsLoading(false);
    setActiveTab("Notes");
    setIsSynthesizing(true);
    // Reset Receptivity Governor to baseline
    interestControllerRef.current.reset(50.0);
    setReceptivityScore(50.0);
    setReceptivityTier('SCREENING');
    setCurrentPhysics({ interruptibility: 'low', patience: 'medium' });
  };

  const runSynthesis = async (id: string) => {
    setIsSynthesizing(true);
    try {
      await fetch("/api/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
    } catch (err) {
      console.error("Manual synthesis call failed:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const startSession = async (prompt: string, kb: string, label: string, replicaId: string) => {
    setIsLoading(true);
    setError(null);

    // Initialize Governor at baseline S0 = 50.0
    interestControllerRef.current.reset(50.0);
    setReceptivityScore(50.0);
    setReceptivityTier('SCREENING');
    setCurrentPhysics({ interruptibility: 'low', patience: 'medium' });

    try {
      const res = await fetch("/api/tavus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: prompt, knowledgeBase: kb, replicaId }),
      });      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Failed to start ${label.toLowerCase()}`);
      }
      
      setConversationUrl(data.url);
      setConversationId(data.conversationId);
    } catch (err: any) {
      setError(err.message || "Failed to start session");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    conversationUrl,
    conversationId,
    isLoading,
    isSynthesizing,
    setIsSynthesizing,
    error,
    setError,
    startSession,
    terminateSession,
    runSynthesis,
    setConversationId,
    setConversationUrl,
    // Receptivity Governor Exports (ADR 0006)
    iframeRef,
    receptivityScore,
    receptivityTier,
    currentPhysics,
    interestController: interestControllerRef.current,
  };
}
