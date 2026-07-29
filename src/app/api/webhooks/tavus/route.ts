import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';
import crypto from 'crypto';

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
        console.warn("UNAUTHORIZED TAVUS WEBHOOK REJECTED: Invalid signature");
        return NextResponse.json({ error: "Unauthorized: Invalid webhook signature" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn("WARNING: TAVUS_WEBHOOK_SECRET environment variable is missing in production.");
    }

    const payload = JSON.parse(rawBody);
    // Use the conversationId from the top level or properties
    const conversationId = payload.conversation_id || payload.properties?.conversation_id;
    const event_type = payload.event_type;
    const properties = payload.properties || {};

    console.log(`TAVUS WEBHOOK [${event_type}] RECEIVED for ${conversationId}`);

    if (!conversationId) {
      console.warn("TAVUS WEBHOOK RECEIVED WITHOUT conversation_id:", JSON.stringify(payload));
      return NextResponse.json({ received: true, warning: "no conversation_id" });
    }

    if (event_type === "system.shutdown") {
      // Session ended. Upload the video if available.
      let finalRecordingUrl = properties.recording_url;
      if (finalRecordingUrl) {
        finalRecordingUrl = await insightStore.uploadVideo(conversationId, finalRecordingUrl);
      }

      // Store the final analysis.
      await insightStore.addInsight(conversationId, {
        type: "session_summary",
        analysis: properties.perception_analysis,
        recordingUrl: finalRecordingUrl,
        timestamp: new Date().toISOString()
      });

      // Event-Driven Synthesis: Trigger 2-pass synthesis automatically on backend event
      try {
        const { executeSynthesis } = await import('@/app/api/synthesis/route');
        await executeSynthesis(conversationId);
        console.log(`EVENT-DRIVEN BACKEND SYNTHESIS SUCCESSFUL for ${conversationId}`);
      } catch (synthErr: any) {
        console.error(`Backend Synthesis Error for ${conversationId}:`, synthErr.message);
      }
    }

    // Handle both individual utterances and full transcription ready events
    if (event_type === "conversation.utterance") {
      await insightStore.addInsight(conversationId, {
        type: "transcript_turn",
        role: properties.role,
        text: properties.text,
        timestamp: properties.timestamp || new Date().toISOString()
      });
    } else if (event_type === "application.transcription_ready") {
      const transcript = properties.transcript || [];
      for (const turn of transcript) {
        await insightStore.addInsight(conversationId, {
          type: "transcript_turn",
          role: turn.role === 'replica' ? 'assistant' : turn.role,
          text: turn.text,
          timestamp: turn.timestamp || new Date().toISOString()
        });
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

    // Agentic Termination Handler
    if (event_type === "conversation.tool_call" && properties.function_name === "end_conversation") {
      const reason = properties.arguments?.reason || "No reason provided";
      console.log(`AGENT REQUESTED HANG UP: ${reason} for ${conversationId}`);
      
      // 1. Log the termination as a definitive "Value Leak" behavioral cue
      await insightStore.addInsight(conversationId, {
        type: "behavioral_cue",
        category: "Final Outcome",
        signalType: "negative",
        reason: `Date terminated by AI: ${reason}`,
        timestamp: new Date().toISOString()
      });

      // 2. Actually kill the call via Tavus API
      const apiKey = process.env.TAVUS_API_KEY;
      if (apiKey) {
        await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
          method: "POST",
          headers: { "x-api-key": apiKey }
        });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
