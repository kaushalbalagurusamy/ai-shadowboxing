import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';
import { logger } from '@/lib/telemetry';
import { fetchAndIngestTavusConversation, extractTextFromTurn, extractRoleFromTurn } from '@/lib/tavusSync';
import crypto from 'crypto';

// Pre-allocated static response instances to minimize heap allocation churn (L11 Principle)
const RESP_SUCCESS = NextResponse.json({ received: true });
const RESP_UNAUTHORIZED = NextResponse.json({ error: "Unauthorized: Invalid webhook signature" }, { status: 401 });
const RESP_MISSING_CONVERSATION = NextResponse.json({ received: true, warning: "no conversation_id" });

function verifyTavusSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signatureHeader);
    const compBuffer = Buffer.from(computedSignature);

    if (sigBuffer.length !== compBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, compBuffer);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.TAVUS_WEBHOOK_SECRET;
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-tavus-signature') || req.headers.get('x-signature');

    if (webhookSecret) {
      const isValid = verifyTavusSignature(rawBody, signatureHeader, webhookSecret);
      if (!isValid) {
        logger.warn("Unauthorized Tavus webhook rejected: Invalid signature");
        return RESP_UNAUTHORIZED;
      }
    } else if (process.env.NODE_ENV === 'production') {
      logger.warn("TAVUS_WEBHOOK_SECRET missing in production context");
    }

    const payload = JSON.parse(rawBody);
    const conversationId = payload.conversation_id || payload.properties?.conversation_id;
    const event_type = payload.event_type;
    const properties = payload.properties || {};

    const reqLogger = logger.child({ conversationId, eventType: event_type });
    reqLogger.info(`Tavus webhook payload received`);

    if (!conversationId) {
      logger.warn("Tavus webhook received without conversationId", { payload });
      return RESP_MISSING_CONVERSATION;
    }

    if (event_type === "system.shutdown") {
      let finalRecordingUrl = properties.recording_url;
      if (finalRecordingUrl) {
        finalRecordingUrl = await insightStore.uploadVideo(conversationId, finalRecordingUrl);
      }

      await insightStore.addInsight(conversationId, {
        type: "session_summary",
        analysis: properties.perception_analysis,
        recordingUrl: finalRecordingUrl,
        timestamp: new Date().toISOString()
      });

      // Active pull fallback from Tavus API to guarantee transcript turns are present before synthesis
      await fetchAndIngestTavusConversation(conversationId);

      try {
        const { executeSynthesis } = await import('@/app/api/synthesis/route');
        await executeSynthesis(conversationId);
        reqLogger.info(`Event-driven backend synthesis completed successfully`);
      } catch (synthErr: unknown) {
        reqLogger.error(`Event-driven backend synthesis failed`, synthErr);
      }
    }

    if (event_type === "conversation.utterance") {
      const text = extractTextFromTurn(properties);
      if (text) {
        await insightStore.addInsight(conversationId, {
          type: "transcript_turn",
          role: extractRoleFromTurn(properties),
          text,
          timestamp: properties.timestamp || new Date().toISOString()
        });
      }
    } else if (event_type === "application.transcription_ready") {
      const transcript = properties.transcript || properties.text || properties.turns || [];
      if (Array.isArray(transcript)) {
        const turnsToInsert = transcript
          .map((turn: any) => ({
            type: "transcript_turn",
            role: extractRoleFromTurn(turn),
            text: extractTextFromTurn(turn),
            timestamp: turn.timestamp ? (typeof turn.timestamp === 'number' ? new Date(turn.timestamp * 1000).toISOString() : new Date(turn.timestamp).toISOString()) : new Date().toISOString()
          }))
          .filter((t: any) => Boolean(t.text));

        if (turnsToInsert.length > 0) {
          await insightStore.addInsightsMany(conversationId, turnsToInsert);
        }
      }
    }

    if (event_type === "conversation.perception_tool_call") {
      const { function_name, arguments: args } = properties;
      
      if (function_name === "log_behavioral_signal") {
        await insightStore.addInsight(conversationId, {
          type: "behavioral_cue",
          category: args.category,
          signalType: args.signal_type,
          reason: args.reason,
          timestamp: properties.timestamp,
          imageFrame: properties.image_frame
        });
      } else {
        await insightStore.addInsight(conversationId, {
          type: "behavioral_cue",
          reason: args?.reason || "Observation detected",
          timestamp: properties.timestamp,
          imageFrame: properties.image_frame
        });
      }
    }

    if (event_type === "conversation.tool_call" && properties.function_name === "end_conversation") {
      const reason = properties.arguments?.reason || "No reason provided";
      reqLogger.info(`Agent requested hangup: ${reason}`);
      
      await insightStore.addInsight(conversationId, {
        type: "behavioral_cue",
        category: "Final Outcome",
        signalType: "negative",
        reason: `Date terminated by AI: ${reason}`,
        timestamp: new Date().toISOString()
      });

      const apiKey = process.env.TAVUS_API_KEY;
      if (apiKey) {
        await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
          method: "POST",
          headers: { "x-api-key": apiKey }
        });
      }
    }

    return RESP_SUCCESS;

  } catch (error: unknown) {
    logger.error("Tavus webhook handler error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

