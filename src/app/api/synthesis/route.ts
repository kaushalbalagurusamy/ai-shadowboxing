import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';
import { geminiModel } from '@/lib/gemini';
import { SchemaType } from '@google/generative-ai';
import { conversationIdSchema } from '@/lib/schemas';
import { fetchAndIngestTavusConversation } from '@/lib/tavusSync';
import { 
  getTierDefinition, 
  getDefaultUserProgressState, 
  UserProgressState 
} from '@/lib/skillTree';

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
        clips: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              speech_offset_seconds: { type: SchemaType.NUMBER },
              clip_start_time: { type: SchemaType.NUMBER },
              clip_end_time: { type: SchemaType.NUMBER },
              label: { type: SchemaType.STRING },
            },
            required: ["speech_offset_seconds", "clip_start_time", "clip_end_time", "label"],
          },
        },
      },
      required: ["system_instruction", "highlights", "clips"],
    },
    partner_prompt_p1: {
      type: SchemaType.OBJECT,
      properties: {
        system_instruction: { type: SchemaType.STRING },
        focus_area: { type: SchemaType.STRING },
      },
      required: ["system_instruction", "focus_area"],
    },
    tier_baselines: {
      type: SchemaType.OBJECT,
      properties: {
        tier_1: { type: SchemaType.INTEGER },
        tier_2: { type: SchemaType.INTEGER },
        tier_3: { type: SchemaType.INTEGER },
        tier_4: { type: SchemaType.INTEGER },
        tier_5: { type: SchemaType.INTEGER },
      },
      required: ["tier_1", "tier_2", "tier_3", "tier_4", "tier_5"],
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
    "tier_baselines",
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

  // Load current user progress state (or default to Tier 1)
  const existingProgress: UserProgressState = 
    (await insightStore.getMetadata(conversationId, 'user_progress_state')) || getDefaultUserProgressState();
  const currentTierLevel = existingProgress.active_tier || 1;
  const currentTierDef = getTierDefinition(currentTierLevel);

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

  // --- PASS 2: CURRICULUM-BOUND MAJ@3 ENSEMBLE ---
  const coachPrompt = `
    You are the "Head Coach & Skill Tree Evaluator" of the AI Shadowboxing simulator. You perform forensic audits of user social dynamics against an explicit 5-Tier Curriculum Ladder.

    ### ACTIVE SKILL TREE TIER:
    Level ${currentTierDef.level}: ${currentTierDef.name}
    Pillar Focus: ${currentTierDef.focusPillar}
    Description: ${currentTierDef.description}

    TARGET TIER 10-ITEM RUBRIC CRITERIA:
    ${JSON.stringify(currentTierDef.targetRubricItems, null, 2)}

    ### INPUT DATA:
    1. THE MASTER PERFORMANCE LOG:
    ${masterLog}

    2. KNOWLEDGE BASE & ADDITIONAL RUBRICS:
    ${knowledgeBase || "Default rubrics: EQ, IQ, Wealth, Physique."}

    ---

    ### INSTRUCTIONS & EVALUATION STEPS:

    1. VALUE LEAK AUDIT:
       - Identify the user's "Single Greatest Weakness" (the \`value_leak_identified\`) relative to the active tier (${currentTierDef.name}). Populate \`audit.primary_weakness\` and \`audit.rationale\`.
       - Assign 1-10 scores for EQ, IQ, Wealth, and Physique in \`audit.scores\`.

    2. CHAIN-OF-THOUGHT RUBRIC EVALUATION (10 Localized Criteria):
       - Generate an array of EXACTLY 10 binary criteria (Yes/No) strictly anchored to the active tier targets (${currentTierDef.name}).
       - For each item, populate \`criterion\`, \`timestamp_reference\`, and \`multimodal_evidence\` (citing exact Raven cues or transcript lines) BEFORE outputting the boolean \`pass\`.

    3. DETERMINISTIC SCORE & 90% GATEWAY:
       - Calculate \`final_score\` strictly as (number of true \`pass\` values * 10).
       - Set \`passed = true\` IF AND ONLY IF \`final_score >= 90\`. Otherwise \`passed = false\`.

    4. MENTOR PROMPT & SYNCHRONIZED CLIPS GENERATION (M1):
       - Shell: "Prepend <emotion value='content'/> to your debrief. You are Darius, an elite executive charisma & dating mentor. You utilize a disarming, cool, collected tone, similar to Chris Voss' late-night FM DJ voice. Your feedback is absolute, calm, and non-negotiable."
       - Length Constraint: STRICT MAXIMUM OF 75 WORDS (MUST be deliverable aloud in under 30 seconds).
       - Instructions:
         - If passed (>=90): Commend Tier ${currentTierLevel} graduation and introduce Tier ${Math.min(5, currentTierLevel + 1)} expectations.
         - If failed (<90): Deconstruct the specific Tier ${currentTierLevel} Value Leak blocking the 90% gate and give 1 practical fix for the retry.
         - Reference specific timestamps or Turn IDs from the log.
       - Structured Video Clips: Map 1-2 key timestamp references from the session log to speech offsets in your debrief into \`clips\` so the main stage video player auto-plays the recorded session clip synchronized with your speech:
         - \`speech_offset_seconds\`: e.g. 5.0 (number of seconds into your speech when you mention the moment)
         - \`clip_start_time\`: e.g. 12.5 (start second in session video)
         - \`clip_end_time\`: e.g. 18.0 (end second in session video)
         - \`label\`: e.g. "Posture Breakdown" (short 2-4 word description)

    5. NEXT PARTNER PROMPT GENERATION (P1):
       - Base Partner Shell: "${currentTierDef.partnerBasePrompt}"
       - Instructions: Require explicit <emotion value='...'> tags in prompt rules (<emotion value='neutral'/>, <emotion value='contempt'/>, <emotion value='disgusted'/>, <emotion value='content'/>, <emotion value='surprised'/>, <emotion value='excited'/>).
       - If passed (>=90): Generate Level P(n+1) system prompt advancing to Tier ${Math.min(5, currentTierLevel + 1)} partner dynamics (~150-200 words).
       - If failed (<90): Generate Level P(n) retry prompt that naturally stress-tests the specific Tier ${currentTierLevel} \`value_leak_identified\` (~150-200 words).

    6. MULTI-TIER BACKGROUND BASELINES:
       - Evaluate an estimated performance score (0 to 100) for ALL 5 Tiers simultaneously in \`tier_baselines\` (\`tier_1\`, \`tier_2\`, \`tier_3\`, \`tier_4\`, \`tier_5\`) based on observed cues across the entire date.
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

  // Persistent Skill Tree Ladder State Transition
  const updatedProgress: UserProgressState = JSON.parse(JSON.stringify(existingProgress));

  // Multi-tier background baseline updates across all 5 tiers
  if (medianRun.tier_baselines) {
    [1, 2, 3, 4, 5].forEach((lvl) => {
      const k = `tier_${lvl}`;
      const baseScore = Number(medianRun.tier_baselines[k] || 0);
      if (!updatedProgress.tier_history[k]) {
        updatedProgress.tier_history[k] = {
          status: updatedProgress.unlocked_tiers.includes(lvl) ? (lvl === updatedProgress.active_tier ? 'IN_PROGRESS' : 'UNLOCKED') : 'LOCKED',
          best_score: baseScore,
          attempts: 0,
          passed: false,
        };
      } else {
        updatedProgress.tier_history[k].best_score = Math.max(updatedProgress.tier_history[k].best_score || 0, baseScore);
      }
    });
  }

  const currentKey = `tier_${currentTierLevel}`;
  const currentRecord = updatedProgress.tier_history[currentKey] || { status: 'IN_PROGRESS', best_score: 0, attempts: 0, passed: false };
  currentRecord.attempts = (currentRecord.attempts || 0) + 1;
  currentRecord.best_score = Math.max(currentRecord.best_score || 0, medianScore);

  if (isPassed) {
    currentRecord.passed = true;
    currentRecord.status = 'PASSED';
    const nextTierLevel = Math.min(5, currentTierLevel + 1);
    if (!updatedProgress.unlocked_tiers.includes(nextTierLevel)) {
      updatedProgress.unlocked_tiers.push(nextTierLevel);
    }
    updatedProgress.active_tier = nextTierLevel;
    updatedProgress.active_tier_name = getTierDefinition(nextTierLevel).name;
    const nextKey = `tier_${nextTierLevel}`;
    if (!updatedProgress.tier_history[nextKey] || updatedProgress.tier_history[nextKey].status === 'LOCKED') {
      updatedProgress.tier_history[nextKey] = {
        status: 'IN_PROGRESS',
        best_score: updatedProgress.tier_history[nextKey]?.best_score || 0,
        attempts: 0,
        passed: false,
      };
    }
  } else {
    currentRecord.status = 'IN_PROGRESS';
  }
  updatedProgress.tier_history[currentKey] = currentRecord;

  // Persist skill tree progress state to Supabase
  await insightStore.setMetadata(conversationId, 'user_progress_state', updatedProgress);

  const synthesisResult = {
    ...medianRun,
    median_score: medianScore,
    ensemble_scores: ensembleScores,
    passed: isPassed,
    user_progress_state: updatedProgress,
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
