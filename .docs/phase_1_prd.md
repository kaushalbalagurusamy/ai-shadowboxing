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
    *   *Raven:* Real-time perception and visual/auditory analysis.

## 3. Core Implementation Workflows & API Mapping

### A. Provisioning the Sparring Partner (Persona Creation)
Before the session starts, the backend must construct the "brain" of the P0 replica. 
*   **Action:** The backend makes a server-side call to define the P0 persona's behavior, referencing the dating/psychology rubrics.
*   **Tavus API Call:** `POST https://tavusapi.com/v2/personas`
*   **Key Payload Parameters:**
    *   `persona_name`: e.g., "P0_Baseline_Sparring_Partner"
    *   `system_prompt`: A detailed prompt instructing the AI on its personality, how to respond to the user, and specific behaviors to exhibit to "spike the nervous system."
    *   `pipeline_mode`: `"full"` (to enable audio, video, and LLM reasoning).
    *   *Layer Configuration:* Ensure the **Perception (Raven)** layer is active to monitor visual cues (if exposed via specific layer toggles in v2).

### B. Initiating the Live WebRTC Session (Conversation Creation)
When the user clicks "Start Sparring," the system provisions a live video room.
*   **Action:** Create a real-time conversation instance linking a visual Replica to the newly created Persona.
*   **Tavus API Call:** `POST https://tavusapi.com/v2/conversations`
*   **Key Payload Parameters:**
    *   `replica_id`: The ID of a pre-selected photorealistic Tavus stock replica (e.g. Ashley PAL if available).
    *   `persona_id`: The ID returned from the Persona creation step.
    *   `conversational_context`: Dynamic context (e.g., "User is attempting a casual coffee shop introduction").
    *   `callback_url`: A secure webhook endpoint on our Next.js backend (e.g., `/api/webhooks/tavus`) to receive post-session data and state changes.
*   **Expected Response:** The API will return a `conversation_url`.

### C. Client-Side Rendering & Zero-Latency Gameplay
*   **Action:** The React frontend receives the `conversation_url`.
*   **Implementation:** The client application embeds the `conversation_url` using an `<iframe>` or the Tavus React SDK. This establishes the WebRTC peer-to-peer connection, achieving the required sub-500ms latency for a realistic flow (Tavus Sparrow manages the turn-taking natively over this connection).
*   **Local Game Film:** The frontend will utilize the native browser `MediaRecorder` API to capture the user's local webcam and audio stream simultaneously. This is saved directly to the user's local device/browser memory for zero-latency playback in the Phase 2 "Mentor" review.

### D. Insight Extraction (Raven & WebRTC Data Channels)
During the conversation, the system must collect data for the Phase 2 Mentor synthesis.
*   **Action:** Capture transcripts and emotional/visual perception events.
*   **Implementation Strategies:**
    *   **Real-time (WebRTC Data Channels):** Listen for events over the WebRTC connection such as `utterance` (for real-time transcripts) and `perception_analysis` (Raven's visual cue outputs like eye contact or hesitation).
    *   **Post-Session (Webhook):** Rely on the `callback_url` provided during Conversation creation. Once the session ends, Tavus will send a webhook containing the full conversational transcript, interaction metadata, and any summarized "Memories" extracted by Raven.

## 4. Acceptance Criteria for Phase 1 MVP
1.  **API Integration:** Next.js backend successfully authenticates and creates a Persona and Conversation via Tavus `v2` APIs without exposing the API key to the client.
2.  **Streaming Latency:** The WebRTC stream successfully embeds in the client, and conversational latency feels natural (handled by Tavus Sparrow).
3.  **Data Capture:** The system successfully logs both the conversational transcript and Raven's perception events (either via WebRTC data events or the final webhook).
4.  **Local Recording:** The user's browser successfully records their side of the interaction via `MediaRecorder` and holds it in local state upon session termination.
