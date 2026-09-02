# AI Shadowboxing

Multimodal conversational sparring simulator combining low-latency neural video avatars (Tavus CVI v2), real-time non-verbal computer vision perception, deterministic two-pass Gemini evaluation (`maj@3` ensemble), and interactive mentor debriefs.

---

## Architecture & Data Flow

```
[ Client Browser (Next.js 16 + React 19) ]
       |
       +<--- [ WebRTC Live Audio/Video Stream ] ---> [ Tavus CVI v2 Engine ]
       |                                              - Phoenix-4 (Emotion Rendering)
       |                                              - Raven-1 (Visual Perception)
       |                                              - Sparrow-1 (Turn Detection)
       |                                                         |
       |                   (Dual-Registered Tools & Perception)  |
       |                   [end_conversation, log_behavioral_signal]
       |                   [trigger_evidence_clip, log_incongruence]
       |                                                         v
       +<--- [ Supabase Realtime WebSocket ] <------- [ Post-Session Webhook / Ingestion ]
       |      (insights table: postgres_changes)       (system.shutdown event / GET sync)
       |                                                         |
       |                                                         v
       |                                        [ Pass 1: The Zipper (Gemini 3.7 Flash) ]
       |                                        (Timestamp Alignment & Transcript Distill)
       |                                                         |
       |                                                         v
       |                                        [ Master Performance Markdown Log ]
       |                                                         |
       |                                                         v
       |                                        [ Pass 2: maj@3 Parallel CoT Ensemble ]
       |                                        (3x Parallel Rubric Evaluation, 90% Gate)
       |                                                         |
       |                                                         +---> [ PASS >= 90% ]: Unlock Tier n+1
       |                                                         +---> [ RETRY < 90% ]: Retain Tier n
       |                                                         |
       +<--- [ Interactive Mentor Debrief (Darius) ] <-----------+ (Clips with -18dB Audio Ducking)
       |
       +<--- [ Contextual Mentor Q&A Chat ] (/api/mentor/chat)
```

---

## Core Capabilities

* **Sub-500ms Neural Video Avatars**: Bidirectional WebRTC streaming powered by Tavus Phoenix-4 with dynamic inline XML emotion tagging (`<emotion value="neutral"/>`, `<emotion value="contempt"/>`, `<emotion value="excited"/>`).
* **Real-Time Multimodal Perception**: Tavus Raven-1 tracks non-verbal cues (eye contact stability, nervous laughter, posture, and vocal inflection) natively during live calls.
* **Two-Pass Gemini Synthesis Engine**:
  * **Pass 1 (The Zipper)**: Reconciles high-frequency perception event timestamps with conversational transcripts into an immutable master performance log.
  * **Pass 2 (maj@3 Ensemble)**: Three parallel Chain-of-Thought evaluators score performance against 5-tier behavioral rubrics with a strict 90% progression gate.
* **Interactive Mentor Debrief (Darius)**: Zoom-style post-session video review featuring timestamped evidence clips with automated $-18\text{dB}$ audio ducking and real-time interactive Q&A.
* **5-Tier Persistent Skill Ladder**: Supabase-backed skill tree tracking user progress from Foundations to Advanced Conversational Mastery.

---

## Repository Structure

```
ai-shadowboxing/
├── src/
│   ├── app/                  # Next.js App Router pages and API routes
│   │   ├── api/              # API endpoints (tavus, synthesis, mentor, progress, webhooks)
│   │   ├── layout.tsx        # Root layout and theme providers
│   │   └── page.tsx          # Main application container
│   ├── components/           # React workspace components
│   │   ├── DateTab.tsx       # Live WebRTC conversational sparring stage
│   │   ├── MentorTab.tsx     # Post-session video debrief and clip playback
│   │   ├── NotesTab.tsx      # Comprehensive performance notes and rubric scores
│   │   ├── SkillsTab.tsx     # 5-tier persistent skill progression ladder
│   │   ├── MentorChatContainer.tsx # Contextual mentor Q&A chat
│   │   └── AvatarSelector.tsx # Sparring partner and mentor selection
│   ├── hooks/                # Custom hooks (WebRTC, audio ducking, Supabase realtime)
│   └── lib/                  # Service clients (Tavus, Gemini, Supabase)
├── docs/
│   └── adr/                  # Architectural Decision Records (ADRs 0001 - 0004)
├── .docs/                    # Technical PRDs, architecture deep dives, and roadmaps
├── supabase/                 # Database migrations and schema definitions
├── e2e/                      # Playwright end-to-end test suite
├── package.json              # Project dependencies and Next.js scripts
└── tsconfig.json             # TypeScript configuration
```

---

## Prerequisites

* **Node.js**: 20.x or higher
* **Tavus Account**: CVI v2 API key with Phoenix-4 and Raven-1 access
* **Google AI Studio**: Gemini 3.7 Flash API key (Free Tier eligible)
* **Supabase Project**: Database URL and Anon key

---

## Environment Configuration

Create your `.env.local` file from the template:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Required* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Required* | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | *Required* | Supabase service role key (server-side only) |
| `TAVUS_API_KEY` | *Required* | Tavus CVI v2 API key |
| `TAVUS_REPLICA_ID` | *Required* | Default date avatar replica ID |
| `TAVUS_MENTOR_REPLICA_ID` | *Required* | Darius mentor replica ID |
| `GOOGLE_GENERATIVE_AI_API_KEY`| *Required* | Google AI Studio Gemini API key |
| `GEMINI_MODEL` | `gemini-3.7-flash` | Reasoning engine model name |

---

## Quickstart

### 1. Installation

```bash
git clone https://github.com/kaushalbalagurusamy/ai-shadowboxing.git
cd ai-shadowboxing

npm install
```

### 2. Running Development Server

```bash
npm run dev
```

The application will start locally at `http://localhost:3000`.

### 3. Production Build

```bash
npm run build
npm run start
```

---

## Testing & Verification

```bash
# Run unit tests
npm test

# Run Playwright end-to-end tests
npx playwright test
```

---

## Technical Documentation & ADRs

All core architectural decisions are recorded in [`docs/adr/`](docs/adr/):

* [`docs/adr/0001-webrtc-multimodal-conversational-video-pipeline.md`](docs/adr/0001-webrtc-multimodal-conversational-video-pipeline.md) — WebRTC Multimodal Conversational Video Pipeline (Tavus CVI v2)
* [`docs/adr/0002-two-pass-gemini-synthesis-and-maj3-ensemble.md`](docs/adr/0002-two-pass-gemini-synthesis-and-maj3-ensemble.md) — Two-Pass Gemini Synthesis and maj@3 Ensemble
* [`docs/adr/0003-supabase-realtime-and-persistent-skill-tree.md`](docs/adr/0003-supabase-realtime-and-persistent-skill-tree.md) — Supabase Realtime & Persistent Skill Tree
* [`docs/adr/0004-interactive-debrief-with-evidence-clip-playback.md`](docs/adr/0004-interactive-debrief-with-evidence-clip-playback.md) — Interactive Debrief with Evidence Clip Playback

Deep architectural specifications and PRDs are in [`.docs/`](.docs/):
* [`.docs/architecture.md`](.docs/architecture.md) — Comprehensive System Architecture & Data Flow
* [`.docs/product_requirements.md`](.docs/product_requirements.md) — Product Requirements Document (PRD)
* [`.docs/testing_strategy.md`](.docs/testing_strategy.md) — Multimodal Testing & Evaluation Strategy

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.