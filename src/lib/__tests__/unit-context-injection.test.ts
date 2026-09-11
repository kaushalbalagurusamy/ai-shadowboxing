/**
 * Unit Test Suite for Periodic Context Synchronization & State-Aware Persona Prompting (ADR 0007)
 * Verifies:
 * - Token count (<= 45 tokens) and byte size (< 250 bytes) per injection template
 * - Periodic 30s heartbeat cadence
 * - Tier shift immediate dispatch and 5s debounce barrier
 * - Persona prompt <internal_receptivity_governor> directive presence
 */

import assert from 'assert';
import { 
  InterestController, 
  TIER_CONTEXT_TEMPLATES 
} from '../interestController';
import { SCENARIO_PRESETS } from '../scenarioPresets';

export function runContextInjectionTestSuite() {
  console.log("--- STARTING CONTEXT SYNCHRONIZATION (ADR 0007) TEST SUITE ---");

  // 1. Token Length & Byte Budget Invariants (ADR 0007 SLA: <= 45 tokens, < 250 bytes)
  const tiers = ['LOCKED', 'SCREENING', 'OPEN'] as const;
  const sampleScores = [20, 55, 85];
  const sampleLeaks = ['PHY_FIDGET_TOUCH', 'EQ_NERVOUS_LAUGHTER', undefined];

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const score = sampleScores[i];
    const leak = sampleLeaks[i];
    const payload = TIER_CONTEXT_TEMPLATES[tier](score, leak);

    // Byte budget check (< 250 bytes)
    const byteLength = Buffer.byteLength(payload, 'utf-8');
    assert(byteLength < 250, `Payload for ${tier} exceeded 250 bytes: ${byteLength} bytes`);

    // Standard word-ratio token estimation (words * 1.33)
    const words = payload.split(/\s+/).filter(w => w.length > 0);
    const estimatedTokens = Math.ceil(words.length * 1.33);
    assert(estimatedTokens <= 45, `Payload for ${tier} exceeded 45 tokens: est. ${estimatedTokens} tokens (${words.length} words)`);
  }

  // 2. Periodic 30s Heartbeat Injection Cadence
  const t0 = 100_000;
  const governor = new InterestController(50.0, 50, t0);

  // At t0 + 10s: No injection expected (< 30s, no tier change)
  let check = governor.checkContextInjection(t0 + 10_000, false);
  assert(check.shouldInject === false, "Should not inject context at 10s without tier change");

  // At t0 + 25s: No injection expected (< 30s)
  check = governor.checkContextInjection(t0 + 25_000, false);
  assert(check.shouldInject === false, "Should not inject context at 25s");

  // At t0 + 30s: 30s heartbeat threshold reached -> MUST INJECT
  check = governor.checkContextInjection(t0 + 30_000, false);
  assert(check.shouldInject === true, "Heartbeat must inject at 30s");
  assert(check.contextPayload?.includes('[RECEPTIVITY STATE: SCREENING (50/100)'), `Unexpected payload: ${check.contextPayload}`);

  // At t0 + 35s: No injection (< 30s since last injection at t0 + 30s)
  check = governor.checkContextInjection(t0 + 35_000, false);
  assert(check.shouldInject === false, "Should not inject at 35s");

  // At t0 + 60s: Next 30s heartbeat -> MUST INJECT
  check = governor.checkContextInjection(t0 + 60_000, false);
  assert(check.shouldInject === true, "Next heartbeat must inject at 60s");

  // 3. Immediate Tier Shift & 5s Debounce Barrier
  const t1 = 200_000;
  governor.reset(50.0, t1);
  // Send first injection at t1
  governor.checkContextInjection(t1, false);

  // At t1 + 2s (2,000ms): User slouches violently, drops to 20 (LOCKED)
  governor.applySignal({ magnitude: -30, category: 'Physique', timestamp: t1 + 2_000 });
  assert(governor.getTier() === 'LOCKED', "Tier should be LOCKED");

  // Debounce check: only 2s elapsed since last injection at t1 -> MUST BE DEBOUNCED (< 5s barrier)
  check = governor.checkContextInjection(t1 + 2_000, true);
  assert(check.shouldInject === false, "Tier shift must be debounced if < 5s since previous injection");

  // At t1 + 6s (6,000ms): 6s elapsed (> 5s debounce barrier) with tier change -> MUST INJECT
  check = governor.checkContextInjection(t1 + 6_000, true);
  assert(check.shouldInject === true, "Tier shift must inject once debounce barrier (5s) is cleared");
  assert(check.contextPayload?.includes('LOCKED'), "Payload must reflect LOCKED state");

  // 4. Persona Prompt Directives Verification (<internal_receptivity_governor>)
  const p0 = SCENARIO_PRESETS.find(p => p.id === 'coffee_shop_baseline');
  assert(p0 !== undefined, "Coffee shop baseline preset must exist");
  assert(p0.systemPrompt.includes('<internal_receptivity_governor>'), "P0 prompt must include <internal_receptivity_governor>");
  assert(p0.systemPrompt.includes('CRITICAL DIRECTIVE: You do NOT calculate this score yourself'), "P0 must include directive not to calculate score");

  console.log("--- ALL CONTEXT SYNCHRONIZATION (ADR 0007) TESTS PASSED CLEANLY ---");
}
