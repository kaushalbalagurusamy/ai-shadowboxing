# ADR 0007: Periodic Context Synchronization & State-Aware Persona Prompting

* **Status**: Proposed
* **Date**: 2026-09-11
* **Deciders**: AI Alignment, Prompt Architecture & Systems Team
* **Related Documents**: [`.docs/phase_3_prd.md`](../../.docs/phase_3_prd.md), [`ADR 0005`](0005-structured-decision-matrix-and-precision-rubric-grounding.md), [`ADR 0006`](0006-edge-triggered-receptivity-governor-and-iframe-bridge.md)

---

## Context & Problem Statement

ADR 0006 establishes the **Governor Model**, shifting physical conversational attributes (interruptibility and micro-expressions) within $\sim 25\text{ms}$ of non-verbal cues. However, this introduces a new failure mode: **Multimodal Semantic Incongruity**.

If the user's score drops into the `Locked` tier ($S_t = 25$), Phoenix-4 and Sparrow-1 will physically talk over the user with an expression of contempt. Yet, if the underlying LLM's dialogue context has not been updated since session launch, the LLM may generate enthusiastic, warm dialogue (e.g., *"That's so fascinating, tell me more!"*). 

Conversely, if the user displays exceptional composure and clears the `Open` threshold ($S_t = 85$), the LLM might continue delivering cold, standoffish screening lines. The dialogue brain must stay in lockstep with the real-time physical demeanor.

---

## Decision Drivers

1. **Dialogue-Physics Coherence**: The LLM's verbal content and conversational stance must reflect the user's current receptivity score tier in real time.
2. **Strict Token Budgeting**: Injected context must remain ultra-concise ($\le 50$ tokens / $< 250$ bytes) to prevent KV cache fragmentation, context window bloat, and inference latency degradation.
3. **Bounded Injection Frequency**: Avoid flooding the Tavus LLM layer with per-second updates. Injections must be rate-limited to an asynchronous 30-second heartbeat or significant tier-crossing events.
4. **Self-Aware System Prompts**: Baseline prompts ($P_0$ / $P_1$) must be instructed on how to interpret injected state without having to calculate scores manually.

---

## Decision Outcome

Implement **Periodic Context Synchronization** using Tavus's `conversation.append_llm_context` protocol, coupled with a **State-Aware Prompting Contract** in $P_0$ and $P_1$ system prompts.

