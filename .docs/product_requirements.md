# Product Requirements: AI Shadowboxing (MVP)

## 1. Project Overview
"AI Shadowboxing" is a gamified, ultra-realistic "first date" simulator designed for men to practice conversation and interpersonal skills.

## 2. Core Gamification Loop: P0 -> M1 -> P1
The MVP centers on an iterative loop of performance and customization:

### Phase 1: The Demo Sparring Session (P0)
- **Goal:** Establish a baseline and "spike the user's nervous system" to trigger growth.
- **Mechanics:** 
  - Sub-500ms conversation with a photorealistic Tavus replica.
  - **Tavus Raven (Perception):** Extracts real-time non-verbal and verbal insights (e.g., eye contact, tone, hesitation).
  - **Tavus Sparrow (Conversation):** Provides a natural, contextually fluid interaction using a pre-loaded Knowledge Base (Rubrics).
  - **Tavus Phoenix (Rendering):** High-fidelity digital replica.

### Phase 2: Post-Session Customization (M1 & P1)
- **Synthesis:** **Gemini 3.1 Flash Lite** ingests Raven's "Memories" and "Key Events" from the P0 session.
- **Customized Mentor (M1):** Gemini 3.1 Flash Lite generates a persona for a "Mentor" who provides targeted feedback based on P0's insights.
- **Next Sparring Partner (P1):** Gemini 3.1 Flash Lite "hedges" Raven's notes against the Knowledge Base to generate the next persona prompt (P1), designed to target the user's specific weaknesses.

## 3. Core Testing Goals
1. **Raven Insight Extraction:** Does Raven capture the *correct* signals from the interaction?
2. **Retrieval Fluidity:** Does Sparrow effectively leverage the Knowledge Base while maintaining a natural flow?
3. **Nervous System Spike:** Does the AI's persona effectively challenge the user to trigger growth?
4. **Agentic Prompting:** Can Gemini 3.1 Flash Lite reliably generate high-quality subsequent persona prompts from Raven's raw signals?
