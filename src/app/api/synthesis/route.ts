import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';
import { geminiModel } from '@/lib/gemini';
import { SchemaType } from '@google/generative-ai';
import { conversationIdSchema } from '@/lib/schemas';
import { fetchAndIngestTavusConversation } from '@/lib/tavusSync';

const coachSchema = {
  type: SchemaType.OBJECT,
  properties: {
    value_leak_identified: { type: SchemaType.STRING },
    rubric_evaluations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          criterion: { type: SchemaType.STRING },
          timestamp_reference: { type: SchemaType.STRING },
          multimodal_evidence: { type: SchemaType.STRING },
          pass: { type: SchemaType.BOOLEAN },
        },
        required: ["criterion", "timestamp_reference", "multimodal_evidence", "pass"],
      },
    },
    final_score: { type: SchemaType.INTEGER },
    passed: { type: SchemaType.BOOLEAN },
    audit: {
      type: SchemaType.OBJECT,
      properties: {
        scores: {
          type: SchemaType.OBJECT,
          properties: {
            EQ: { type: SchemaType.NUMBER },
            IQ: { type: SchemaType.NUMBER },
            Wealth: { type: SchemaType.NUMBER },
            Physique: { type: SchemaType.NUMBER },
          },
          required: ["EQ", "IQ", "Wealth", "Physique"],
        },
        primary_weakness: { type: SchemaType.STRING },
        rationale: { type: SchemaType.STRING },
      },
      required: ["scores", "primary_weakness", "rationale"],
    },
    mentor_prompt_m1: {
      type: SchemaType.OBJECT,
      properties: {
        system_instruction: { type: SchemaType.STRING },
        highlights: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING },
              reason: { type: SchemaType.STRING },
              timestamp: { type: SchemaType.STRING },
              turn_id: { type: SchemaType.STRING },
            },
            required: ["type", "reason"],
          },
        },
      },
      required: ["system_instruction", "highlights"],
    },
    partner_prompt_p1: {
      type: SchemaType.OBJECT,
      properties: {
        system_instruction: { type: SchemaType.STRING },
        focus_area: { type: SchemaType.STRING },
      },
      required: ["system_instruction", "focus_area"],
    },
  },
  required: [
    "value_leak_identified",
    "rubric_evaluations",
    "final_score",
    "passed",
    "audit",
    "mentor_prompt_m1",
    "partner_prompt_p1",
  ],
};

