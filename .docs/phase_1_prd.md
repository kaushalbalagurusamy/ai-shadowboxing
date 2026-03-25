# Product Requirements Document: AI Shadowboxing - Phase 1 (MVP)

## 1. Phase 1 Overview: The Demo Sparring Session (P0)
Phase 1 serves as the initial, high-pressure conversational benchmark for the user. The goal is to drop the user into a highly realistic, sub-500ms latency video conversation with a digital replica. During this session, the system must actively monitor the user's conversational performance (verbal and non-verbal) to generate insights for the subsequent Mentor phase.

## 2. Technical Stack (Phase 1)
*   **Frontend:** Next.js (React) browser client.
*   **Video Streaming:** WebRTC (via Daily or LiveKit as provisioned by Tavus) embedded via `<iframe>` or Tavus React components.
*   **Backend System:** Node.js/Next.js API Routes for secure API key handling.
*   **Conversational AI Engine:** Tavus Conversational Video Interface (CVI) API (`v2`).
    *   *Phoenix:* Real-time rendering.
    *   *Sparrow:* LLM turn-taking and conversational rhythm.
    *   *Raven-1:* Multimodal perception engine for visual and auditory analysis.

## 3. Core Implementation Workflows & API Mapping

### A. Provisioning the Sparring Partner (Persona Creation) [COMPLETED]
Before the session starts, the backend must construct the "brain" of the P0 replica. 
*   **Action:** The backend makes a server-side call to define the P0 persona's behavior, referencing the dating/psychology rubrics.
*   **Tavus API Call:** `POST https://tavusapi.com/v2/personas`
*   **Key Payload Parameters:**
    *   `persona_name`: e.g., "P0_Baseline_Sparring_Partner"
    *   `system_prompt`: A detailed prompt instructing the AI on its personality, how to respond to the user, and specific behaviors to exhibit to "spike the nervous system."
    *   `pipeline_mode`: `"full"` (to enable audio, video, and LLM reasoning).
    *   **Layer Configuration (Raven-1):**
        *   `perception_analysis_queries`: A list of rubric-based questions for Raven to answer (e.g., "Did the user maintain eye contact when challenged?").
        *   `visual_tools`: Defining functions that Raven can trigger in real-time when specific cues are detected (e.g., `detect_hesitation`).
    *   **Knowledge Base Integration:** Provide `document_ids` (rubrics) so Raven's observations are grounded in the specific "Shadowboxing" standards.

### B. Initiating the Live WebRTC Session (Conversation Creation) [COMPLETED]
When the user clicks "Start Sparring," the system provisions a live video room with cloud recording enabled.
*   **Action:** Create a real-time conversation instance linking a visual Replica to the newly created Persona.
*   **Tavus API Call:** `POST https://tavusapi.com/v2/conversations`
*   **Key Payload Parameters:**
    *   `replica_id`: Selected via UI dropdown (e.g., Luna `r9d30b0e55ac`).
    *   `persona_id`: The ID returned from the Persona creation step.
    *   `enable_recording`: `true` (Enables SOTA server-side recording to minimize client-side CPU load).
    *   **Cloud Recording Config:** AWS S3 credentials (`aws_assume_role_arn`, `recording_s3_bucket_name`) must be provided to Tavus for automated file storage.
    *   `callback_url`: A secure webhook endpoint on our Next.js backend (e.g., `/api/webhooks/tavus`) to receive post-session recording links and Raven analysis.
*   **Expected Response:** The API returns a `conversation_url` and a `conversation_id`.

### C. Client-Side Rendering & Session Control [COMPLETED]
*   **Action:** The React frontend receives the `conversation_url`.
*   **Implementation:** The client application embeds the `conversation_url` using an `<iframe>`.
*   **Hard Close (Billing Protection):** An "End Session" button calls `POST /v2/conversations/{id}/end` to stop the billing clock immediately. `navigator.sendBeacon` is used for cleanup on tab closure.
*   **Cloud Game Film:** [PENDING] Instead of local recording, the system relies on the Tavus Cloud Recording. The frontend will trigger the start of recording via the Daily SDK to ensure the session is captured on the server.

### D. Insight Extraction (Raven & WebRTC Data Channels) [PENDING]
During the conversation, the system must collect data for the Phase 2 Mentor synthesis.
*   **Action:** Capture transcripts and emotional/visual perception events.
*   **Implementation Strategies:**
    *   **Real-time (`perception_tool_call`):** Listen for events over the WebRTC data channel. These include ISO timestamps and base64 image frames of the trigger event (e.g., a "nervous" face).
    *   **Post-Session (`perception_analysis`):** The backend webhook captures the final session summary where Raven answers the `perception_analysis_queries` with exact `turn_idx` and sequence mapping.

## 4. Acceptance Criteria for Phase 1 MVP
1.  **API Integration:** Next.js backend successfully creates a Persona and Conversation via Tavus `v2` APIs. [PASSED]
2.  **Streaming Latency:** The WebRTC stream successfully embeds and maintains <500ms latency. [PASSED]
3.  **Avatar Selection:** User can select different stock avatars from the UI. [PASSED]
4.  **Session Security:** Billing stops immediately upon session termination (manual or browser close). [PASSED]
5.  **Data Capture:** System logs `perception_tool_call` events with timestamps and images. [PENDING]
6.  **Cloud Recording:** Tavus successfully records the session and pushes the `.mp4` to the configured S3 bucket. [PENDING]
