---
title: Product Requirements Document - Phase 1 (P0 Sparring Session Baseline)
type: prd_archive
status: completed
last_updated: 2026-07-28
---

# Product Requirements Document: Phase 1 (P0 Baseline Sparring)

> **Note:** This document outlines the historical product requirements for the initial P0 Sparring Date baseline implementation. For engineering hardening milestones, refer to [`.docs/hardening_roadmap.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/hardening_roadmap.md).

---

## 1. Phase 1 Overview: The Demo Sparring Session (P0)
Phase 1 serves as the initial, high-pressure conversational benchmark for the user. The goal is to drop the user into a highly realistic, sub-500ms latency video conversation with a digital replica. During this session, the system actively monitors the user's conversational performance (verbal and non-verbal) to feed the subsequent **Context Distillation (The Zipper)** phase.

---

## 2. Technical Stack (Phase 1)
* **Frontend:** Next.js 16 (React 19) browser client with "Date" and "Notes" tabs ([`src/app/page.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/page.tsx)). [COMPLETED]
* **Conversational AI Engine:** Tavus Conversational Video Interface (CVI) API (`v2`). [COMPLETED]
  * *Phoenix:* Real-time rendering.
  * *Sparrow:* LLM turn-taking and conversational rhythm.
  * *Raven-1:* Multimodal perception engine for visual and auditory analysis.

---

## 3. Core Implementation Workflows & API Mapping

### A. Provisioning the Sparring Partner (Persona Creation) [COMPLETED]
* **Action:** Backend call to define the P0 persona's behavior, referencing the high-value rubrics (EQ, IQ, Wealth, Physique) ([`src/app/api/tavus/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/route.ts)).
* **Perception Analysis Queries:** Specific queries are sent to Raven to analyze **Appearance, Behavior, Emotion, and Screen Activities** grounded in the knowledge base.

### B. Initiating the Live WebRTC Session (Conversation Creation) [COMPLETED]
* **Action:** Create a real-time conversation instance linking a visual Replica to the newly created Persona.

### C. Client-Side Rendering & Session Control [COMPLETED]
* **Tabs:** "Date" (Config) and "Notes" (Real-time feedback) tabs for dev-level observation.
* **Hard Close (Billing Protection):** Immediate session termination via manual button or browser close ([`src/app/api/tavus/end/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/end/route.ts)).

### D. Insight Extraction (Data Stream Preparation) [COMPLETED]
The system captures three distinct streams for the Phase 2 Zipper:
1. **Sparrow Transcript:** Real-time turns captured via `conversation.utterance`.
2. **Raven Real-time Tool Calls:** Logged behavioral cues with ISO timestamps and image frames.
3. **Raven Final Analysis:** The high-level summary mapping the session to the rubrics.
