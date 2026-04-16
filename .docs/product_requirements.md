# Product Requirements: AI Shadowboxing (MVP)

## 1. Project Overview
"AI Shadowboxing" is a gamified, ultra-realistic "first date" simulator designed for men to practice conversation and interpersonal skills.

## 2. Core Gamification Loop: P0 -> M1 -> P1
The MVP centers on an iterative loop of performance, distillation, and customization:

### Phase 1: The Demo Sparring Session (P0)
- **Goal:** Establish a baseline and "spike the user's nervous system" to trigger growth.
- **Mechanics:** 
  - Sub-500ms conversation with a photorealistic Tavus replica.
  - **Tavus Raven-1 (Perception):** Continually monitors the user's non-verbal and verbal signals, answering specific queries related to **EQ, IQ, Wealth, and Physique**.
  - **Tavus Sparrow (Conversation):** Provides a natural, contextually fluid interaction grounded in a RAG-powered Knowledge Base.
  - **Cloud Recording:** Server-side capture of the session to AWS S3.

### Phase 2: Post-Session Customization (M1 & P1)
- **Context Distillation (The Zipper):** **Gemini 3.1 Flash Lite** ingests raw streams from Tavus to create a **Canonical Trace** (a timestamped Markdown transcript interleaved with Raven's real-time observations). This report eliminates data noise and aligns non-verbal cues with dialogue.
- **Customized Mentor (M1):** Gemini uses the Canonical Trace to provide targeted feedback, synchronized with the cloud recording "highlights."
- **Next Sparring Partner (P1):** Gemini generates a new persona prompt (P1) designed to target the user's specific weaknesses discovered in P0 (e.g., if the user over-compensated on wealth, P1 becomes even more standoffish).

## 3. Core Testing Goals
1. **Raven Insight Extraction:** Does Raven capture signals that map accurately to the 4 categories of High Value?
2. **Canonical Trace Fidelity:** Can the "Zipper" accurately align the transcript and perception tool calls into a cohesive log?
3. **Agentic Prompting:** Can Gemini reliably generate high-quality subsequent persona prompts from the Master Performance Log?
