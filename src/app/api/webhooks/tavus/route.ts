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
        analysis: properties.perception_analysis,
        recordingUrl: properties.recording_url,
        timestamp: new Date().toISOString()
      });
    }

    if (event_type === "conversation.perception_tool_call") {
      // Real-time signal
      insightStore.addInsight(conversationId, {
        type: "behavioral_cue",
        reason: properties.arguments?.reason,
        timestamp: properties.timestamp,
        imageFrame: properties.image_frame // Raven provides base64 image here
      });
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
