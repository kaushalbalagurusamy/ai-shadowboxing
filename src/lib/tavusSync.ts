import { insightStore, SessionInsight } from './insightStore';
import { logger } from './telemetry';

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
    if (events.length === 0) {
      logger.warn(`Tavus verbose GET returned 0 events`, { conversationId });
      return false;
    }

    const turnsToInsert: SessionInsight[] = [];
    let sessionSummary: SessionInsight | null = null;

    for (const evt of events) {
      const eventType = evt.event_type || evt.type;
      const props = evt.properties || {};

      if (eventType === 'application.transcription_ready') {
        const transcript = props.transcript || [];
        for (const item of transcript) {
          const role = item.role === 'replica' ? 'assistant' : item.role;
          if (role === 'user' || role === 'assistant') {
            turnsToInsert.push({
              type: 'transcript_turn',
              role,
              text: item.content || item.text,
              timestamp: item.timestamp ? new Date(item.timestamp * 1000).toISOString() : new Date().toISOString()
            });
          }
        }
      }

      if (eventType === 'application.perception_analysis') {
        sessionSummary = {
          type: 'session_summary',
          analysis: props.perception_analysis || props,
          recordingUrl: props.recording_url || null,
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

    if (turnsToInsert.length > 0) {
      await insightStore.addInsightsMany(conversationId, turnsToInsert);
      logger.info(`Ingested ${turnsToInsert.length} transcript & cue events from Tavus API`, { conversationId });
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
