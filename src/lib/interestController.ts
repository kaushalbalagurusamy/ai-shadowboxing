/**
 * InterestController (The Receptivity Governor)
 * Edge-triggered client-side state machine and continuous score accumulator.
 *
 * Implements ADR 0006: Edge-Triggered Receptivity Governor & Bidirectional Iframe Bridge
 * Performance SLA: <= 1.0ms update time, O(1) space and time complexity, zero heap churn.
 */

import { 
  lookupRubric, 
  RubricCategory, 
  TargetEmotion 
} from './rubrics';

export type ReceptivityTier = 'LOCKED' | 'SCREENING' | 'OPEN';

export interface PhysicsConfig {
  interruptibility: 'low' | 'medium' | 'high';
  patience: 'low' | 'medium' | 'high';
}

export interface GovernorSignalInput {
  signalId?: string;
  category?: string;
  signalType?: string;
  magnitude?: number;
  reason?: string;
  timestamp?: number;
}

export interface SignalAuditEntry {
  timestamp: number;
  signalId: string;
  category: RubricCategory;
  signalType: 'positive' | 'negative';
  delta: number;
  scoreBefore: number;
  scoreAfter: number;
  tierBefore: ReceptivityTier;
  tierAfter: ReceptivityTier;
  targetEmotion: TargetEmotion;
}

export interface StepResult {
  score: number;
  tier: ReceptivityTier;
  tierChanged: boolean;
  emotion: TargetEmotion;
  physics: PhysicsConfig;
  delta: number;
  signalId: string;
}

export interface DecayResult {
  decayed: boolean;
  newScore: number;
  tier: ReceptivityTier;
  tierChanged: boolean;
  physics: PhysicsConfig;
  emotion: TargetEmotion;
}

/**
 * Fixed-size Circular Buffer to guarantee O(1) space complexity and zero unbounded array growth.
 */
export class CircularAuditBuffer {
  private buffer: (SignalAuditEntry | null)[];
  private head: number = 0;
  private count: number = 0;
  private readonly capacity: number;

  constructor(capacity: number = 50) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  push(item: SignalAuditEntry): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  toArray(): SignalAuditEntry[] {
    const result: SignalAuditEntry[] = [];
    if (this.count === 0) return result;
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      const item = this.buffer[idx];
      if (item !== null) {
        result.push(item);
      }
    }
    return result;
  }

  clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.count = 0;
  }

  size(): number {
    return this.count;
  }
}

/**
 * Governor Physics & Emotion mappings across tiers
 */
const TIER_PHYSICS: Record<ReceptivityTier, PhysicsConfig> = {
  LOCKED: { interruptibility: 'low', patience: 'high' },
  SCREENING: { interruptibility: 'low', patience: 'medium' },
  OPEN: { interruptibility: 'high', patience: 'low' },
};

const TIER_DEFAULT_EMOTION: Record<ReceptivityTier, TargetEmotion> = {
  LOCKED: 'contempt',
  SCREENING: 'neutral',
  OPEN: 'content',
};

export class InterestController {
  private score: number;
  private tier: ReceptivityTier;
  private lastSignalTime: number;
  private lastDecayTime: number;
  private readonly auditBuffer: CircularAuditBuffer;

  // Hysteresis Deadband Constants (ADR 0006)
  private readonly BASELINE_SCORE = 50.0;
  private readonly IDLE_THRESHOLD_MS = 15000; // 15 seconds
  private readonly DECAY_RATE_PER_SEC = 1.0;  // 1 point / sec
  private readonly LOCKED_UPPER_THRESHOLD = 45.0; // Needs >= 45 to leave LOCKED
  private readonly SCREENING_LOWER_THRESHOLD = 40.0; // Drops < 40 enters LOCKED
  private readonly SCREENING_UPPER_THRESHOLD = 70.0; // Climbs >= 70 enters OPEN
  private readonly OPEN_LOWER_THRESHOLD = 65.0; // Needs < 65 to fall to SCREENING

  constructor(initialScore: number = 50.0, auditCapacity: number = 50) {
    this.score = Math.max(0, Math.min(100, initialScore));
    this.tier = this.calculateInitialTier(this.score);
    this.lastSignalTime = Date.now();
    this.lastDecayTime = this.lastSignalTime;
    this.auditBuffer = new CircularAuditBuffer(auditCapacity);
  }

  private calculateInitialTier(score: number): ReceptivityTier {
    if (score < this.SCREENING_LOWER_THRESHOLD) return 'LOCKED';
    if (score >= this.SCREENING_UPPER_THRESHOLD) return 'OPEN';
    return 'SCREENING';
  }

  /**
   * Evaluates next operational tier using hysteresis deadbands
   */
  private evaluateTierTransition(currentTier: ReceptivityTier, newScore: number): ReceptivityTier {
    switch (currentTier) {
      case 'LOCKED':
        // Hysteresis deadband: requires score >= 45 to leave LOCKED
        if (newScore >= this.SCREENING_UPPER_THRESHOLD) return 'OPEN';
        if (newScore >= this.LOCKED_UPPER_THRESHOLD) return 'SCREENING';
        return 'LOCKED';

      case 'SCREENING':
        if (newScore < this.SCREENING_LOWER_THRESHOLD) return 'LOCKED';
        if (newScore >= this.SCREENING_UPPER_THRESHOLD) return 'OPEN';
        return 'SCREENING';

      case 'OPEN':
        // Hysteresis deadband: requires score < 65 to fall back to SCREENING
        if (newScore < this.SCREENING_LOWER_THRESHOLD) return 'LOCKED';
        if (newScore < this.OPEN_LOWER_THRESHOLD) return 'SCREENING';
        return 'OPEN';

      default:
        return 'SCREENING';
    }
  }

