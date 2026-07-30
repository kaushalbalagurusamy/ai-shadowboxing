import { NextResponse } from 'next/server';
import { mentorChatSchema } from '@/lib/schemas';
import { insightStore } from '@/lib/insightStore';
import { geminiModel } from '@/lib/gemini';
import { logger } from '@/lib/telemetry';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = mentorChatSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid payload", details: parseResult.error.format() }, { status: 400 });
    }

    const { conversationId, userMessage, history } = parseResult.data;
    const reqLogger = logger.child({ conversationId, event: "mentor_chat" });
    reqLogger.info("Interactive mentor chat request received");

    // Fetch synthesis data and insights for context anchoring
    const synthesis = await insightStore.getMetadata(conversationId, 'session_synthesis');
    const insights = await insightStore.getInsights(conversationId);

    const transcriptTurns = insights.filter((i) => i.type === 'transcript_turn');
    const behavioralCues = insights.filter((i) => i.type === 'behavioral_cue');

    const systemContext = `You are M1, an elite executive charisma & dating mentor. You are currently debriefing your client post-date.
    
CLIENT SESSION SYNTHESIS DATA:
${synthesis ? JSON.stringify(synthesis, null, 2) : "Synthesis pending..."}

BEHAVIORAL CUES LOGGED:
${behavioralCues.map((c) => `[${c.category || 'General'}] (${c.signalType}): ${c.reason}`).join('\n')}

RECENT TRANSCRIPT SAMPLE:
${transcriptTurns.slice(-10).map((t) => `${t.role}: ${t.text}`).join('\n')}

INSTRUCTIONS:
1. Respond to the client's question as M1, their direct, highly perceptive executive mentor.
2. Reference specific timestamps, behavioral cues, or transcript lines when relevant.
3. Be constructive, razor-sharp, and actionable. Keep your response under 3 concise paragraphs.`;

    const chatHistory = history || [];
    const formattedHistory = chatHistory.map((h) => `${h.role === 'user' ? 'Client' : 'M1 Mentor'}: ${h.content}`).join('\n');

    const prompt = `${systemContext}\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nClient: ${userMessage}\n\nM1 Mentor:`;

    const response = await geminiModel.generateContent(prompt);
    const reply = response.response.text();

    return NextResponse.json({
      success: true,
      reply,
    });

  } catch (error: unknown) {
    logger.error("Mentor chat endpoint error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
