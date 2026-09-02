# ADR 0004: Interactive Debrief with Evidence Clip Playback

* **Status**: Accepted & Implemented
* **Date**: 2026-09-02
* **Deciders**: Frontend & AI Experience Team

---

## Context & Problem Statement

Reading static text reports after an emotional, high-stakes conversational simulation has poor pedagogical retention. Users learn significantly faster when walking through their exact conversational mistakes with a mentor avatar who plays back synchronized video clips with automated audio ducking.

---

## Decision Drivers

1. **Multi-Modal Debrief Stage**: 70% video stage featuring timestamped playback of critical moments alongside 30% mentor avatar presence.
2. **Audio Ducking**: Automatically attenuating background date audio by $-18\text{dB}$ when the mentor speaks during clip breakdowns.
3. **Conversational Q&A**: Real-time text chat enabling users to ask the mentor specific tactical questions about alternative responses.

---

## Decision Outcome

Implement `MentorTab.tsx` and `MentorChatContainer.tsx`:

* **Evidence Clip Player**: Automatically seeks to flagged behavioral timestamps (e.g. eye contact breaks, nervous apologies, conversational stalls).
* **Audio Ducking Engine**: Web Audio API GainNode ducking session playback when the mentor voice stream is active.
* **Interactive Mentor API (`/api/mentor/chat`)**: Contextual endpoint loaded with session insights, rubric notes, and persona details for grounded tactical advice.

### Positive Consequences
* High-impact multi-sensory feedback loop that dramatically accelerates communication skill acquisition.
