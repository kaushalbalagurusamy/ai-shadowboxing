import { useState, useEffect } from 'react';
import { insightStore, SessionInsight } from '@/lib/insightStore';
import { UserProgressState } from '@/lib/skillTree';

export interface RubricEvaluationItem {
  criterion: string;
  timestamp_reference: string;
  multimodal_evidence: string;
  pass: boolean;
}

export interface SessionSynthesis {
  value_leak_identified?: string;
  rubric_evaluations?: RubricEvaluationItem[];
  final_score?: number;
  median_score?: number;
  ensemble_scores?: number[];
  passed?: boolean;
  user_progress_state?: UserProgressState;
  audit: {
    scores: Record<string, number>;
    primary_weakness: string;
    rationale: string;
  };
  mentor_prompt_m1?: {
    system_instruction: string;
    highlights: Array<{
      type: string;
      reason: string;
      timestamp?: string;
      turn_id?: string;
    }>;
  };
  partner_prompt_p1?: {
    system_instruction: string;
    focus_area?: string;
  };
  mentor_prompt?: {
    system_instruction: string;
    highlights: Array<{
      type: string;
      reason: string;
      timestamp?: string;
      turn_id?: string;
    }>;
  };
  next_partner_prompt?: {
    system_instruction: string;
    focus_area?: string;
  };
}

export function useSessionInsights(conversationId: string | null) {
  const [insights, setInsights] = useState<SessionInsight[]>([]);
  const [masterLog, setMasterLog] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<SessionSynthesis | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setInsights([]);
      setMasterLog(null);
      setSynthesis(null);
      return;
    }

    let isMounted = true;

    // 1. Initial fetch of existing insights for conversation
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/tavus/insights?conversationId=${conversationId}`);
        const data = await res.json();
        if (isMounted && data.insights) {
          setInsights(data.insights);
          
          const log = data.insights.find((i: SessionInsight) => i.type === 'metadata' && i.key === 'master_performance_log');
          if (log) setMasterLog(log.value as string);

          const synth = data.insights.find((i: SessionInsight) => i.type === 'metadata' && i.key === 'session_synthesis');
          if (synth) setSynthesis(synth.value as SessionSynthesis);
        }
      } catch (err) {
        console.error("Failed to fetch initial insights:", err);
      }
    };

    fetchInitial();

    // 2. Realtime WebSocket subscription (Primary Event Push)
    const unsubscribe = insightStore.subscribeToInsights(conversationId, (newInsight) => {
      if (!isMounted) return;

      setInsights((prev) => {
        const exists = prev.some(
          (i) => i.type === newInsight.type && i.timestamp === newInsight.timestamp && i.text === newInsight.text
        );
        return exists ? prev : [...prev, newInsight];
      });

      if (newInsight.type === 'metadata' && newInsight.key === 'master_performance_log') {
        setMasterLog(newInsight.value as string);
      }
      if (newInsight.type === 'metadata' && newInsight.key === 'session_synthesis') {
        setSynthesis(newInsight.value as SessionSynthesis);
      }
    });

    // 3. Resilient Polling Fallback (5-second interval)
    const fallbackInterval = setInterval(fetchInitial, 5000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [conversationId]);

  return {
    insights,
    masterLog,
    synthesis,
    setInsights,
    setMasterLog,
    setSynthesis,
  };
}
