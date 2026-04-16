import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';
import { geminiModel } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const insights = insightStore.getInsights(conversationId);
    
    if (insights.length === 0) {
      return NextResponse.json({ error: "No data found for this session." }, { status: 404 });
    }

    // Pass 1: The Zipper (Distillation)
    // Gather streams
    const transcript = insights.filter(i => i.type === 'transcript_turn');
    const toolCalls = insights.filter(i => i.type === 'behavioral_cue');
    const finalAnalysis = insights.find(i => i.type === 'session_summary');

    const zipperPrompt = `
      You are "The Zipper," a high-fidelity context distillation agent.
      Your goal is to interleave three disparate data streams from a "First Date" sparring session into a single, cohesive Master Performance Log in Markdown format.

      ### INPUT DATA:
      1. TRANSCRIPT (Dialogue):
      ${JSON.stringify(transcript, null, 2)}

      2. BEHAVIORAL CUES (Real-time observations):
      ${JSON.stringify(toolCalls, null, 2)}

      3. FINAL ANALYSIS (Raven's summary):
      ${JSON.stringify(finalAnalysis?.analysis || {}, null, 2)}

      ### TASK:
      - Interleave the Transcript and Behavioral Cues chronologically using their timestamps.
      - Align cues with the specific dialogue turn they occurred during or immediately after.
      - Denoise: If multiple identical cues occur in a row, collapse them into a single duration-based observation.
      - Categorize every observation using the High-Value rubrics: EQ, IQ, Wealth, and Physique.
      - At the end of the log, append the "Final Analysis" answers as a "Post-Session Report."

      ### OUTPUT FORMAT:
      Return ONLY the Markdown document. Use a professional, clinical, yet forensic tone. 
      Example format:
      [00:05] Partner: "Hi, I'm Luna."
      [00:06] User: "Hey... I'm John."
      > [Raven Note - EQ: Negative]: User displayed nervous laughter and a slight stutter during introduction.
    `;

    const result = await geminiModel.generateContent(zipperPrompt);
    const masterLog = result.response.text();

    // Store the distilled log as metadata
    insightStore.setMetadata(conversationId, 'master_performance_log', masterLog);
    
    // For now, in Phase 2 Step 3A, we return this as the "Mentor Transmission"
    return NextResponse.json({ 
      success: true,
      masterPerformanceLog: masterLog 
    });

  } catch (error: any) {
    console.error("Synthesis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
