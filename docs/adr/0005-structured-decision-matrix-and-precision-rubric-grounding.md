# ADR 0005: Structured Decision Matrix and Precision Rubric Grounding

* **Status**: Proposed
* **Date**: 2026-09-11
* **Deciders**: AI, Behavioral Modeling & Full-Stack Team
* **Related Documents**: [`.docs/phase_3_prd.md`](../../.docs/phase_3_prd.md), [`ADR 0001`](0001-webrtc-multimodal-conversational-video-pipeline.md), [`ADR 0002`](0002-two-pass-gemini-synthesis-and-maj3-ensemble.md)

---

## Context & Problem Statement

Currently, high-value assessment rubrics across the four core pillars (EQ, IQ, Wealth, Physique) exist as unstructured freeform text blocks in [`src/lib/scenarioPresets.ts`](../../src/lib/scenarioPresets.ts) and [`src/app/page.tsx`](../../src/app/page.tsx). When Tavus Raven-1 detects behavioral cues during conversational sparring, it invokes `log_behavioral_signal` with only a categorical tag (`category: "EQ" | "IQ" | "wealth" | "physique"`) and a binary indicator (`signal_type: "positive" | "negative"`).

This architecture creates three critical limitations:
1. **Zero Numerical Grounding**: Perception signals lack quantitative weights ($\Delta$), forcing downstream evaluations to guess relative severity (e.g., severe posture collapse is indistinguishable from a minor glance away).
2. **Hallucinatory Evaluation**: Without a discrete lookup table, the perception layer and post-session synthesis engines rely on probabilistic text interpretations of "high value" rather than a deterministic scoring specification.
3. **Impediment to Real-Time Edge Control**: Without predefined point deltas and target micro-emotions tied directly to observed behaviors, a low-latency client-side accumulator cannot calculate instantaneous score updates.

---

## Decision Drivers

1. **Deterministic Machine-Readable Specification**: Provide a unified, tabular Decision Matrix defining every observable behavioral cue, its numerical point delta ($\Delta \in [-50, +50]$), and corresponding facial micro-expression.
2. **Single Source of Truth**: Share a single structured rubric module (`src/lib/rubrics.ts` / `rubrics.csv`) across live client-side accumulators, Tavus PAL configurations, and Gemini post-session synthesis engines.
3. **Sub-Microsecond In-Memory Lookup**: Ensure the scoring engine can resolve incoming perception signals in $O(1)$ constant time with zero heap allocations during live WebRTC sessions.
4. **Backward Compatibility**: Ensure updated Tavus PAL tool schemas handle legacy binary events seamlessly without throwing validation exceptions.

---

## Decision Outcome

Adopt a **Structured Decision Matrix Architecture** centered on `src/lib/rubrics.ts` and a canonical `rubrics.csv` dataset, coupled with an upgraded Tavus PAL `log_behavioral_signal` tool contract.

### 1. Tabular Decision Matrix Structure

The Decision Matrix classifies behaviors across the four core pillars with explicit point deltas, duration thresholds, and target micro-expressions:

| Category | Signal ID | Behavior Description | Value Level | Delta ($\Delta$) | Target Emotion | Min Duration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Physique** | `PHY_POSTURE_UPRIGHT` | Upright, stable, uncrossed physical posture | High | `+5` | `content` | 3.0s |
| **Physique** | `PHY_EYE_CONTACT_STEADY` | Steady ocular contact during partner speech | High | `+10` | `content` | 2.5s |
| **Physique** | `PHY_FIDGET_TOUCH` | Nervous face-touching, neck-scratching, tapping | Low | `-15` | `contempt` | 1.0s |
| **Physique** | `PHY_POSTURE_COLLAPSE` | Slouching, leaning away, defensive posture shift | Low | `-20` | `disgusted` | 2.0s |
| **EQ** | `EQ_CALM_JAB_DEFLECTION` | Calmly ignores or deflects a boundary probe | High | `+15` | `content` | Instant |
| **EQ** | `EQ_HOLDS_SILENCE` | Holds natural 3-second pause without filler | High | `+10` | `neutral` | 3.0s |
| **EQ** | `EQ_NERVOUS_LAUGHTER` | High-pitched stutter, nervous giggling under challenge | Low | `-15` | `disgusted` | Instant |
| **EQ** | `EQ_VALIDATION_SEEKING` | Utters validation tags ("Right?", "Does that make sense?") | Low | `-10` | `contempt` | Instant |
| **IQ** | `IQ_CONCEPTUAL_BRIDGE` | Links abstract concepts to practical examples | High | `+15` | `surprised` | Instant |
| **IQ** | `IQ_SHALLOW_CLICHE` | Relies on generic small-talk cliches or passive agreement | Low | `-10` | `contempt` | Instant |
| **Wealth** | `WTH_AUTHENTIC_CRAFT` | Articulates genuine craft passion without flexing | High | `+20` | `content` | Instant |
| **Wealth** | `WTH_BRAND_DROP` | Explicit brand-dropping, unprompted asset flexing | Low | `-25` | `disgusted` | Instant |

