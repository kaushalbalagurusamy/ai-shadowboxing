import { describe, it, expect } from 'vitest';
import { SCENARIO_PRESETS } from '../scenarioPresets';
import { progressStore } from '../progressStore';
import { logger } from '../telemetry';

describe('Scenario Presets Unit Tests', () => {
  it('should contain valid scenario presets with non-empty prompts', () => {
    expect(SCENARIO_PRESETS.length).toBeGreaterThan(0);
    for (const preset of SCENARIO_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.systemPrompt.length).toBeGreaterThan(10);
      expect(preset.knowledgeBase.length).toBeGreaterThan(10);
    }
  });

  it('should include Standard, Challenging, and Standoffish difficulty tiers', () => {
    const ids = SCENARIO_PRESETS.map((p) => p.id);
    expect(ids).toContain('coffee_shop_baseline');
    expect(ids).toContain('intellectual_lawyer');
    expect(ids).toContain('standoffish_apex');
  });
});

describe('Progress Store Unit Tests', () => {
  it('should correctly aggregate session averages and identify most common weakness', () => {
    const mockSessions = [
      {
        conversationId: 's1',
        timestamp: '2026-07-30T10:00:00Z',
        scores: { EQ: 8, IQ: 6, Wealth: 9, Physique: 7 },
        primaryWeakness: 'Nervous stutter',
      },
      {
        conversationId: 's2',
        timestamp: '2026-07-30T11:00:00Z',
        scores: { EQ: 6, IQ: 8, Wealth: 7, Physique: 9 },
        primaryWeakness: 'Nervous stutter',
      },
    ];

    const summary = progressStore.calculateSummary(mockSessions);
    expect(summary.totalSessions).toBe(2);
    expect(summary.averageScores.EQ).toBe(7);
    expect(summary.averageScores.IQ).toBe(7);
    expect(summary.averageScores.Wealth).toBe(8);
    expect(summary.averageScores.Physique).toBe(8);
    expect(summary.mostCommonWeakness).toBe('Nervous stutter');
  });

  it('should handle empty session histories gracefully', () => {
    const summary = progressStore.calculateSummary([]);
    expect(summary.totalSessions).toBe(0);
    expect(summary.averageScores.EQ).toBe(0);
    expect(summary.mostCommonWeakness).toBeNull();
  });
});

describe('Telemetry Logger Unit Tests', () => {
  it('should output structured log context without throwing errors', () => {
    const childLogger = logger.child({ conversationId: 'c_test_123', event: 'test_run' });
    expect(() => childLogger.info('Sanity check message')).not.toThrow();
    expect(() => childLogger.warn('Warning log message')).not.toThrow();
    expect(() => childLogger.error('Error log message', new Error('Mock error'))).not.toThrow();
  });
});
