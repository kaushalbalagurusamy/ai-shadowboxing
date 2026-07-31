---
title: AI Shadowboxing - Master System Manifest & Documentation Index
status: active
last_updated: 2026-07-31
framework: Next.js 16 (React 19)
production_url: https://ai-shadowboxing.vercel.app
repository: kaushalbalagurusamy/ai-shadowboxing
---

# AI Shadowboxing: System Manifest & Documentation Index

Welcome to the central documentation index for **AI Shadowboxing**, a gamified, ultra-realistic "first date" training simulator designed to help users practice high-stakes interpersonal interactions under multimodal AI screening.

---

## 1. Documentation Cognitive Map

The project documentation is structured into four distinct cognitive pillars:

| Pillar | File Path | Focus & Purpose |
| :--- | :--- | :--- |
| **System Index** | [`.docs/README.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/README.md) | Central entrypoint, feature-to-file matrix, and sitemap. |
| **Architecture** | [`.docs/architecture.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/architecture.md) | Technical architecture, WebRTC streams, Supabase schemas, and Gemini chain. |
| **Product Vision** | [`.docs/product_requirements.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/product_requirements.md) | Core product vision, gamification loop (P0 → M1 → P1), and 4 High-Value rubrics. |
| **Engineering Roadmap** | [`.docs/hardening_roadmap.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/hardening_roadmap.md) | 10-phase engineering hardening plan, execution logs, and benchmark metrics. |
| **Phase 1 PRD** | [`.docs/phase_1_prd.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/phase_1_prd.md) | Historical PRD: P0 Baseline Sparring Partner implementation. |
| **Phase 2 PRD** | [`.docs/phase_2_prd.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/.docs/phase_2_prd.md) | Historical PRD: M1 Mentor synthesis and the "Zipper" distillation engine. |
| **Agent Directives** | [`GEMINI.md`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/GEMINI.md) | Google L9+ Operational Directives & L11+ Systems Performance Principles. |

---

## 2. Feature-to-File Matrix

This table maps every end-user feature to its backend API route, custom React hook, UI component, and underlying database table:

| Feature | Primary API Route | React Hook / Store | UI Component | Database / Storage |
| :--- | :--- | :--- | :--- | :--- |
| **WebRTC Session Provisioning** | [`POST /api/tavus`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/route.ts) | [`useTavusSession.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/hooks/useTavusSession.ts) | [`MediaStreamContainer.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/MediaStreamContainer.tsx) | Tavus CVI v2 API |
| **L1+L2 Persona Caching** | [`POST /api/tavus`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/tavus/route.ts) | [`personaStore.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/personaStore.ts) | [`AvatarSelector.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/AvatarSelector.tsx) | Supabase `insights` (`global_persona_cache`) |
| **Realtime Insight Streaming** | N/A (WebSocket) | [`useSessionInsights.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/hooks/useSessionInsights.ts) | [`NotesTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/NotesTab.tsx) | Supabase Realtime (`insights` table) |
| **Event-Driven Zipper Synthesis** | [`POST /api/webhooks/tavus`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/webhooks/tavus/route.ts) | [`insightStore.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/insightStore.ts) | [`MentorTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/MentorTab.tsx) | Supabase Storage (`video-clips`) & Gemini 3.1 |
| **Scenario Challenge Presets** | N/A (Static) | [`scenarioPresets.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/scenarioPresets.ts) | [`DateTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/DateTab.tsx) | Local Config Library |
| **Multi-Session Progress Analytics** | [`GET /api/progress`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/progress/route.ts) | [`progressStore.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/progressStore.ts) | [`NotesTab.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/NotesTab.tsx) | Supabase `insights` metadata |
| **Interactive M1 Mentor Q&A Chat** | [`POST /api/mentor/chat`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/mentor/chat/route.ts) | N/A | [`MentorChatContainer.tsx`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/components/MentorChatContainer.tsx) | Gemini 3.1 Flash Lite |
| **Production Security & Webhooks** | [`POST /api/webhooks/tavus`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/app/api/webhooks/tavus/route.ts) | [`telemetry.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/telemetry.ts) | N/A | HMAC SHA-256 Signature Verification |
| **Automated Integration Testing** | N/A | [`e2e.test.ts`](file:///Users/kaushal/Documents/Github/ai-shadowboxing/src/lib/__tests__/e2e.test.ts) | `npm run test` | TypeScript & TSX Test Orchestrator |

---

## 3. High-Value Rubrics Definition

All session perceptions (via Tavus Raven-1) and mentor syntheses (via Gemini 3.1) are evaluated against four core pillars:

1. **Emotional Intelligence (EQ):** Composure under pressure, absence of nervous stuttering or validation-seeking.
2. **Intellectual Quality (IQ):** Conversational depth, clarity of thought, intellectual rigor.
3. **Perceived Wealth & Status:** Lifestyle authenticity, career grounding, absence of over-compensation.
4. **Physique & Presence:** Posture, eye contact, vocal pitch stability, screen-based presence.

---

## 4. Developer Verification & Build Commands

* **Run Type Check & Tests:** `npm run test` (Runs `tsc --noEmit` + `tsx src/lib/__tests__/run-all-tests.ts`)
* **Local Development Server:** `npm run dev`
* **Production Build Verification:** `npm run build`
* **Production Deployment:** `npx vercel deploy --prod --yes`