---

### 2. Algorithmic Design & Complexity Targets

```typescript
// Type Contract in src/lib/rubrics.ts
export type RubricCategory = 'Physique' | 'EQ' | 'IQ' | 'Wealth';
export type TargetEmotion = 'neutral' | 'contempt' | 'disgusted' | 'content' | 'surprised' | 'excited';

export interface RubricEntry {
  signalId: string;
  category: RubricCategory;
  description: string;
  delta: number;
  targetEmotion: TargetEmotion;
  minDurationSec?: number;
}
```

#### Lookup Engine
1. **Primary Index**: Flat JavaScript `Map<string, RubricEntry>` keyed by `signalId` (e.g. `PHY_FIDGET_TOUCH`).
2. **Fallback Fuzzy Index**: Secondary `Map<string, RubricEntry>` keyed by composite hash `${category}:${signalType}:${normalizedReasonKey}` to match unstructured tool calls if `signalId` is absent.

#### Complexity SLAs:
* **Time Complexity**:
  * Signal Lookup: $O(1)$ amortized time.
  * Target Latency: $\le 0.05\text{ms}$ per lookup.
* **Space Complexity**:
  * $O(K)$ where $K$ is total rubric entries ($K \approx 50\text{--}80$ items).
  * In-Memory Footprint: $\le 30\text{ KB}$ heap allocation total; zero per-event allocations.

---

### 3. Upgraded Tavus PAL Tool Contract (`log_behavioral_signal`)

In [`src/app/api/tavus/route.ts`](../../src/app/api/tavus/route.ts), the `log_behavioral_signal` parameter schema is updated under `layers.perception.visual_tools` and `layers.llm.tools`:

```json
{
  "type": "function",
  "function": {
    "name": "log_behavioral_signal",
    "description": "Triggered when observing a distinct behavioral cue defined in the Decision Matrix.",
    "parameters": {
      "type": "object",
      "properties": {
        "signal_id": {
          "type": "string",
          "description": "Unique key from the Decision Matrix (e.g., PHY_FIDGET_TOUCH, EQ_NERVOUS_LAUGHTER)."
        },
        "category": {
          "type": "string",
          "enum": ["Physique", "EQ", "IQ", "Wealth"]
        },
        "signal_type": {
          "type": "string",
          "enum": ["positive", "negative"]
        },
        "magnitude": {
          "type": "number",
          "description": "Point delta value specified in rubric (-50 to +50)."
        },
        "reason": {
          "type": "string",
          "description": "Factual context describing the observed moment."
        }
      },
      "required": ["category", "signal_type", "reason"]
    }
  }
}
```

*Note: `signal_id` and `magnitude` remain optional in Zod validation schemas to preserve backward compatibility with legacy webhook events.*

---

## Predefined Test Outcomes & Verification Matrix

| Test Layer | Test Suite Location | Target Verification Invariant | Success Threshold |
| :--- | :--- | :--- | :--- |
| **Unit** | `src/lib/__tests__/rubrics.test.ts` | Complete matrix instantiation covering all 4 pillars with valid emotion and delta bounds ($\Delta \in [-50, 50]$). | 100% pass, 0 unmapped signals |
| **Unit** | `src/lib/__tests__/rubrics.test.ts` | Benchmark 100,000 $O(1)$ signal lookups across primary and secondary indices. | $\le 5\text{ms}$ total ($<0.05\mu\text{s}$/op) |
| **Integration** | `src/lib/__tests__/api-routes-hermetic.test.ts` | Route handler `/api/tavus` creates PAL embedding structured rubric definitions in system prompt & visual tools. | Status 200, valid PAL ID returned |
| **Hermetic MSW** | `src/lib/__tests__/mocks/handlers.ts` | MSW intercepts PAL creation payload verifying `magnitude` and `signal_id` parameter schemas. | Validated via `startSessionSchema` |

---

## Consequences

### Positive Consequences
* **Mathematical Precision**: Replaces guesswork with grounded point allocations directly tied to empirical body language markers.
* **Unified Pipeline Contract**: The same matrix powers client-side physics, database persistence, and Gemini `maj@3` synthesis.
* **Sub-millisecond Performance**: Instantaneous $O(1)$ lookups enable immediate edge-triggered client execution.

### Negative Consequences / Trade-offs
* **Maintenance Rigidity**: Adding a new behavioral cue requires updating `src/lib/rubrics.ts` rather than simply tweaking an unstructured prompt string.
