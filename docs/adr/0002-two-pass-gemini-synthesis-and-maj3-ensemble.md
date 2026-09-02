# ADR 0002: Two-Pass Gemini Synthesis and maj@3 Ensemble

* **Status**: Accepted & Implemented
* **Date**: 2026-09-02
* **Deciders**: AI & Evaluation Team

---

## Context & Problem Statement

Real-time feedback during an active date simulation disrupts immersion. However, post-session evaluation must remain strictly objective, deterministic, and verifiable against pre-defined 5-tier communication rubrics without single-evaluator LLM variance or hallucinations.

---

## Decision Drivers

1. **Timestamp Synchronization ("The Zipper")**: Reconciling raw WebRTC audio/video perception signals with conversational transcripts into an immutable master chronological log.
2. **Deterministic Grading**: Enforcing high-precision scoring with majority voting across multiple Chain-of-Thought (CoT) evaluation runs.
3. **Strict Progression Gating**: Requiring a verifiable $\ge 90\%$ rubric threshold across all sub-skills before unlocking the next tier.

---

## Decision Outcome

Implement a two-pass synthesis pipeline using **Gemini 3.6 Flash**:

```
Session End / Webhook Trigger
             |
             v
+------------------------------------------+
| Pass 1: The Zipper (Distillation)        |
| - Merges perception timestamps + text    |
| - Outputs Master Performance Markdown Log|
+--------------------+---------------------+
                     |
                     v
+------------------------------------------+
| Pass 2: maj@3 Parallel CoT Ensemble      |
| - Evaluator 1 (Temperature 0.2)          |
| - Evaluator 2 (Temperature 0.2)          |
| - Evaluator 3 (Temperature 0.2)          |
| - Majority voting on rubric criteria     |
+--------------------+---------------------+
                     |
         +-----------+-----------+
         |                       |
         v                       v
  [ Score >= 90% ]        [ Score < 90% ]
  Unlock Tier n+1         Retain Tier n
```

### Positive Consequences
* Completely deterministic, auditable scoring free of single-shot prompt drift.
* Clear, timestamped evidence clips mapped directly to rubric criteria.
