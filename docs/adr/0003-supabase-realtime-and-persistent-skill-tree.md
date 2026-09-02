# ADR 0003: Supabase Realtime & Persistent Skill Tree

* **Status**: Accepted & Implemented
* **Date**: 2026-09-02
* **Deciders**: Full-Stack & Database Engineering Team

---

## Context & Problem Statement

Users need real-time telemetry updates as sessions conclude, instant debrief synchronization, and long-term skill progression tracking across 5 mastery tiers (Foundations, Banter, Vulnerability, Tension Management, Mastery).

---

## Decision Drivers

1. **Realtime WebSocket Subscriptions**: Instant UI updates when background synthesis completes without client polling loops.
2. **Row-Level Security (RLS)**: Enforcing strict user isolation for sensitive video session logs and psychological evaluations.
3. **Structured Rubric Storage**: JSONB columns for multi-dimensional scores, baseline tracking, and evidence clip ranges.

---

## Decision Outcome

Adopt Supabase (PostgreSQL 15 + Realtime Engine):

* **`user_progress`**: Tracks active unlocked tier ($1 - 5$), completed sessions, and overall competency percentage.
* **`sessions`**: Stores conversation IDs, persona metadata, Tavus call identifiers, and session status (`active`, `processing`, `completed`).
* **`insights`**: Stores synthesis outputs, master performance markdown logs, `maj@3` rubric breakdowns, and evidence clip markers. Realtime listeners trigger debrief UI transitions immediately upon row insertion.

### Positive Consequences
* Zero client polling overhead for asynchronous LLM synthesis pipelines.
* Secure multi-tenant data isolation via PostgreSQL Row-Level Security policies.
