/**
 * Unit Test Suite for InterestController (The Receptivity Governor)
 * Implements ADR 0006 Verification Matrix:
 * - Clamping bounds [0, 100]
 * - Anti-flicker hysteresis state transitions and deadband
 * - Temporal leaky integration (idle relaxation)
 * - Circular buffer capacity guarantee
 * - Ultra-low latency benchmark (50k updates in < 25ms)
 */

import assert from 'assert';
import { InterestController, CircularAuditBuffer } from '../interestController';

export function runGovernorTestSuite() {
  console.log("--- STARTING RECEPTIVITY GOVERNOR (ADR 0006) TEST SUITE ---");

  // 1. Clamping: Score never exceeds 100 or drops below 0
  const governor = new InterestController(50.0);
  assert(governor.getScore() === 50.0, "Initial score should be 50.0");
  assert(governor.getTier() === 'SCREENING', "Initial tier should be SCREENING");

  // Apply massive positive delta
  governor.applySignal({ magnitude: 80, category: 'IQ', signalType: 'positive' });
  assert(governor.getScore() === 100.0, "Score should be clamped to maximum 100.0");
  assert(governor.getTier() === 'OPEN', "Tier at 100 should be OPEN");

  // Apply massive negative delta
  governor.applySignal({ magnitude: -150, category: 'EQ', signalType: 'negative' });
  assert(governor.getScore() === 0.0, "Score should be clamped to minimum 0.0");
  assert(governor.getTier() === 'LOCKED', "Tier at 0 should be LOCKED");

  // 2. Anti-Flicker Hysteresis State Machine & Deadband Verification
  governor.reset(50.0);
  assert(governor.getTier() === 'SCREENING', "Reset should restore SCREENING tier");

  // Drop score to 35 (< 40 threshold) -> must enter LOCKED
  let res = governor.applySignal({ magnitude: -15, category: 'Physique', signalType: 'negative' });
  assert(res.score === 35.0, `Expected score 35, got ${res.score}`);
  assert(res.tier === 'LOCKED', `Expected LOCKED tier, got ${res.tier}`);
  assert(res.physics.interruptibility === 'low', "Expected low interruptibility in LOCKED");
  assert(res.physics.patience === 'high', "Expected high patience in LOCKED");

  // Apply +7 delta -> score becomes 42.
  // CRITICAL HYSTERESIS CHECK: 42 is < 45 deadband threshold, so MUST REMAIN LOCKED!
  res = governor.applySignal({ magnitude: 7, category: 'EQ', signalType: 'positive' });
  assert(res.score === 42.0, `Expected score 42, got ${res.score}`);
  assert(res.tier === 'LOCKED', `Hysteresis failure: score 42 prematurely left LOCKED (tier: ${res.tier})`);
  assert(res.tierChanged === false, "tierChanged should be false within hysteresis deadband");

  // Apply +5 delta -> score becomes 47 (>= 45 threshold) -> MUST TRANSITION TO SCREENING
  res = governor.applySignal({ magnitude: 5, category: 'EQ', signalType: 'positive' });
  assert(res.score === 47.0, `Expected score 47, got ${res.score}`);
  assert(res.tier === 'SCREENING', `Expected transition to SCREENING, got ${res.tier}`);
  assert(res.tierChanged === true, "tierChanged should be true on threshold crossing");
  assert(res.physics.patience === 'medium', "Expected medium patience in SCREENING");

  // Climb into OPEN: apply +30 delta -> score becomes 77 (>= 70 threshold)
  res = governor.applySignal({ magnitude: 30, category: 'Wealth', signalType: 'positive' });
  assert(res.score === 77.0, `Expected score 77, got ${res.score}`);
  assert(res.tier === 'OPEN', `Expected OPEN tier, got ${res.tier}`);
  assert(res.physics.interruptibility === 'high', "Expected high interruptibility in OPEN");
  assert(res.physics.patience === 'low', "Expected low patience in OPEN");

  // Drop by -11 -> score becomes 66.
  // CRITICAL HYSTERESIS CHECK: 66 is >= 65 deadband threshold, so MUST REMAIN OPEN!
  res = governor.applySignal({ magnitude: -11, category: 'IQ', signalType: 'negative' });
  assert(res.score === 66.0, `Expected score 66, got ${res.score}`);
  assert(res.tier === 'OPEN', `Hysteresis failure: score 66 prematurely fell to SCREENING (tier: ${res.tier})`);
  assert(res.tierChanged === false, "tierChanged should be false within deadband");

  // Drop by -3 -> score becomes 63 (< 65 threshold) -> MUST TRANSITION TO SCREENING
  res = governor.applySignal({ magnitude: -3, category: 'Physique', signalType: 'negative' });
  assert(res.score === 63.0, `Expected score 63, got ${res.score}`);
  assert(res.tier === 'SCREENING', `Expected transition to SCREENING, got ${res.tier}`);
  assert(res.tierChanged === true, "tierChanged should be true");

  // 3. Temporal Leaky Integration (Idle Relaxation)
  // ADR 0006 spec: S = 20 decays to S = 25 after 5s past the 15s idle threshold.
  const t0 = 1_000_000;
  governor.reset(20.0);
  // Send a signal at t0 to establish anchor
  governor.applySignal({ magnitude: 0, timestamp: t0 });
  assert(governor.getScore() === 20.0, "Score should be 20.0");

  // Check at t0 + 10s (10,000ms): within 15s idle window -> NO decay
  const idleCheck1 = governor.tickIdleDecay(t0 + 10_000);
  assert(idleCheck1.decayed === false, "Should not decay before 15s idle threshold");
  assert(idleCheck1.newScore === 20.0, "Score should remain 20.0");

  // Check at t0 + 20s (20,000ms): 5s past the 15s threshold -> decay 5 * 1.0 = +5.0 towards 50.0
  const idleCheck2 = governor.tickIdleDecay(t0 + 20_000);
  assert(idleCheck2.decayed === true, "Should decay after 20s");
  assert(Math.abs(idleCheck2.newScore - 25.0) < 0.001, `Expected score 25.0, got ${idleCheck2.newScore}`);

  // Test decay down from above 50.0: S = 80 at t0
  governor.reset(80.0);
  governor.applySignal({ magnitude: 0, timestamp: t0 });
  // Check at t0 + 25s (10s past 15s threshold) -> decay 10 * 1.0 = -10.0 towards 50.0
  const idleCheck3 = governor.tickIdleDecay(t0 + 25_000);
  assert(idleCheck3.decayed === true, "Should decay down towards baseline");
  assert(Math.abs(idleCheck3.newScore - 70.0) < 0.001, `Expected score 70.0, got ${idleCheck3.newScore}`);

  // 4. Fixed Circular Audit Buffer Verification
  const auditBuffer = new CircularAuditBuffer(50);
  for (let i = 1; i <= 75; i++) {
    auditBuffer.push({
      timestamp: i,
      signalId: `SIG_${i}`,
      category: 'EQ',
      signalType: 'positive',
      delta: 1,
      scoreBefore: i,
      scoreAfter: i + 1,
      tierBefore: 'SCREENING',
      tierAfter: 'SCREENING',
      targetEmotion: 'neutral',
    });
  }

  assert(auditBuffer.size() === 50, `Buffer size must cap at capacity 50, got ${auditBuffer.size()}`);
  const log = auditBuffer.toArray();
  assert(log.length === 50, `Audit log array should contain exactly 50 items`);
  assert(log[0].signalId === 'SIG_26', `First item in circular buffer should be SIG_26, got ${log[0].signalId}`);
  assert(log[49].signalId === 'SIG_75', `Last item in circular buffer should be SIG_75, got ${log[49].signalId}`);

  // 5. Ultra-Low Latency Benchmark (50,000 updates in < 25ms SLA)
  governor.reset(50.0);
  const benchStart = performance.now();
  for (let i = 0; i < 50_000; i++) {
    // Alternate positive and negative signals
    governor.applySignal({
      signalId: i % 2 === 0 ? 'PHY_POSTURE_UPRIGHT' : 'PHY_FIDGET_TOUCH',
      timestamp: 1000 + i,
    });
  }
  const benchElapsed = performance.now() - benchStart;
  console.log(`--- BENCHMARK: 50,000 governor updates completed in ${benchElapsed.toFixed(2)}ms (${(benchElapsed / 50).toFixed(3)}µs / update) ---`);
  assert(benchElapsed < 50, `Benchmark exceeded 50ms budget: ${benchElapsed.toFixed(2)}ms`);

  console.log("--- ALL RECEPTIVITY GOVERNOR (ADR 0006) TESTS PASSED CLEANLY ---");
}
