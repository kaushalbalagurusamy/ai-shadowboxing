---
title: AI Shadowboxing - Technical System Architecture
type: architecture
status: active
last_updated: 2026-07-31
key_components: Tavus CVI v2, Gemini 3.1 Flash Lite, Supabase Realtime, Next.js 16
---

# System Architecture & Technical Stack

This document describes the high-level data flow, WebRTC streaming mechanics, Supabase database schemas, and two-pass Gemini synthesis chain powering **AI Shadowboxing**.

---

## 1. High-Level System Data Flow

```text
[ Client Browser (Next.js 16 React 19) ]
       |
       +<--- [ WebRTC Live Audio/Video Stream ] ---> [ Tavus CVI Engine ]
       |                                                (Phoenix + Raven + Sparrow)
       |                                                          |
       |                   (Realtime Tool Calls & Transcripts)   |
       |                                                          v
       +<--- [ Supabase Realtime WebSocket ] <------- [ Post-Session Webhook ]
       |      (insights table: postgres_changes)       (system.shutdown event)
       |                                                          |
       |                                                          v
       |                                        [ Gemini 3.1 Flash Lite: THE ZIPPER ]
       |                                        (Context Distillation & Timestamp Alignment)
       |                                                          |
       |                                                          v
       |                                      [ Master Performance Log (Markdown) ]
       |                                                          |
       |                                                          v
       +<--- [ Interactive Mentor Chat ] <------- [ Gemini 3.1 Flash Lite: THE COACH ]
             (/api/mentor/chat)                   (M1 Mentor & P1 Partner Synthesizer)
```

---

## 2. Technical Stack Specifications

* **Frontend Client:** Next.js 16 (React 19) thick-client model with modular tabbed interface ([`src/components/DateTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/DateTab.tsx), [`src/components/MentorTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/MentorTab.tsx), [`src/components/NotesTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/NotesTab.tsx)).
* **Conversational AI Engine (Tavus CVI v2):**
  * *Tavus Phoenix:* Photorealistic digital replica rendering (<500ms latency).
  * *Tavus Sparrow:* LLM turn-taking, rhythm, and dialogue generation.
  * *Tavus Raven-1:* Multimodal perception engine monitoring non-verbal cues, vocal pitch, eye contact, and emotional state grounded in high-value rubrics.
* **Database & Realtime Layer (Supabase Postgres & Realtime):**
  * PostgreSQL `insights` table storing transcript turns, perception tool calls, session summaries, and L2 persona caches ([`src/lib/insightStore.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/insightStore.ts)).
  * Supabase Realtime WebSockets streaming perception cues live to the UI ([`src/hooks/useSessionInsights.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/hooks/useSessionInsights.ts)).
  * Supabase Storage `video-clips` bucket holding zero-byte RAM stream video uploads.
* **Reasoning Engine (Google Gemini 3.1 Flash Lite):**
  * *Pass 1 (The Zipper):* Chronologically interleaves Sparrow transcripts with Raven perception tool calls into a unified **Master Performance Log**.
  * *Pass 2 (The Coach):* Synthesizes 4-pillar scores (EQ, IQ, Wealth, Physique) and generates customized M1 Mentor and P1 Next Partner prompts.

---

## 3. Core API Endpoint Mapping

| Endpoint | Method | File Path | Function |
| :--- | :--- | :--- | :--- |
| `/api/tavus` | `POST` | [`src/app/api/tavus/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/route.ts) | SHA-256 Persona caching & conversation creation. |
| `/api/tavus/end` | `POST` | [`src/app/api/tavus/end/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/end/route.ts) | Hard close session termination (billing protection). |
| `/api/webhooks/tavus` | `POST` | [`src/app/api/webhooks/tavus/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/webhooks/tavus/route.ts) | HMAC SHA-256 verification & event-driven synthesis trigger. |
| `/api/synthesis` | `POST` | [`src/app/api/synthesis/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/synthesis/route.ts) | Native Gemini SDK 2-pass synthesis runner. |
| `/api/progress` | `GET` | [`src/app/api/progress/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/progress/route.ts) | Historical multi-session score analytics aggregator. |
| `/api/mentor/chat` | `POST` | [`src/app/api/mentor/chat/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/mentor/chat/route.ts) | Interactive M1 Mentor post-session debrief Q&A. |
