---
title: Product Requirements Document & Feature Proposal - Phase 3 (Dynamic Interest Loop & Low-Latency Receptivity Mapping)
type: prd_proposal
status: proposed
last_updated: 2026-09-06
---

# Feature Proposal: Dynamic Interest Loop (DIL) & Low-Latency Receptivity Mapping (Governor Model)

> **Note:** This document captures the proposal for the Dynamic Interest Loop (DIL), moving from a simple plus/minus scoring system to treating the Knowledge Base as the "Judge" and the Frontend as the "Executioner". It is under evaluation for whether or to what extent it is implemented.

---

This is a critical pivot. To make the Dynamic Interest Loop (DIL) work at 2026 SOTA levels, we need to move away from a simple "plus/minus" scoring system and instead treat the Knowledge Base as the "Judge" and the Frontend as the "Executioner."

Here is the plan to contextualize the scoring and optimize for ultra-low latency.

## 1. Structured Knowledge Base: The "Scoring Rubric"
Instead of a text dump, we will structure the Knowledge Base as a Decision Matrix (CSV or JSON). This allows Raven-1 to perform "Precision Grounding."

Proposed Rubric Structure (e.g., `rubrics.csv`):

| Category | Value Level | Signal/Behavior | Delta | Target Emotion |
| :--- | :--- | :--- | :--- | :--- |
| EQ | High | Calmly ignoring a jab | +15 | contentment |
| EQ | Low | Stuttering or nervous laughter | -10 | disgust |
| Wealth | High | Verifiable mention of equity/assets | +20 | curiosity |
| Physique | Low | Slouching/Fidgeting | -5 | neutral |

## 2. Low-Latency Implementation: "Edge-Triggered Physics"
To keep the variable live with zero lag, we avoid a "Round Trip" to the server. We use the Interactions Protocol as a local circuit.

* **Step A: The Perception Loop (Raven-1):**
  Raven-1 is already analyzing the stream. We will configure the `log_behavioral_signal` tool calls to include a magnitude or weight parameter that maps directly to the rows in our Decision Matrix.
* **Step B: The Client-Side Accumulator:**
  The browser's WebRTC data channel receives the `tool_call` from Raven. The frontend logic (the "Accumulator") immediately updates the `receptivityScore`.
  * *Latency:* ~1-5ms (local processing).
* **Step C: The Direct Broadcast:**
  The moment the score crosses a threshold, the frontend sends the `conversation.sensitivity` message back down the same WebRTC data channel.
  * *Latency:* ~10-20ms (WebRTC data channel round-trip to the Tavus engine).

**Result:** The partner's "personality" (interruptibility, etc.) shifts within ~25ms of the user performing a behavior. This is faster than human reaction time, making the AI feel incredibly intuitive.

## 3. Deep Integration with Tavus Configuration
Aside from a text dump, we can leverage two advanced Tavus features for this:

1. `conversation.append_llm_context`:
   We can use this to inject the "Current State" of the user's value into the LLM's brain every 30 seconds. This ensures the dialogue stays in sync with the physics (e.g., "I'm starting to find your composure interesting...").
2. `visual_tool_calls` with Thresholds:
   We can define tools in Raven that only fire when a combination of factors is met (e.g., "Fired only if posture=slouched AND eye_contact=low for >5 seconds"). This prevents "flickering" behavior from one-off nervous tics.

## 4. Revised Strategy for the PRD (Phase 3)
* **The Artifact:** Create a `lib/rubrics.ts` that acts as the source of truth for the Decision Matrix.
* **The Processor:** Implement an `InterestController` class in the frontend that:
  1. Listens to Raven tool calls.
  2. References `lib/rubrics.ts`.
  3. Maintains the `receptivityScore`.

---

### Architecture: Low-Latency Receptivity Mapping

To make this robust and ultra-low latency, we need to move away from "guessing" the score on the frontend. We will leverage Raven-1 as the Real-Time Governor.

#### 1. Structured Knowledge Base: The Rubric Matrix
Instead of a text dump, we should move the High-Value rubrics into a CSV-formatted Knowledge Base. This allows Raven-1 to perform "Key-Value Lookups" for behaviors.

| Category | Signal_Description | Value_Weight | Behavior_Logic |
| :--- | :--- | :--- | :--- |
| EQ | Nervous laughter/stuttering | -15 | User is failing the pressure test. |
| EQ | Calm, fluid speech | +10 | User maintains composure under standoffishness. |
| Physique | Fidgeting / Face-touching | -20 | User displays anxiety or low presence. |
| Physique | Upright, still posture | +5 | User displays dominance and comfort. |

#### 2. Zero-Latency Variable Management: The "Governor" Model
To keep the variable live without round-tripping to a server or rerunning an LLM:

* **Raven as the Source of Truth:** We define Visual Tools in the Persona that are pre-mapped to the scoring weights.
* **The Client-Side Accumulator:**
  * Raven emits a `log_behavioral_signal` with a category and `signal_type`.
  * The frontend (React) catches this event via the WebRTC data channel.
  * The frontend instantly updates a local `physicsGovernor` state.
  * *Latency:* ~10-20ms (Browser internal processing).
* **Immediate Feedback (Sensitivity Updates):**
  * The `useEffect` watching the `physicsGovernor` immediately broadcasts the `conversation.sensitivity` and `conversation.emotion` updates back into the iframe.
  * *Total Loop Latency:* ~50ms.

#### 3. Contextual Alignment (Linking Prompts to Score)
The system prompt needs to be aware of the tiers we are enforcing programmatically. We update the P0/P1 prompts to acknowledge their own "internal state":

> "You have an internal Receptivity State managed by your perception engine. 
> - State: Locked: You are unimpressed. Your physics are slow (patience: high) and you are dominant (interruptibility: low).
> - State: Open: You are intrigued. Your physics are rapid (patience: low) and you are receptive (interruptibility: high).
>
> You do not need to calculate this score; it is enforced on your behavior by the platform. You simply react to the user's value signals as they arrive."

#### 4. Structured Configuration in Tavus
Instead of just a text blob, we can use the `/v2/documents` API to upload our Rubric Matrix CSV. 
* **Why?** This ensures that when Raven-1 performs a "Perception Analysis Query," it isn't just hallucinating what "High Value" means—it is performing a precise lookup against our mathematical table.
* **Dynamic Weighting:** We can update this CSV between sessions (Phase 3) if the Coach decides that the user's specific "Value Leak" needs a higher penalty (e.g., making "Fidgeting" -50 instead of -20).

#### The Final Logic Flow:
1. User Fidgets (Physique Negative).
2. Raven-1 sees it, triggers `log_behavioral_signal({category: 'physique', type: 'negative'})`.
3. Frontend catches event, score drops from 50 to 30.
4. Frontend sends `conversation.sensitivity({interruptibility: 'low', patience: 'high'})` + `conversation.emotion('disgust')`.
5. The Partner instantly talks over the user while looking visibly annoyed.
