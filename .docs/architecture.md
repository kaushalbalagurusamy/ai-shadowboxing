# System Architecture

## 1. High-Level Flow Diagram (MVP)

```text
[ Next.js Server ]
       |
  (Token Auth)
       |
[ Browser Frontend ] 
       |
       +<--- [ WebRTC Live Stream ] ---> [ Tavus Engine ]
       |                                      |
       |                   (Phoenix + Raven + Sparrow + Knowledge Base)
       |                                      |
       |                                      v
       +<--- [ Raven Events/Memories ] <--- [ Post-Session ]
       |                                      |
       |                                      v
       +---> [ Gemini 3.1 Flash Lite ] ----> [ Customized P1 / M1 Persona Prompts ]
```

## 2. Live Session Architecture (Tavus-Native)
The MVP utilizes the Tavus-native stack to minimize latency and technical overhead.
- **Tavus Phoenix:** Handles lifelike digital replica rendering.
- **Tavus Raven:** Acts as the "Perception Engine," monitoring eye contact, tone, and behaviors. These are stored as **Memories**.
- **Tavus Sparrow:** Manages conversational turn-taking and rhythm.
- **Tavus Knowledge Base:** Stores the dating/psychological rubrics. Sparrow uses RAG to reference these in real-time.

## 3. Customization Engine (Gemini 3.1 Flash Lite)
Post-session, the architecture transitions to a synthesis phase:
- **Input:** Raw "Memories" and "Key Event" logs from Tavus Raven.
- **Reasoning:** **Gemini 3.1 Flash Lite** analyzes these inputs against the Knowledge Base.
- **Output:** A set of structured persona instructions for the next Sparring Partner (P1) and Mentor (M1).

## 4. Local Recording (Game Film)
The browser's `MediaRecorder` API is used for zero-latency local recording of the session, providing the user with "game film" for immediate review during the Mentor phase.
