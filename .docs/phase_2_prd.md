---
title: Product Requirements Document - Phase 2 (Mentor Synthesis & Zipper)
type: prd_archive
status: completed
last_updated: 2026-07-28
---

# Product Requirements Document: Phase 2 (Mentor Synthesis & Zipper)

> **Note:** This document outlines the historical product requirements for the M1 Mentor synthesis and Zipper distillation implementation. For engineering hardening milestones, refer to [`.docs/hardening_roadmap.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/hardening_roadmap.md).

---

## 1. Phase 2 Overview: Customization & Growth
Phase 2 transitions the user from "Sparring" to "Review and Refinement." The key innovation in this phase is the **Context Distillation (The Zipper)** step, which converts disparate data streams into a high-fidelity "film script" of the date before analysis begins.

---

## 2. Technical Stack (Phase 2)
* **LLM (Reasoning Engine):** Google Gemini 3.1 Flash Lite ([`src/lib/gemini.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/gemini.ts)). [READY]
* **Webhook Infrastructure:** Next.js API Routes to capture Tavus `system.shutdown` data ([`src/app/api/webhooks/tavus/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/webhooks/tavus/route.ts)). [READY]
* **Frontend:** Next.js (React) review dashboard with synchronized "Game Film" playback ([`src/components/NotesTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/NotesTab.tsx)).

---

## 3. Core Implementation Workflows

### A. Step 1: Canonical Trace Generation (The Zipper) [COMPLETED]
The "Zipper" agent (Gemini 3.1 Flash Lite) aligns raw data into a single, cohesive log ([`src/app/api/synthesis/route.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/synthesis/route.ts)).
* **Interleaving:** Interleaves transcript turns with Raven tool calls chronologically based on ISO timestamps.
* **Rubric Integration:** Tags each dialogue/behavioral pair with corresponding rubrics (EQ, IQ, Wealth, Physique).
* **Output:** The **Master Performance Log (Markdown)**—a unified source of truth.

### B. Step 2: Synthesis (M1 Mentor & P1 Partner) [COMPLETED]
The "Coach" agent reads the Master Performance Log to produce feedback and next partner configuration.
* **M1 Mentor Generation:** Gemini provides a critique using the Master Performance Log.
* **P1 Persona Hedging:** Gemini designs the next Sparring Partner's persona prompt (P1) by hedging against the user's specific failures.

### C. Step 3: Mentor Review Dashboard (Frontend) [COMPLETED]
* **Proactive Synthesis:** Analysis triggers automatically after session end via `system.shutdown` webhook.
* **Transmission View:** Display box showing Master Performance Log in Notes tab.
* **Chat Integration:** Mentor tab allows immediate chat with M1 Coach ([`src/components/MentorChatContainer.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/MentorChatContainer.tsx)).
