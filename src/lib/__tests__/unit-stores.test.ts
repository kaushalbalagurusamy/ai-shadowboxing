import { describe, it, expect } from 'vitest';
import { SCENARIO_PRESETS } from '../scenarioPresets';
import { progressStore } from '../progressStore';
import { logger } from '../telemetry';

describe('Scenario Presets Unit Tests', () => {
  it('should contain valid P0 baseline scenario preset with non-empty prompts', () => {
    expect(SCENARIO_PRESETS.length).toBe(1);
    const preset = SCENARIO_PRESETS[0];
    expect(preset.id).toBe('coffee_shop_baseline');
    expect(preset.name).toBeTruthy();
    expect(preset.systemPrompt.length).toBeGreaterThan(10);
    expect(preset.knowledgeBase.length).toBeGreaterThan(10);
  });
});

describe('Progress Store Unit Tests', () => {
  it('should correctly aggregate session averages and identify most common weakness', () => {
    const mockSessions = [
      {
        conversationId: 's1',
        timestamp: '2026-07-30T10:00:00Z',
        scores: { EQ: 6, IQ: 8, Wealth: 7, Physique: 9 },
        primaryWeakness: 'Validation seeking',
      },
      {
        conversationId: 's2',
        timestamp: '2026-07-30T11:00:00Z',
        scores: { EQ: 8, IQ: 8, Wealth: 9, Physique: 9 },
        primaryWeakness: 'Validation seeking',
      },
      {
        conversationId: 's3',
        timestamp: '2026-07-30T12:00:00Z',
        scores: { EQ: 4, IQ: 6, Wealth: 5, Physique: 7 },
        primaryWeakness: 'Vocal jitter',
      },
    ];

    const aggregates = progressStore.calculateSummary(mockSessions);
    expect(aggregates.totalSessions).toBe(3);
    expect(aggregates.averageScores.EQ).toBe(6);
    expect(aggregates.averageScores.IQ).toBe(7.3);
    expect(aggregates.mostCommonWeakness).toBe('Validation seeking');
  });

  it('should handle empty session histories gracefully', () => {
    const aggregates = progressStore.calculateSummary([]);
    expect(aggregates.totalSessions).toBe(0);
    expect(aggregates.averageScores.EQ).toBe(0);
    expect(aggregates.mostCommonWeakness).toBeNull();
  });
});

describe('Telemetry Logger Unit Tests', () => {
  it('should output structured log context without throwing errors', () => {
    expect(() => {
      logger.info('Sanity check message', { conversationId: 'c_test_123', event: 'test_run' });
      logger.warn('Warning log message', { conversationId: 'c_test_123', event: 'test_run' });
      logger.error('Error log message', { conversationId: 'c_test_123', event: 'test_run', errorName: 'Error', errorMessage: 'Mock error', stack: new Error('Mock error').stack });
    }).not.toThrow();
  });
});
