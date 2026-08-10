---
title: AI Shadowboxing - Technical System Architecture
type: architecture
status: active
last_updated: 2026-08-10
key_components: Tavus CVI v2, Gemini 3.6 Flash (maj@3 Ensemble), Supabase Realtime, Next.js 16
---

# System Architecture & Technical Stack

This document describes the high-level data flow, WebRTC streaming mechanics, Supabase database schemas, and two-pass Gemini synthesis chain (including the deterministic `maj@3` ensemble and 90% progression gate) powering **AI Shadowboxing**.

---

## 1. High-Level System Data Flow

```text
[ Client Browser (Next.js 16 React 19) ]
       |
       +<--- [ WebRTC Live Audio/Video Stream ] ---> [ Tavus CVI Engine ]
       |                                                (Phoenix-4 + Raven-1 + Sparrow-1)
       |                                                          |
       |                   (Realtime Tool Calls & Transcripts)   |
       |                                                          v
       +<--- [ Supabase Realtime WebSocket ] <------- [ Post-Session Webhook / Ingestion ]
       |      (insights table: postgres_changes)       (system.shutdown event / GET sync)
       |                                                          |
       |                                                          v
       |                                        [ Gemini 3.6 Flash: THE ZIPPER ]
       |                                        (Context Distillation & Timestamp Alignment)
       |                                                          |
       |                                                          v
       |                                      [ Master Performance Log (Markdown) ]
       |                                                          |
       |                                                          v
       +<--- [ Interactive Mentor Chat ] <------- [ Gemini 3.6 Flash: maj@3 ENSEMBLE ]
             (/api/mentor/chat)                   (3x Parallel CoT Rubric & 90% Gate)
                                                                  |
                                                                  +---> [ PASS >= 90% ]: Unlock P(n+1)
                                                                  +---> [ RETRY < 90% ]: Retain P(n)
```

---

## 2. Technical Stack Specifications

* **Frontend Client:** Next.js 16 (React 19) thick-client model with modular tabbed interface ([`src/components/DateTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/DateTab.tsx), [`src/components/MentorTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/MentorTab.tsx), [`src/components/NotesTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/NotesTab.tsx)).
* **Conversational AI Engine (Tavus CVI v2):**
  * *Tavus Phoenix-4:* Photorealistic digital replica rendering (<500ms latency).
  * *Tavus Sparrow-1:* Advanced audio-native conversational flow, frame-level turn detection, and low-sensitivity interruptibility.
  * *Tavus Raven-1:* Multimodal perception engine monitoring non-verbal cues, vocal pitch, eye contact, and emotional state grounded in high-value rubrics.
  * *Session Call Caps:* 120s max call duration for Date sessions; 60s max call duration for Mentor sessions.
* **Database & Realtime Layer (Supabase Postgres & Realtime):**
  * PostgreSQL `insights` table storing transcript turns, perception tool calls, session summaries, and L2 persona caches ([`src/lib/insightStore.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/insightStore.ts)).
  * Supabase Realtime WebSockets streaming perception cues live to the UI ([`src/hooks/useSessionInsights.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/hooks/useSessionInsights.ts)).
  * Supabase Storage `video-clips` bucket holding zero-byte RAM stream video uploads.
* **Reasoning Engine (Google Gemini 3.6 Flash):**
  * *Pass 1 (The Zipper):* Chronologically interleaves Sparrow-1 transcripts with Raven-1 perception tool calls into a unified **Master Performance Log**.
  * *Pass 2 (Deterministic maj@3 Ensemble):* Executes 3 parallel asynchronous calls evaluating 10 localized binary Chain-of-Thought (CoT) criteria. Calculates median score and enforces the 90% threshold for Level $P_{n+1}$ progression vs $P_n$ retry state.
  * *Voice & Style Directive:* Synthesizes $M_{n+1}$ mentor prompt strictly under 75 words (~30s spoken delivery) in Chris Voss' late-night FM DJ voice.

---

## 3. Core API Endpoint Mapping

| Endpoint | Method | File Path | Function |
| :--- | :--- | :--- | :--- |
| `/api/tavus` | `POST` | [`src/app/api/tavus/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/route.ts) | SHA-256 Persona caching, session duration caps (120s/60s), and conversation creation. |
| `/api/tavus/end` | `POST` | [`src/app/api/tavus/end/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/end/route.ts) | Hard close session termination (billing protection). |
| `/api/webhooks/tavus` | `POST` | [`src/app/api/webhooks/tavus/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/webhooks/tavus/route.ts) | HMAC SHA-256 verification & active Tavus API GET sync trigger. |
| `/api/synthesis` | `POST` | [`src/app/api/synthesis/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/synthesis/route.ts) | Native Gemini 3.6 Flash `maj@3` parallel evaluation ensemble & 90% gate. |
| `/api/progress` | `GET` | [`src/app/api/progress/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/progress/route.ts) | Historical multi-session score analytics aggregator. |
| `/api/mentor/chat` | `POST` | [`src/app/api/mentor/chat/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/mentor/chat/route.ts) | Interactive M1 Mentor post-session debrief Q&A. |
