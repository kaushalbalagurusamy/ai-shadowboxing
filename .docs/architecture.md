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
       +<--- [ Raw Tavus JSON Streams ] <--- [ Post-Session ]
       |      (Transcript, Tool Calls, Analysis)
       |                                      |
       |                                      v
       |           [ Gemini 3.1 Flash Lite: THE ZIPPER ]
       |           (Context Distillation & Timestamp Alignment)
       |                                      |
       |                                      v
       |         [ High-Fidelity Master Performance Log (MD) ]
       |                                      |
       |                                      v
       +---> [ Gemini 3.1 Flash Lite: THE COACH ] ----> [ Customized P1 / M1 Persona Prompts ]
```

## 2. Live Session Architecture (Tavus-Native)
The MVP utilizes the Tavus-native stack to minimize latency and technical overhead.
- **Tavus Phoenix:** Handles lifelike digital replica rendering.
- **Tavus Raven:** Acts as the "Perception Engine," monitoring eye contact, tone, and behaviors.
- **Tavus Sparrow:** Manages conversational turn-taking and rhythm.
- **Tavus Knowledge Base:** Stores the high-value rubrics (EQ, IQ, Wealth, Physique).

## 3. Customization Engine (Gemini 3.1 Flash Lite)
The synthesis phase now follows a **Two-Pass Agentic Chain**:
- **Pass 1: The Zipper (Distillation):** Gemini ingests disparate JSON streams (Sparrow Transcript + Raven Tool Calls + Raven Analysis). It performs "Canonical Trace Generation," interleaving non-verbal subtext directly with dialogue based on precise timestamps.
- **Pass 2: The Coach (Synthesis):** The Mentor (M1) and Partner (P1) agents read the **Master Performance Log**. This ensures maximum fidelity—the Coach sees exactly how the user reacted *while* speaking or listening.

## 4. Cloud Recording (Game Film)
Tavus Cloud Recording captures the session to AWS S3. The Master Performance Log acts as the "Director's Commentary" for this game film.
