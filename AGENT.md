# AI Coding Assistant Directives: AI Shadowboxing

This file contains repository-level instructions for any AI coding assistant or agent working within this codebase.

## 1. Context and Domain
- **Project Goal:** Build an ultra-low latency, multimodal "first date" simulator targeted at straight men to practice and receive feedback on their dating skills.
- **SOTA Tooling:** You are operating in a 2026 SOTA environment. Assume availability of native multimodal streaming APIs (e.g., Gemini 3.1 Pro, GPT 5.4, Claude Opus 4.6). Do not rely on 2024-era fragmented architectures (separate STT -> LLM -> TTS).

## 2. Architectural Constraints
- **Native Multimodal Streaming:** For the live "date" session, strict sub-500ms latency is required. The architecture relies on client-side WebRTC connections directly to the multimodal LLM API to process raw audio and low-framerate video simultaneously.
- **No Mid-Stream RAG:** Do NOT introduce vector databases or RAG architectures for the live session. Querying a vector DB mid-stream introduces unacceptable latency (200-400ms). All "custom principles" and dating rubrics must be loaded entirely into the model's system context window prior to the session start.
- **Rendering Engine:** The LLM's raw audio output drives a photorealistic 3D avatar engine like **Simli** or **Tavus**.
- **Post-Session Analysis:** Do NOT attempt complex temporal analysis during the live stream. Instead, capture the raw stream locally (browser `MediaRecorder` API). The captured file is later processed by a high-tier reasoning model (Gemini 3.1 Pro / GPT 5.4 / Opus 4.6) with a massive context window to extract actionable feedback and precise clip timings.

## 3. Tech Stack Directives
- **Framework:** Next.js (React).
- **Client/Server Split:** Use a "thick client, thin secure server" model. Serverless API routes must strictly be used for secure ephemeral token generation (e.g., LiveKit tokens, Simli keys). Do NOT proxy the live WebRTC media stream through the server. The client must establish direct P2P connections to the LLM and Avatar renderer.
- **Code Style:** Strict TypeScript, functional React components, modern React hooks (`useEffect`, `useState`, `useRef`).

## 4. Development Workflow
When completing tasks in this repository, ensure that all feature additions respect the low-latency constraints. Never introduce libraries or patterns that buffer or bottleneck the live media stream.

## 5. CLI-Native Git Workflow & Autonomous Changes
This project prioritizes a rapid, CLI-centric development loop. Agents must optimize for local terminal review rather than web-based Pull Requests. 

When operating autonomously, adhere to the following workflow:
1. **Local Isolation:** Never commit directly to `main`. Always check out a new local branch (e.g., `feature/agent-[task]`).
2. **Atomic Commits (The Undo Stack):** Make frequent, highly specific commits after every logical milestone. Treat commits as a granular "undo stack" for the human reviewer. If an approach fails, it should be easy to revert a single commit rather than an entire session.
3. **Descriptive Intent:** Commit messages must explain the *why* behind architectural decisions, not just list the files changed.
4. **Terminal Review Handoff:** When a task is complete, do NOT push to a remote or open a PR. Instead, pause and notify the user that the branch is ready for local review (e.g., via `git diff main` or `git log -p`).
5. **Local Merge:** Only merge into `main` locally once the human user has explicitly approved the changes in the CLI.