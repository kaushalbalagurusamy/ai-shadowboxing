# Product Requirements Document: AI Shadowboxing - Phase 1 (MVP) [COMPLETED]

## 1. Phase 1 Overview: The Demo Sparring Session (P0)
Phase 1 serves as the initial, high-pressure conversational benchmark for the user. The goal is to drop the user into a highly realistic, sub-500ms latency video conversation with a digital replica. During this session, the system must actively monitor the user's conversational performance (verbal and non-verbal) to feed the subsequent **Context Distillation (The Zipper)** phase.

## 2. Technical Stack (Phase 1)
*   **Frontend:** Next.js (React) browser client with "Date" and "Notes" tabs. [COMPLETED]
*   **Conversational AI Engine:** Tavus Conversational Video Interface (CVI) API (`v2`). [COMPLETED]
    *   *Phoenix:* Real-time rendering.
    *   *Sparrow:* LLM turn-taking and conversational rhythm.
    *   *Raven-1:* Multimodal perception engine for visual and auditory analysis.

## 3. Core Implementation Workflows & API Mapping

### A. Provisioning the Sparring Partner (Persona Creation) [COMPLETED]
*   **Action:** The backend makes a server-side call to define the P0 persona's behavior, referencing the high-value rubrics (EQ, IQ, Wealth, Physique).
*   **Perception Analysis Queries:** Specific queries are sent to Raven to analyze **Appearance, Behavior, Emotion, and Screen Activities** grounded in the knowledge base.
*   **Real-time Tools:** Raven triggers `log_behavioral_signal` calls with base64 image frames when it detects high or low value traits.

### B. Initiating the Live WebRTC Session (Conversation Creation) [COMPLETED]
*   **Action:** Create a real-time conversation instance linking a visual Replica to the newly created Persona.
*   **Callback URL:** Configured to receive post-session recording links and the full **Perception Analysis Report**.

### C. Client-Side Rendering & Session Control [COMPLETED]
*   **Tabs:** "Date" (Config) and "Notes" (Real-time feedback) tabs for dev-level observation.
*   **Hard Close (Billing Protection):** Immediate session termination via manual button or browser close (using `sendBeacon`).

### D. Insight Extraction (Data Stream Preparation) [COMPLETED]
The system captures three distinct streams for the Phase 2 Zipper:
1.  **Sparrow Transcript:** Real-time turns captured via `conversation.utterance`.
2.  **Raven Real-time Tool Calls:** Logged behavioral cues with ISO timestamps and image frames.
3.  **Raven Final Analysis:** The high-level summary mapping the session to the rubrics.

## 4. Acceptance Criteria for Phase 1 MVP
1.  **API Integration:** Successfully creates a Persona and Conversation via Tavus `v2`. [PASSED]
2.  **Streaming Latency:** The WebRTC stream embeds and maintains <500ms latency. [PASSED]
3.  **Rubric Grounding:** Raven's queries correctly reference EQ, IQ, Wealth, and Physique. [PASSED]
4.  **Data Capture:** System stores raw JSON logs for the transcript and tool calls for distillation. [PASSED]
