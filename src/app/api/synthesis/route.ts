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
    const knowledgeBase = insightStore.getMetadata(conversationId, 'knowledge_base');
    
    if (insights.length === 0) {
      return NextResponse.json({ error: "No data found for this session." }, { status: 404 });
    }

    // --- PASS 1: THE ZIPPER (Context Distillation) ---
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
    `;

    const zipperResult = await geminiModel.generateContent(zipperPrompt);
    const masterLog = zipperResult.response.text();

    // Store distilled log
    insightStore.setMetadata(conversationId, 'master_performance_log', masterLog);

    // --- PASS 2: THE COACH (Synthesis) ---
    const coachPrompt = `
      You are the "Head Coach" of the AI Shadowboxing simulator. You are an expert in behavioral psychology, high-stakes social dynamics, and the "4 Pillars of High Value" (EQ, IQ, Wealth, and Physique).

      ### INPUT DATA:
      1. THE MASTER PERFORMANCE LOG:
      ${masterLog}

      2. THE KNOWLEDGE BASE (RUBRICS):
      ${knowledgeBase || "Default rubrics: EQ, IQ, Wealth, Physique."}

      ---

      ### TASK 1: The Forensic Audit
      Analyze the Master Performance Log. Assign a score (1-10) for each pillar based on the user's performance. Identify the "Single Greatest Weakness" (the "Value Leak") that most significantly caused the date to lose interest.

      ### TASK 2: Generate the Mentor Prompt (M1)
      Create a system prompt for a Tavus Mentor. 
      - The Shell: "You are the Shadowboxing Head Coach. You are elite, observant, and your goal is to turn this user into a high-value man. Your tone is direct and clinical, yet affirming."
      - Instructions: 
        1. Affirm two specific moments where the user displayed high value.
        2. Surgically deconstruct the One Key Weakness. Explain exactly how it triggered a low-interest response from the date.
      - Video Metadata (Hidden): In your response, provide a list of "Clip Highlights." For every strength or weakness you mention, include the exact ISO timestamp or Turn ID from the log.

      ### TASK 3: Generate the Next Partner Prompt (P1)
      Create a system prompt for the next Tavus Sparring Partner.
      - The Shell: "You are an attractive woman on a first date. You are high-value and your time is precious. You are initially standoffish and have a screening tone."
      - Evolutionary Instruction: The partner must naturally "stress test" the specific Value Leak identified in the previous session. 
      - Implementation: If the weakness was IQ/Wealth, she should be intellectually demanding or unimpressed by surface-level material claims. If the weakness was Physique/EQ, she should call out fidgeting or lack of presence immediately in the flow of conversation. 
      - Length Constraint: Keep the prompt length similar to the original P0 prompt (~150-200 words).

      ---

      ### REQUIRED RETURN FORMAT (JSON)
      Return ONLY a valid JSON object. Do not include markdown code blocks.
      {
        "audit": {
          "scores": { "EQ": 0, "IQ": 0, "Wealth": 0, "Physique": 0 },
          "primary_weakness": "string",
          "rationale": "string"
        },
        "mentor_prompt": {
          "system_instruction": "string",
          "highlights": [
            { "type": "strength/weakness", "reason": "string", "timestamp": "ISO", "turn_id": "string" }
          ]
        },
        "next_partner_prompt": {
          "system_instruction": "string",
          "focus_area": "string"
        }
      }
    `;

    const coachResult = await geminiModel.generateContent(coachPrompt);
    const coachDataRaw = coachResult.response.text();
    
    // Attempt to parse JSON (cleaning potential markdown wrapper if Gemini adds it)
    const jsonMatch = coachDataRaw.match(/\{[\s\S]*\}/);
    const coachData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(coachDataRaw);

    // Store synthesis results
    insightStore.setMetadata(conversationId, 'session_synthesis', coachData);
    
    return NextResponse.json({ 
      success: true,
      masterPerformanceLog: masterLog,
      synthesis: coachData
    });

  } catch (error: any) {
    console.error("Synthesis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
