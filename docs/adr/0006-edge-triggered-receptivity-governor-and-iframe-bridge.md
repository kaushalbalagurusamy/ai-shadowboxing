# ADR 0006: Edge-Triggered Receptivity Governor & Bidirectional Iframe Bridge

* **Status**: Proposed
* **Date**: 2026-09-11
* **Deciders**: Systems, Frontend & Conversational AI Team
* **Related Documents**: [`.docs/phase_3_prd.md`](../../.docs/phase_3_prd.md), [`ADR 0001`](0001-webrtc-multimodal-conversational-video-pipeline.md), [`ADR 0005`](0005-structured-decision-matrix-and-precision-rubric-grounding.md)

---

## Context & Problem Statement

In the current implementation, user behavioral signals detected by Tavus Raven-1 follow an asynchronous server-side round trip:
```
Tavus Raven-1 -> Tavus Cloud Server -> Webhook POST (/api/webhooks/tavus) -> Supabase DB -> Supabase Realtime WS -> Browser UI
```
This loop incurs a latency of **1,200ms–2,500ms**, rendering real-time conversational intervention impossible. The avatar's physical conversational traits (interruptibility and patience) remain completely static throughout the entire sparring session, set at initialization time (`pal_interruptibility: "low"`). 

If a user exhibits nervous stuttering or slouching, the partner cannot dynamically cut them off or display immediate facial disdain. By the time the webhook arrives at the database, the conversational moment has passed.

---

## Decision Drivers

1. **Sub-50ms Perception-to-Physics SLA**: Total loop latency from Raven-1 signal detection to partner behavioral shift must remain below human reaction time ($\sim 200\text{--}250\text{ms}$).
2. **Zero Server Round-Trip (Edge Execution)**: All accumulative scoring, state-machine transitions, and sensitivity commands must execute locally within the browser client runtime.
3. **Anti-Flicker Hysteresis Stability**: Prevent rapid oscillation ("flickering") between emotional states caused by transient tics or false-positive vision frames.
4. **Resilient Leaky Integration**: Ensure scores smoothly relax toward baseline if neither positive nor negative cues occur over extended silence.
5. **Zero-Overhead Memory Footprint**: Minimal heap impact to avoid React re-render lag or garbage collection spikes during WebRTC video playback.

---

## Decision Outcome

Implement a client-side **InterestController (The Governor)** operating over a **Bidirectional PostMessage WebRTC Iframe Bridge**. The browser acts as the local "Executioner" while Raven-1 serves as the "Perception Engine."

```
+---------------------------------------------------------------------------------------+
| BROWSER CLIENT (Next.js 16)                                                          |
|                                                                                       |
|   +--------------------------+  window.postMessage   +----------------------------+   |
|   |  Tavus WebRTC Iframe     | --------------------> | InterestController         |   |
|   |  - Raven-1 Vision Stream |                       | - Accumulator (Score: 0-100) |
|   |  - Phoenix-4 Face        | <-------------------- | - Hysteresis Deadband      |   |
|   |  - Sparrow-1 Flow        |  sensitivity &        | - $O(1)$ Rubric Delta Math |   |
|   +--------------------------+  emotion commands     +----------------------------+   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

---

### 1. Algorithmic Design: Receptivity Accumulator & State Machine

#### A. Continuous Accumulator Update Equation
The receptivity score $S_t \in [0, 100]$ initializes at baseline $S_0 = 50.0$. Upon arrival of signal $k$ at time $t$:

$$S_t = \text{clamp}\left(S_{t-1} + \Delta_k \cdot w_c, \, 0, \, 100\right)$$

Where:
* $\Delta_k \in [-50, +50]$ is the point delta resolved from `src/lib/rubrics.ts`.
* $w_c$ is an optional category multiplier ($w_c = 1.0$ by default).

#### B. Anti-Flicker Hysteresis State Machine
To prevent micro-expression flickering, the Governor classifies $S_t$ into three discrete operational tiers separated by a hysteresis deadband $\delta = 5.0$:

```
Tier 1: LOCKED (Unimpressed / Dominant)
  - Threshold: S_t < 40 (Requires S_t >= 45 to transition to Screening)
  - Physics: interruptibility: "low" | "none", patience: "high"
  - Micro-Expression: "contempt" or "disgusted"

Tier 2: SCREENING (Neutral Baseline)
  - Threshold: 40 <= S_t < 70
  - Physics: interruptibility: "low", patience: "medium"
  - Micro-Expression: "neutral"

