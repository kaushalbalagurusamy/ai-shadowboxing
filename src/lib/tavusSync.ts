import { insightStore, SessionInsight } from './insightStore';
import { logger } from './telemetry';

export function extractTextFromTurn(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  const rawText = item.text ?? item.content ?? item.message ?? item.utterance ?? item.transcript ?? item.statement ?? item.speech ?? item.dialogue ?? '';
  return typeof rawText === 'string' ? rawText.trim() : String(rawText).trim();
}

export function extractRoleFromTurn(item: any): 'user' | 'assistant' {
  if (!item) return 'user';
  const role = String(item.role || item.speaker || item.sender || '').toLowerCase();
  if (role === 'replica' || role === 'assistant' || role === 'agent' || role === 'bot' || role === 'ai') {
    return 'assistant';
  }
  return 'user';
}

export async function fetchAndIngestTavusConversation(conversationId: string): Promise<boolean> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    logger.warn("TAVUS_API_KEY missing, skipping active Tavus API fetch", { conversationId });
    return false;
  }

  try {
    logger.info(`Actively querying Tavus API GET /v2/conversations/${conversationId}?verbose=true`, { conversationId });
    const res = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}?verbose=true`, {
      method: 'GET',
      headers: { "x-api-key": apiKey }
    });

    if (!res.ok) {
      logger.warn(`Tavus verbose GET returned HTTP ${res.status}`, { conversationId });
      return false;
    }

    const data = await res.json();
    const events = data.events || [];
    const turnsToInsert: SessionInsight[] = [];
    let sessionSummary: SessionInsight | null = null;

    // 1. Ingest top-level transcript arrays if present on conversation object
    const topLevelTranscript = data.transcript || data.conversation?.transcript || data.messages || data.utterances || [];
    if (Array.isArray(topLevelTranscript) && topLevelTranscript.length > 0) {
      for (const item of topLevelTranscript) {
        const text = extractTextFromTurn(item);
        if (text) {
          turnsToInsert.push({
            type: 'transcript_turn',
            role: extractRoleFromTurn(item),
            text,
            timestamp: item.timestamp ? (typeof item.timestamp === 'number' ? new Date(item.timestamp * 1000).toISOString() : new Date(item.timestamp).toISOString()) : new Date().toISOString()
          });
        }
      }
    }

    // 2. Process events array
    for (const evt of events) {
      const eventType = evt.event_type || evt.type;
      const props = evt.properties || evt.data || {};

      if (eventType === 'application.transcription_ready') {
        const transcriptArr = props.transcript || props.text || props.turns || props.dialogue || [];
        if (Array.isArray(transcriptArr)) {
          for (const item of transcriptArr) {
            const text = extractTextFromTurn(item);
            if (text) {
              turnsToInsert.push({
                type: 'transcript_turn',
                role: extractRoleFromTurn(item),
                text,
                timestamp: item.timestamp ? (typeof item.timestamp === 'number' ? new Date(item.timestamp * 1000).toISOString() : new Date(item.timestamp).toISOString()) : new Date().toISOString()
              });
            }
          }
        }
      }

      if (eventType === 'conversation.utterance' || eventType === 'utterance') {
        const text = extractTextFromTurn(props);
        if (text) {
          turnsToInsert.push({
            type: 'transcript_turn',
            role: extractRoleFromTurn(props),
            text,
            timestamp: props.timestamp ? new Date(props.timestamp).toISOString() : new Date().toISOString()
          });
        }
      }

      if (eventType === 'application.perception_analysis') {
        sessionSummary = {
          type: 'session_summary',
          analysis: props.perception_analysis || props,
          recordingUrl: props.recording_url || data.recording_url || null,
          timestamp: evt.timestamp || new Date().toISOString()
        };
      }

      if (eventType === 'conversation.perception_tool_call') {
        const fnName = props.function_name;
        const args = props.arguments || {};
        if (fnName === 'log_behavioral_signal') {
          turnsToInsert.push({
            type: 'behavioral_cue',
            category: args.category,
            signalType: args.signal_type,
            reason: args.reason,
            timestamp: props.timestamp || evt.timestamp || new Date().toISOString(),
            imageFrame: props.image_frame
          });
        }
      }
    }

    // 3. Deduplicate turnsToInsert by role + text
    const uniqueTurns: SessionInsight[] = [];
    const seenMap = new Set<string>();

    for (const turn of turnsToInsert) {
      if (turn.type === 'transcript_turn') {
        const key = `${turn.role}:${turn.text}`;
        if (!seenMap.has(key)) {
          seenMap.add(key);
          uniqueTurns.push(turn);
        }
      } else {
        uniqueTurns.push(turn);
      }
    }

    if (uniqueTurns.length > 0) {
      await insightStore.addInsightsMany(conversationId, uniqueTurns);
      logger.info(`Ingested ${uniqueTurns.length} transcript & cue events from Tavus API`, { conversationId });
    }

    if (sessionSummary) {
      await insightStore.addInsight(conversationId, sessionSummary);
      logger.info(`Ingested perception session summary from Tavus API`, { conversationId });
    }

    return true;
  } catch (err) {
    logger.error("Failed to actively ingest Tavus conversation events", err);
    return false;
  }
}
