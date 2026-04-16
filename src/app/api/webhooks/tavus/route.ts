import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("TAVUS WEBHOOK RECEIVED:", JSON.stringify(payload, null, 2));

    const { event_type, properties } = payload;
    const conversationId = properties.conversation_id;

    if (!conversationId) return NextResponse.json({ received: true });

    if (event_type === "system.shutdown") {
      // Session ended. Store the final analysis.
      insightStore.addInsight(conversationId, {
        type: "session_summary",
        analysis: properties.perception_analysis, // This contains the answers to the queries
        recordingUrl: properties.recording_url,
        timestamp: new Date().toISOString()
      });
    }

    if (event_type === "conversation.perception_tool_call") {
      // Real-time signal
      const { function_name, arguments: args } = properties;
      
      if (function_name === "log_behavioral_signal") {
        insightStore.addInsight(conversationId, {
          type: "behavioral_cue",
          category: args.category,
          signalType: args.signal_type,
          reason: args.reason,
          timestamp: properties.timestamp,
          imageFrame: properties.image_frame
        });
      } else {
        // Fallback for any other tools
        insightStore.addInsight(conversationId, {
          type: "behavioral_cue",
          reason: args?.reason || "Observation detected",
          timestamp: properties.timestamp,
          imageFrame: properties.image_frame
        });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
