# Product Requirements: AI Shadowboxing (MVP)

## 1. Project Overview
"AI Shadowboxing" is a gamified, ultra-realistic "first date" simulator designed for men to practice conversation and interpersonal skills.

## 2. Core Gamification Loop: P0 -> M1 -> P1
The MVP centers on an iterative loop of performance and customization:

### Phase 1: The Demo Sparring Session (P0)
- **Goal:** Establish a baseline and "spike the user's nervous system" to trigger growth.
- **Mechanics:** 
  - Sub-500ms conversation with a photorealistic Tavus replica.
  - **Tavus Raven-1 (Perception):** Extracts real-time and post-session non-verbal and verbal insights (e.g., eye contact, tone, hesitation) using timestamped "perception tool" calls.
  - **Tavus Sparrow (Conversation):** Provides a natural, contextually fluid interaction grounded in a RAG-powered Knowledge Base.
  - **Tavus Phoenix (Rendering):** High-fidelity digital replica rendering (e.g. Phoenix-3/4).
  - **Cloud Recording:** Server-side capture of the session to AWS S3 for zero-latency user experience.

### Phase 2: Post-Session Customization (M1 & P1)
- **Synthesis:** **Gemini 3.1 Flash Lite** ingests Raven's timestamped observations and the session transcript.
- **Customized Mentor (M1):** Gemini generates a persona for a "Mentor" who provides targeted feedback using "highlights" (timestamps + image frames) captured by Raven.
- **Next Sparring Partner (P1):** Gemini generates a new persona prompt (P1) designed to target the user's specific weaknesses discovered in P0.

## 3. Core Testing Goals
1. **Raven Insight Extraction:** Does Raven capture the *correct* signals from the interaction and provide usable timestamps?
2. **Cloud Recording Reliability:** Does the server-side recording successfully capture the interaction without impacting real-time performance?
3. **Nervous System Spike:** Does the AI's persona effectively challenge the user to trigger growth?
4. **Agentic Prompting:** Can Gemini 3.1 Flash Lite reliably generate high-quality subsequent persona prompts from Raven's raw signals?
