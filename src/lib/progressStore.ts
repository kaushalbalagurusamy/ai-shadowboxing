import { insightStore, SessionInsight } from './insightStore';

export interface PillarScores {
  EQ: number;
  IQ: number;
  Wealth: number;
  Physique: number;
}

export interface SessionProgressEntry {
  conversationId: string;
  timestamp: string;
  scores: PillarScores;
  primaryWeakness: string;
}

export interface ProgressSummary {
  history: SessionProgressEntry[];
  averageScores: PillarScores;
  totalSessions: number;
  mostCommonWeakness: string | null;
}

class ProgressStore {
  async getProgressHistory(conversationId?: string): Promise<SessionProgressEntry[]> {
    if (!conversationId) return [];

    const insights = await insightStore.getInsights(conversationId);
    const synthInsight = insights.find((i: SessionInsight) => i.type === 'metadata' && i.key === 'session_synthesis');
    
    if (!synthInsight || !synthInsight.value) return [];

    const synthValue = synthInsight.value as {
      audit?: {
        scores?: PillarScores;
        primary_weakness?: string;
      };
    };

    if (!synthValue.audit?.scores) return [];

    return [{
      conversationId,
      timestamp: new Date().toISOString(),
      scores: synthValue.audit.scores,
      primaryWeakness: synthValue.audit.primary_weakness || 'Unknown',
    }];
  }

  calculateSummary(entries: SessionProgressEntry[]): ProgressSummary {
    if (entries.length === 0) {
      return {
        history: [],
        averageScores: { EQ: 0, IQ: 0, Wealth: 0, Physique: 0 },
        totalSessions: 0,
        mostCommonWeakness: null,
      };
    }

    const total = entries.length;
    const totals = entries.reduce(
      (acc, curr) => ({
        EQ: acc.EQ + (curr.scores.EQ || 0),
        IQ: acc.IQ + (curr.scores.IQ || 0),
        Wealth: acc.Wealth + (curr.scores.Wealth || 0),
        Physique: acc.Physique + (curr.scores.Physique || 0),
      }),
      { EQ: 0, IQ: 0, Wealth: 0, Physique: 0 }
    );

    const averageScores: PillarScores = {
      EQ: Math.round((totals.EQ / total) * 10) / 10,
      IQ: Math.round((totals.IQ / total) * 10) / 10,
      Wealth: Math.round((totals.Wealth / total) * 10) / 10,
      Physique: Math.round((totals.Physique / total) * 10) / 10,
    };

    const weaknessCounts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.primaryWeakness) {
        weaknessCounts[e.primaryWeakness] = (weaknessCounts[e.primaryWeakness] || 0) + 1;
      }
    });

    let mostCommonWeakness: string | null = null;
    let maxCount = 0;
    Object.entries(weaknessCounts).forEach(([w, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonWeakness = w;
      }
    });

    return {
      history: entries,
      averageScores,
      totalSessions: total,
      mostCommonWeakness,
    };
  }
}

export const progressStore = new ProgressStore();