export async function executeSynthesis(conversationId: string) {
  // Actively pull latest transcript, perception analysis, and behavioral cues from Tavus API
  await fetchAndIngestTavusConversation(conversationId);

  const insights = await insightStore.getInsights(conversationId);
  const knowledgeBase = await insightStore.getMetadata(conversationId, 'knowledge_base');
  
  if (insights.length === 0) {
    throw new Error("No data found for this session after Tavus API sync.");
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
  await insightStore.setMetadata(conversationId, 'master_performance_log', masterLog);

  // --- PASS 2: DETERMINISTIC MAJ@3 PARALLEL ENSEMBLE ---
  const coachPrompt = `
    You are the "Head Coach & Progression Evaluator" of the AI Shadowboxing simulator. You perform forensic audits of user social dynamics against strict high-value rubrics (EQ, IQ, Wealth, Physique).

    ### INPUT DATA:
    1. THE MASTER PERFORMANCE LOG:
    ${masterLog}

    2. KNOWLEDGE BASE & RUBRICS:
    ${knowledgeBase || "Default rubrics: EQ, IQ, Wealth, Physique."}

    ---

    ### INSTRUCTIONS & EVALUATION STEPS:

    1. VALUE LEAK AUDIT:
       - Identify the user's "Single Greatest Weakness" (the \`value_leak_identified\`) that caused the date to lose interest. Populate \`audit.primary_weakness\` and \`audit.rationale\`.
       - Assign 1-10 scores for EQ, IQ, Wealth, and Physique in \`audit.scores\`.

    2. CHAIN-OF-THOUGHT RUBRIC EVALUATION (10 Localized Criteria):
       - Generate an array of EXACTLY 10 binary criteria (Yes/No) specifically tailored to stress-test the \`value_leak_identified\`.
       - For each item, populate \`criterion\`, \`timestamp_reference\`, and \`multimodal_evidence\` (citing exact Raven cues or transcript lines) BEFORE outputting the boolean \`pass\`.

    3. DETERMINISTIC SCORE & 90% GATEWAY:
       - Calculate \`final_score\` strictly as (number of true \`pass\` values * 10).
       - Set \`passed = true\` IF AND ONLY IF \`final_score >= 90\`. Otherwise \`passed = false\`.

    4. MENTOR PROMPT GENERATION (M1):
       - Shell: "You are Darius, an elite executive charisma & dating mentor. You utilize a disarming, cool, collected tone, similar to Chris Voss' late-night FM DJ voice. Your feedback is absolute, calm, and non-negotiable."
       - Length Constraint: STRICT MAXIMUM OF 75 WORDS (MUST be deliverable aloud in under 30 seconds).
       - Instructions:
         - Affirm 1-2 high-value moments.
         - Surgically deconstruct \`value_leak_identified\` and provide 1 practical fix for their next session.
         - Reference specific timestamps or Turn IDs from the log.
         - Conclude by opening the floor for client questions.

    5. NEXT PARTNER PROMPT GENERATION (P1):
       - Shell: "You are a very attractive mid 20s woman (working a 500k corporate lawyer job in NYC) on a first date in a coffee shop."
       - If passed (>=90): Generate Level P(n+1) system prompt introducing higher difficulty dynamics (~150-200 words).
       - If failed (<90): Generate Level P(n) retry prompt that naturally stress-tests the specific \`value_leak_identified\` (~150-200 words).
  `;

  // Helper for single thread evaluation with 1 auto-retry
  const executeEvaluationThread = async () => {
    try {
      const res = await geminiModel.generateContent(coachPrompt, {
        responseMimeType: "application/json",
        responseSchema: coachSchema as any,
      });
      return JSON.parse(res.response.text());
    } catch {
      // Retry once on thread failure
      const retryRes = await geminiModel.generateContent(coachPrompt, {
        responseMimeType: "application/json",
        responseSchema: coachSchema as any,
      });
      return JSON.parse(retryRes.response.text());
    }
  };

  // Execute maj@3 parallel ensemble (3 concurrent promises)
  const ensembleRuns = await Promise.all([
    executeEvaluationThread(),
    executeEvaluationThread(),
    executeEvaluationThread(),
  ]);

  // Sort runs by final_score ascending to find median (index 1)
  ensembleRuns.sort((a, b) => (a.final_score ?? 0) - (b.final_score ?? 0));
  const medianRun = ensembleRuns[1];
  const ensembleScores = ensembleRuns.map((r) => r.final_score ?? 0);
  const medianScore = medianRun.final_score ?? 0;
  const isPassed = medianScore >= 90;

  const synthesisResult = {
    ...medianRun,
    median_score: medianScore,
    ensemble_scores: ensembleScores,
    passed: isPassed,
    // Backwards compatibility aliases
    mentor_prompt: medianRun.mentor_prompt_m1,
    next_partner_prompt: medianRun.partner_prompt_p1,
  };

  // Store synthesis results
  await insightStore.setMetadata(conversationId, 'session_synthesis', synthesisResult);

  return {
    masterPerformanceLog: masterLog,
    synthesis: synthesisResult,
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = conversationIdSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid payload", details: parseResult.error.format() }, { status: 400 });
    }

    const { conversationId } = parseResult.data;
    const result = await executeSynthesis(conversationId);
    
    return NextResponse.json({ 
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error("Synthesis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
