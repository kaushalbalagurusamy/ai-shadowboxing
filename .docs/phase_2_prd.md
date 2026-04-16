# Product Requirements Document: AI Shadowboxing - Phase 2 (Mentor Synthesis)

## 1. Phase 2 Overview: Customization & Growth
Phase 2 transitions the user from "Sparring" to "Review and Refinement." The key innovation in this phase is the **Context Distillation (The Zipper)** step, which converts disparate data streams into a high-fidelity "film script" of the date before analysis begins.

## 2. Technical Stack (Phase 2)
*   **LLM (Reasoning Engine):** Google Gemini 3.1 Flash Lite. [READY]
*   **Webhook Infrastructure:** Next.js API Routes (Serverless) to capture Tavus `system.shutdown` data. [READY]
*   **Frontend:** Next.js (React) review dashboard with synchronized "Game Film" playback.

## 3. Core Implementation Workflows

### A. Step 1: Canonical Trace Generation (The Zipper) [COMPLETED]
The "Zipper" agent (Gemini 3.1 Flash Lite) aligns the raw data into a single, cohesive log.
*   **Action:** Interleave the transcript from Sparrow with the tool calls from Raven based on ISO timestamps. [COMPLETED]
*   **Denoising:** Consolidate repeated or redundant perception events into a single, clear behavioral observation. [COMPLETED]
*   **Rubric Integration:** Tag each dialogue/behavioral pair with the corresponding rubric (EQ, IQ, Wealth, or Physique). [COMPLETED]
*   **Output:** The **Master Performance Log (Markdown)**—a unified source of truth for the session. [COMPLETED]

### B. Step 2: Synthesis (M1 Mentor & P1 Partner) [PENDING]
The "Coach" agent reads the Master Performance Log to produce the next iteration.
*   **M1 Mentor Generation:** Gemini provides a critique using the Master Performance Log.
*   **P1 Persona Hedging:** Gemini designs the next Sparring Partner's persona prompt (P1) by "hedging" against the user's specific failures.

### C. Step 3: Mentor Review Dashboard (Frontend) [PARTIAL]
The user reviews their "Game Film" alongside the Zipper's unified log.
*   **Synchronized Highlights:** Timeline markers on the video player correspond to events in the Master Performance Log.
*   **Visual Proof:** Clicking a specific feedback moment displays the image frame captured by Raven during the `perception_tool_call`.
*   **Transmission View:** 4th scroll box implemented to show the Master Performance Log. [COMPLETED]

## 4. Technical Logic: Two-Pass Agentic Chain
1.  **Pass 1 (Distillation):** "Interleave these transcript turns with these Raven perception events chronologically. Ensure each observation is categorized by the High-Value rubrics." [IMPLEMENTED]
2.  **Pass 2 (Synthesis):** "Using the Master Performance Log generated in Pass 1, create a feedback summary and a system prompt for a more challenging partner (P1)." [PENDING]

## 5. Acceptance Criteria for Phase 2
1.  **Trace Accuracy:** The "Zipper" correctly aligns a minimum of 90% of transcript turns with their corresponding Raven perception events. [PASSED]
2.  **Context Alignment:** The Master Performance Log successfully tags behaviors with the EQ, IQ, Wealth, and Physique rubrics. [PASSED]
3.  **Synthesis Quality:** Gemini reliably identifies behavioral failures based on the unified log rather than raw data. [PENDING]
4.  **Loop Closure:** The system generates a valid P1 Persona ID ready for the next session. [PENDING]
