# ADR 0001: WebRTC Multimodal Conversational Video Pipeline (Tavus CVI v2)

* **Status**: Accepted & Implemented
* **Date**: 2026-09-02
* **Deciders**: AI & Engineering Team

---

## Context & Problem Statement

Realistic conversational simulations require sub-500ms latency, high-fidelity lip-sync, dynamic facial emotion transitions, and real-time visual perception (eye contact, posture, vocal pitch). Traditional multi-stage pipelines (STT $\to$ LLM $\to$ TTS $\to$ Video Lip-Sync) introduce 2,000–3,500ms of lag, destroying conversational presence.

---

## Decision Drivers

1. **Sub-500ms Turnaround**: Native WebRTC audio/video transport directly from the browser to the conversational engine.
2. **Multimodal Perception**: Tracking non-verbal cues in real time (e.g. eye contact, vocal tension, hesitation) without server-side video transcoding overhead.
3. **Dynamic Emotional Avatars**: In-session facial micro-expression control based on user speech and emotional state.

---

## Decision Outcome

Adopt **Tavus Conversational Video Interface (CVI v2)** powered by:

1. **Phoenix-4**: Photorealistic neural replica rendering with inline XML emotion tags (`<emotion value="neutral"/>`, `<emotion value="contempt"/>`, `<emotion value="excited"/>`).
2. **Raven-1**: Multimodal perception layer running concurrent continuous visual queries (eye contact stability, nervous laughter, posture openness).
3. **Sparrow-1**: Audio-native turn detection and interruptibility management (`pal_interruptibility: "low"` for Date, `"none"` for Mentor).
4. **Dual-Registered Tools**: `end_conversation`, `log_behavioral_signal`, `log_incongruence_signal`, and `trigger_evidence_clip` registered across LLM and perception layers.

### Positive Consequences
* Ultra-low-latency bidirectional WebRTC video streaming directly to the browser.
* Real-time behavioral signal extraction without client-side ML model overhead.