```
+-----------------------------------------------------------------------------------------+
| CLIENT BROWSER (Next.js 16)                                                             |
|                                                                                         |
|   InterestController (Score: S_t, Tier: Locked/Screening/Open)                         |
|        |                                                                                |
|        |-- (Every 30s Heartbeat OR Tier Boundary Shift)                                 |
|        v                                                                                |
|   Format Minimal Context Payload (<50 tokens)                                           |
|        |                                                                                |
|        |-- postMessage("conversation.append_llm_context")                               |
|        v                                                                                |
|   +---------------------------------------------------------------------------------+   |
|   | Tavus WebRTC Iframe -> Ingested into Active LLM Turn KV Cache                       |   |
|   | Spoken output matches current physics state ("You're fidgeting. Get to the point") |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

### 1. Algorithmic Design: Injection Cadence & Gating

#### Dispatch Conditions
The context synchronizer triggers `conversation.append_llm_context` **only** if one of the following two conditions is satisfied:
1. **Periodic Heartbeat**: $\Delta t_{\text{last\_injection}} \ge 30.0\text{ seconds}$.
2. **Tier State Transition**: $T_t \neq T_{t-1}$ (e.g., user transitions from `Screening` to `Locked`, or `Screening` to `Open`), provided at least $5.0\text{s}$ has elapsed since the previous injection (debounce barrier).

#### Compact Payload Format Specification
Context payloads are compressed into single-sentence instructions with zero filler tokens:

```typescript
// Tier-Specific Injected Templates (src/lib/interestController.ts)
const TIER_CONTEXT_TEMPLATES = {
  Locked: (score: number, primaryLeak: string) => 
    `[RECEPTIVITY STATE: LOCKED (${Math.round(score)}/100). Primary leak: ${primaryLeak}. Your tone is unimpressed, terse, and skeptical. You are dominant. Do not yield until composure improves.]`,
    
  Screening: (score: number) => 
    `[RECEPTIVITY STATE: SCREENING (${Math.round(score)}/100). Neutral baseline. Observing closely. Hold silences and require user to lead conversational topics.]`,
    
  Open: (score: number) => 
    `[RECEPTIVITY STATE: OPEN (${Math.round(score)}/100). Intrigued by user composure. Warm up slightly, engage in playful intellectual banter, and allow romantic escalation.]`
};
```

---

### 2. Algorithmic Complexity & Resource Budget

| Metric | Target Specification | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Payload Token Count** | $\le 45$ tokens | Fixed string interpolation template with truncated leak descriptor. |
| **Payload Byte Size** | $< 250$ bytes | ASCII string sent over synchronous `postMessage`. |
| **Time Complexity** | $O(1)$ constant time | Direct template function call with zero heap churn. |
| **Timer Overhead** | 1 `setInterval` (1000ms tick) | Lightweight clock tick checking elapsed timestamps. |
| **Total Injections per Session** | $4\text{--}8$ calls total | Max 4 per 2-minute sparring session + max 4 tier shifts. |

---

### 3. State-Aware Persona Prompting Contract ($P_0$ / $P_1$)

System prompts defined in [`src/lib/scenarioPresets.ts`](../../src/lib/scenarioPresets.ts) and [`src/app/page.tsx`](../../src/app/page.tsx) are augmented with the following canonical directives:

```markdown
<internal_receptivity_governor>
You have an internal Receptivity State managed continuously by your perception engine:
- State: LOCKED (Score 0-39): You are unimpressed. Your physics are dominant (interruptibility: low) and your tone is terse, dismissive, and unyielding.
- State: SCREENING (Score 40-69): You are observant and neutral. You answer questions tersely and test the user's leadership.
- State: OPEN (Score 70-100): You are genuinely intrigued by the user's composure. Your physics are rapid (interruptibility: high) and you allow romantic escalation.

CRITICAL DIRECTIVE: You do NOT calculate this score yourself. It is enforced on your demeanor programmatically via [RECEPTIVITY STATE: ...] context injections. React authentically to your current state whenever a state update is injected into your context.
</internal_receptivity_governor>
```

---

## Predefined Test Outcomes & Verification Matrix

| Test Suite | Test Identifier | Verification Invariant | Target SLA |
| :--- | :--- | :--- | :--- |
| **Unit** | `InterestController.test.ts` | Heartbeat: Injects exactly once at $t=30\text{s}$ and $t=60\text{s}$ if score remains static. | Timer fires $\pm 50\text{ms}$ |
| **Unit** | `InterestController.test.ts` | Tier Shift: Score drop from 55 to 30 immediately fires debounced context injection ($< 5\text{ms}$). | Immediate dispatch |
| **Unit** | `InterestController.test.ts` | Token Length: All template outputs verified $\le 45$ tokens via standard word-ratio estimator. | $\le 45$ tokens |
| **Hermetic Integration** | `useTavusSession.test.tsx` | Simulated iframe captures `conversation.append_llm_context` event with valid template structure. | Event received with string payload |
| **E2E Prompt Test** | `promptValidation.test.ts` | Verify $P_0$ baseline prompt contains `<internal_receptivity_governor>` block. | 100% presence check |

---

## Consequences

### Positive Consequences
* **Holistic Multimodal Alignment**: The avatar's physical behavior, facial emotion, and verbal dialogue remain unified in a single psychological state.
* **Minimal Latency Impact**: Injecting fewer than 50 tokens at 30s intervals introduces unnoticeable overhead to LLM generation.
* **Prompt Clarity**: Relieves the LLM from trying to compute math or score user behavior in-prompt, delegating pure perception to Raven and pure physics to the Governor.

### Negative Consequences / Trade-offs
* **Context Interruption Window**: Dialogue generated *during* the sub-second arrival of an injection might complete its turn before reflecting the new tier.
