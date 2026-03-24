# AI Shadowboxing: The First Date Simulator

AI Shadowboxing is a gamified "first date" training simulator designed to help straight men practice high-stakes interpersonal interactions. Leveraging state-of-the-art native multimodal streaming models (e.g., Gemini 3.1, GPT 5.4, Claude Opus 4.6), the simulator reacts instantly not just to *what* you say, but *how* you say it (vocal pitch, nervous laughter, eye contact, and posture).

## Core Features
1. **Sensory Perception (The Engine):** Utilizing direct Multimodal Live APIs via WebRTC, the application streams raw audio and low-framerate video to the model natively, eliminating latency bottlenecks caused by legacy STT/TTS pipelines.
2. **Tiered Difficulty (The Sparring Partner):** Driven by neural rendering engines like Simli or Tavus, the date avatar adapts mid-session. Using dynamic prompt injection, the system can adjust the "difficulty" (e.g., the date becomes more distant, interrupts more frequently, or adopts a more dominant posture) based on the user's real-time performance.
3. **Actionable Mentorship:** Complex analysis is pushed post-session to protect the live illusion. The entire date is recorded locally. Afterward, a massive context reasoning model analyzes the video against a pre-loaded dating rubric, outputting precise timestamped feedback. A "Mentor" avatar then walks the user through exactly where they succeeded or failed.

## Architecture Highlights
To achieve sub-500ms response times, this project enforces a "thick client, thin secure server" architecture:
- **Next.js (React):** Handles UI and WebRTC peer connection state.
- **WebRTC:** Direct connections established from the client browser to the LLM API and Rendering Engine (Simli/Tavus). The server only generates secure ephemeral tokens.
- **Zero Live-RAG:** To prevent latency spikes, all psychological rubrics and custom principles are pre-loaded into the system context window *before* the session begins.

## Setup Instructions
*(Coming Soon)*

## Documentation
- [Product Requirements](./.docs/product_requirements.md)
- [Architecture Details](./.docs/architecture.md)
- [AI Development Guidelines](./AGENT.md)