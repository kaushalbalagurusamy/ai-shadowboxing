# Product Requirements Document: AI Shadowboxing - Phase 2 (Mentor Synthesis)

## 1. Phase 2 Overview: Customization & Growth
Phase 2 transitions the user from "Sparring" to "Review and Refinement." The goal is to ingest the raw behavioral signals from Phase 1, synthesize them using Gemini 3.1 Flash Lite, and generate a customized Mentor experience (M1) and a tailored Sparring Partner (P1) for the next iteration.

## 2. Technical Stack (Phase 2)
*   **LLM (Reasoning Engine):** Google Gemini 3.1 Flash Lite.
*   **Video Hosting:** AWS S3 (Target for Tavus Cloud Recordings).
*   **Webhook Infrastructure:** Next.js API Routes (Serverless) to handle Tavus post-session events.
*   **Frontend:** Next.js (React) review dashboard.

## 3. Core Implementation Workflows

### A. Webhook Ingestion & Data Preparation
Once a Phase 1 session ends, the backend must catch the final Tavus results.
*   **Tavus Webhook (`system.shutdown`):** Contains the final `recording_url` and `perception_analysis`.
*   **Data Aggregation:** The backend combines:
    1.  Full conversation transcript (Sparrow logs).
    2.  Raven's answered `perception_analysis_queries`.
    3.  Real-time `perception_tool_call` logs (timestamps + base64 frames).
    4.  The P0 Sparring Partner's Knowledge Base rubrics.

### B. Gemini 3.1 Flash Lite Synthesis (M1 & P1)
The core "intelligence" layer where raw signals become actionable growth.
*   **M1 Mentor Generation:** Gemini analyzes the "hesitation" and "eye contact" signals against the dating rubrics to generate a critique.
    *   *Output:* A structured Mentor persona that knows exactly where the user failed (e.g., "At 00:45, you broke eye contact when she asked about your hobbies").
*   **P1 Persona Hedging:** Gemini "hedges" Raven's notes against the user's performance to design the next Sparring Partner.
    *   *Output:* A new Tavus Persona prompt (P1) that is 10% more difficult specifically in the areas the user struggled.

### C. Mentor Review Dashboard (Frontend)
The user reviews their "Game Film" alongside the Mentor's feedback.
*   **Synchronized Highlights:** The UI uses Raven's timestamps to create "bookmarks" in the S3 video player.
*   **Visual Proof:** Clicking a critique displays the specific image frame captured by Raven during the `perception_tool_call`.
*   **Mentor Interaction:** A text/video interface where the Mentor persona (M1) delivers the critique.

## 4. Technical Logic: Agentic Prompting
Gemini 3.1 Flash Lite will use a two-step prompting chain:
1.  **Extraction:** "Based on these Raven logs and this transcript, identify the top 3 moments where the user failed to meet the 'Confidence' rubric."
2.  **Generation:** "Using these 3 moments, create a system prompt for a new Tavus avatar that will intentionally pressure the user on those specific weaknesses."

## 5. Acceptance Criteria for Phase 2
1.  **Webhook Success:** The system successfully receives and parses the Tavus `system.shutdown` event.
2.  **S3 Integration:** The backend can retrieve and serve the Cloud Recording link to the frontend player.
3.  **Synthesis Quality:** Gemini reliably identifies behavioral failures based on Raven's raw signals.
4.  **Loop Closure:** The system successfully generates a new Persona ID (P1) ready for the next sparring session.