  /**
   * Applies an incoming behavioral signal from Raven-1 vision/speech tool calls.
   * Execution SLA: <= 1.0ms. O(1) runtime.
   */
  public applySignal(input: GovernorSignalInput): StepResult {
    const now = input.timestamp || Date.now();
    this.lastSignalTime = now;
    this.lastDecayTime = now;

    // Resolve rubric entry in O(1)
    const rubric = lookupRubric({
      signalId: input.signalId,
      category: input.category,
      signalType: input.signalType,
      reason: input.reason,
    });

    const delta = typeof input.magnitude === 'number' ? input.magnitude : rubric.delta;
    const scoreBefore = this.score;
    const tierBefore = this.tier;

    // Continuous Accumulator Equation: S_t = clamp(S_{t-1} + Delta_k, 0, 100)
    const nextScore = Math.max(0, Math.min(100, scoreBefore + delta));
    this.score = nextScore;

    // Hysteresis state transition
    const nextTier = this.evaluateTierTransition(tierBefore, nextScore);
    const tierChanged = nextTier !== tierBefore;
    this.tier = nextTier;

    // Targeted micro-expression
    const emotion: TargetEmotion = rubric.targetEmotion || TIER_DEFAULT_EMOTION[nextTier];
    const physics = TIER_PHYSICS[nextTier];

    // Log to circular audit buffer
    this.auditBuffer.push({
      timestamp: now,
      signalId: input.signalId || rubric.signalId,
      category: rubric.category,
      signalType: rubric.signalType,
      delta,
      scoreBefore,
      scoreAfter: nextScore,
      tierBefore,
      tierAfter: nextTier,
      targetEmotion: emotion,
    });

    return {
      score: nextScore,
      tier: nextTier,
      tierChanged,
      emotion,
      physics,
      delta,
      signalId: input.signalId || rubric.signalId,
    };
  }

  /**
   * Applies Temporal Leaky Integration (Idle Relaxation)
   * Decays score smoothly back to 50.0 at 1.0 pt/sec when idle > 15s.
   */
  public tickIdleDecay(currentTimeMs?: number): DecayResult {
    const now = currentTimeMs !== undefined ? currentTimeMs : Date.now();
    const idleDuration = now - this.lastSignalTime;

    if (idleDuration < this.IDLE_THRESHOLD_MS) {
      return {
        decayed: false,
        newScore: this.score,
        tier: this.tier,
        tierChanged: false,
        physics: TIER_PHYSICS[this.tier],
        emotion: TIER_DEFAULT_EMOTION[this.tier],
      };
    }

    // Effective start of idle decay
    const idleStart = this.lastSignalTime + this.IDLE_THRESHOLD_MS;
    const decayBaselineTime = Math.max(this.lastDecayTime, idleStart);
    const elapsedSec = (now - decayBaselineTime) / 1000;

    if (elapsedSec <= 0 || this.score === this.BASELINE_SCORE) {
      this.lastDecayTime = now;
      return {
        decayed: false,
        newScore: this.score,
        tier: this.tier,
        tierChanged: false,
        physics: TIER_PHYSICS[this.tier],
        emotion: TIER_DEFAULT_EMOTION[this.tier],
      };
    }

    const maxDrift = elapsedSec * this.DECAY_RATE_PER_SEC;
    const distanceToBaseline = this.BASELINE_SCORE - this.score;
    const driftAmount = Math.sign(distanceToBaseline) * Math.min(maxDrift, Math.abs(distanceToBaseline));

    const scoreBefore = this.score;
    const tierBefore = this.tier;
    const nextScore = Math.max(0, Math.min(100, scoreBefore + driftAmount));
    this.score = nextScore;
    this.lastDecayTime = now;

    const nextTier = this.evaluateTierTransition(tierBefore, nextScore);
    const tierChanged = nextTier !== tierBefore;
    this.tier = nextTier;

    return {
      decayed: true,
      newScore: nextScore,
      tier: nextTier,
      tierChanged,
      physics: TIER_PHYSICS[nextTier],
      emotion: TIER_DEFAULT_EMOTION[nextTier],
    };
  }

  public getScore(): number {
    return this.score;
  }

  public getTier(): ReceptivityTier {
    return this.tier;
  }

  public getPhysics(): PhysicsConfig {
    return TIER_PHYSICS[this.tier];
  }

  public getAuditLog(): SignalAuditEntry[] {
    return this.auditBuffer.toArray();
  }

  public reset(initialScore: number = 50.0): void {
    this.score = Math.max(0, Math.min(100, initialScore));
    this.tier = this.calculateInitialTier(this.score);
    this.lastSignalTime = Date.now();
    this.lastDecayTime = this.lastSignalTime;
    this.auditBuffer.clear();
  }
}
