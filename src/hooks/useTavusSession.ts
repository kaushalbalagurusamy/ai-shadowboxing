import { useState, useEffect, useRef } from 'react';

export function useTavusSession() {
  const [activeTab, setActiveTab] = useState<"Practice" | "Notes" | "Skills" | "Learn">("Practice");
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Listen for Tavus iframe end events
  useEffect(() => {
    const handleTavusMessage = (event: MessageEvent) => {
      if (
        (event.data?.event_type === 'conversation.tool_call' && event.data?.name === 'end_conversation') ||
        (event.data?.event_type === 'conversation.participant_left')
      ) {
        console.log(`Session end event detected: ${event.data?.event_type}. Terminating session...`);
        terminateSession();
      }
    };

    window.addEventListener('message', handleTavusMessage);
    return () => window.removeEventListener('message', handleTavusMessage);
  }, [conversationId]);

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
  };
}