Tier 3: OPEN (Intrigued / Receptive)
  - Threshold: S_t >= 70 (Requires S_t < 65 to fall back to Screening)
  - Physics: interruptibility: "high", patience: "low"
  - Micro-Expression: "content" or "surprised" or "excited"
```

#### C. Temporal Leaky Integration (Idle Relaxation)
If no behavioral signals arrive for an idle window $T_{\text{idle}} \ge 15.0\text{s}$, the score decays back toward baseline $S_{\text{base}} = 50.0$ at constant drift rate $r = 1.0\text{ point/sec}$:

$$S_{t + \Delta t} = S_t + \text{sign}(S_{\text{base}} - S_t) \cdot \min\left(r \cdot \Delta t, \, |S_{\text{base}} - S_t|\right)$$

---

### 2. Run & Space-Time Performance Targets

| Metric | Target SLA | Algorithmic Invariant |
| :--- | :--- | :--- |
| **Accumulator Step Time** | $\le 1.0\text{ms}$ | $O(1)$ constant time arithmetic & map lookup. |
| **Iframe PostMessage Dispatch** | $\le 5.0\text{ms}$ | Native synchronous `contentWindow.postMessage`. |
| **Total Loop Latency (Raven $\to$ Physics)** | **$\le 30.0\text{ms}$** | Bypasses all server, network, and database hops. |
| **Space Complexity** | $O(1)$ memory | Fixed circular buffer (size $N = 50$) storing event audit log. |
| **Heap Memory Overhead** | $< 100\text{ KB}$ | Zero object churn; pre-allocated state holders. |

---

### 3. Bidirectional Iframe Message Contracts

#### Inbound Event (Iframe $\to$ Parent Window)
Raven tool executions post messages to the parent window:
```typescript
interface TavusPerceptionToolMessage {
  event_type: "conversation.perception_tool_call" | "conversation.tool_call";
  name?: string;
  properties?: {
    function_name: "log_behavioral_signal";
    arguments: {
      signal_id?: string;
      category: "Physique" | "EQ" | "IQ" | "Wealth";
      signal_type: "positive" | "negative";
      magnitude?: number;
      reason: string;
    };
    timestamp?: string;
  };
}
```

#### Outbound Commands (Parent Window $\to$ Iframe)
The Governor broadcasts instantaneous physics and micro-expression directives:
```typescript
// 1. Edge-Triggered Conversational Physics
iframeRef.current.contentWindow.postMessage({
  type: "conversation.sensitivity",
  properties: {
    interruptibility: "low" | "medium" | "high",
    patience: "low" | "medium" | "high"
  }
}, "*");

// 2. Immediate Micro-Expression Override
iframeRef.current.contentWindow.postMessage({
  type: "conversation.emotion",
  properties: {
    emotion: "neutral" | "contempt" | "disgusted" | "content" | "surprised" | "excited"
  }
}, "*");
```

---

## Predefined Test Outcomes & Verification Matrix

| Test Suite | Test Identifier | Assertion & Verification Boundary | Target SLA |
| :--- | :--- | :--- | :--- |
| **Unit** | `InterestController.test.ts` | Clamping: Score never exceeds $100$ or drops below $0$. | Clamped $\in [0, 100]$ |
| **Unit** | `InterestController.test.ts` | Hysteresis: Score of 42 does NOT trigger transition from `Locked` to `Screening` (deadband threshold 45). | State remains `Locked` |
| **Unit** | `InterestController.test.ts` | Leaky Decay: Verify $S = 20$ decays to $S = 25$ after $5\text{s}$ past the $15\text{s}$ idle threshold. | $S = 25.0 \pm 0.5$ |
| **Hermetic Integration** | `useTavusSession.test.tsx` | Simulated `window.postMessage` from iframe triggers immediate sensitivity dispatch back to iframe window. | Outbound message count $= 2$ (sensitivity + emotion) |
| **Benchmark** | `InterestController.test.ts` | Stress test: 50,000 consecutive signal updates. | Total time $< 25\text{ms}$ ($< 0.5\mu\text{s}$/op) |

---

## Consequences

### Positive Consequences
* **Instantaneous Feedback**: Partner physics change within $\approx 25\text{ms}$ of user body language or vocal cues.
* **Radical Realism**: If a user fidgets or stutters under pressure, the partner cuts in and talks over them with visual disdain.
* **Zero Cloud Quota Overhead**: Zero database queries or edge function invocations required during active sparring.

### Negative Consequences / Trade-offs
* **Iframe Protocol Dependency**: Relies on Tavus embed player honoring parent `postMessage` protocol.
* **Client Synchronization**: Post-session logs must reconcile the client-side accumulator log with server-side webhook records.
