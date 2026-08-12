import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { startSessionSchema, tavusPalResponseSchema } from '@/lib/schemas';
import { personaStore } from '@/lib/personaStore';
import { CANONICAL_MENTOR_FACE_ID, DATE_MAX_CALL_DURATION, MENTOR_MAX_CALL_DURATION } from '@/lib/constants';

// In-memory persona/PAL cache mapping SHA-256 config hash to Tavus pal_id
const personaCache = new Map<string, string>();

async function createTavusPal(apiKey: string, combinedPrompt: string, defaultFaceId?: string): Promise<string> {
  const palRes = await fetch("https://tavusapi.com/v2/pals", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pal_name: "P0_Baseline_Sparring_Partner",
      persona_name: "P0_Baseline_Sparring_Partner",
      default_face_id: defaultFaceId || "r291e545fd67",
      system_prompt: defaultFaceId === CANONICAL_MENTOR_FACE_ID
        ? `${combinedPrompt}\n\nCRITICAL MENTOR DIRECTIVE: Deliver your 45-second 3-phase spoken debrief payload continuously. In Phase 2 (~12s), execute the 'trigger_evidence_clip' tool when referencing video evidence. In Phase 3 (~45s), as soon as you speak your final word of feedback, you MUST immediately call the 'end_conversation' tool with reason 'Mentor Debrief Complete'. Do NOT wait for user input or yield the floor.`
        : `${combinedPrompt}\n\nIMPORTANT: Deliver your entire initial spoken feedback continuously without yielding the floor. Do not pause or yield for user speech until your initial debrief is fully delivered. If the user fails to respond or remains silent for more than 10 seconds after your opening, or if you decide the date is over based on your rubrics, you must verbally excuse yourself and immediately call the 'end_conversation' tool.`,
      pipeline_mode: "full",
      layers: {
        stt: {
          stt_engine: "tavus-parakeet"
        },
        rendering: {
          rendering_model: "phoenix-4",
          tts_emotion_control: true,
        },
        timing: {
          timing_model: "sparrow-1"
        },
        conversational_flow: {
          turn_detection_model: "sparrow-1",
          pal_interruptibility: defaultFaceId === CANONICAL_MENTOR_FACE_ID ? "none" : "low",
          user_speech_detection: defaultFaceId !== CANONICAL_MENTOR_FACE_ID,
        },
        llm: {
          tools: [
            {
              "type": "function",
              "function": {
                "name": "end_conversation",
                "description": "Call this tool immediately when you decide the date is over or upon completing your 45-second debrief.",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "reason": { "type": "string", "description": "The reason for ending the date (e.g., 'User Inactivity', 'Low Interest', 'Mentor Debrief Complete')." }
                  },
                  "required": ["reason"]
                }
              }
            },
            {
              "type": "function",
              "function": {
                "name": "trigger_evidence_clip",
                "description": "Call this tool at the exact moment in your debrief when referencing session video evidence to trigger the ducked video clip on the main stage.",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "start_time": { "type": "number", "description": "Start timestamp in seconds of the recorded session video (e.g. 12.5)." },
                    "end_time": { "type": "number", "description": "End timestamp in seconds of the recorded session video (e.g. 24.5)." },
                    "label": { "type": "string", "description": "Short 2-4 word description of the observed value leak." }
                  },
                  "required": ["start_time", "end_time", "label"]
                }
              }
            },
            {
              "type": "function",
              "function": {
                "name": "log_behavioral_signal",
                "description": "Triggered when observing a clear signal of high or low value (EQ, IQ, wealth, physique) during dialogue turns.",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "category": { "type": "string", "enum": ["EQ", "IQ", "wealth", "physique"] },
                    "signal_type": { "type": "string", "enum": ["positive", "negative"] },
                    "reason": { "type": "string", "description": "Description of the specific signal observed." }
                  },
                  "required": ["category", "signal_type", "reason"]
                }
              }
            },
            {
              "type": "function",
              "function": {
                "name": "log_incongruence_signal",
                "description": "Triggered when the user speaks a confident/high-status line but exhibits nervous non-verbal demeanor (incongruent flex).",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "verbal_claim": { "type": "string", "description": "The verbal line spoken by the user." },
                    "non_verbal_incongruence": { "type": "string", "description": "The conflicting non-verbal signal observed." },
                    "severity": { "type": "string", "enum": ["minor", "major"] }
                  },
                  "required": ["verbal_claim", "non_verbal_incongruence", "severity"]
                }
              }
            }
          ]
        },
        perception: {
          perception_model: "raven-1",
          perception_analysis_queries: [
            "Physique & Presence: Analyze the user's physical presence, posture, and symmetry. Do they exhibit high-value 'physique' markers or do they appear low-energy/unpolished? Reference timestamps of postural shifts.",
            "EQ & Composure: Evaluate the user's EQ specifically in response to your standoffishness. Did they react with nervous laughter/stuttering (low value) or remain calm and fluid (high value)? Map these to specific turns.",
            "IQ & Wealth Inferences: Based on vocabulary, conversational depth, and mentions of career/lifestyle, what is the inferred value? Note any over-compensation or 'bold claims' that feel fabricated vs verified.",
            "Screen-Based Authenticity: Note any screen-related behavior indicating a lack of presence (reading notes, looking at other monitors). Does the user's vocal pitch and eye contact suggest they are playing a 'fake deep guy' persona?"
          ],
          visual_tool_prompt: "You have tools to detect specific behavioral signals based on the provided Knowledge Base (EQ, IQ, wealth, and physique). Use them to log real-time insights when the user displays high or low value traits.",
          visual_tools: [
            {
              "type": "function",
              "function": {
                "name": "log_behavioral_signal",
                "description": "Triggered when the user displays a clear signal of high or low value (EQ, IQ, wealth, physique) as defined in the rubrics.",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "category": { "type": "string", "enum": ["EQ", "IQ", "wealth", "physique"] },
                    "signal_type": { "type": "string", "enum": ["positive", "negative"] },
                    "reason": { "type": "string", "description": "Description of the specific signal observed." }
                  },
                  "required": ["category", "signal_type", "reason"]
                }
              }
            }
          ]
        }
      }
    })
  });

  const palRawData = await palRes.json();
  if (!palRes.ok) throw new Error(palRawData.message || "Failed to create Tavus PAL");

  const parseResult = tavusPalResponseSchema.safeParse(palRawData);
  if (!parseResult.success) {
    // Dual-alias fallback
    const palId = palRawData.pal_id || palRawData.persona_id;
    if (palId) return palId;
    throw new Error("Invalid Tavus PAL creation response format");
  }

  return parseResult.data.pal_id || parseResult.data.persona_id!;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = startSessionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid payload", details: parseResult.error.format() }, { status: 400 });
    }

    const { systemPrompt, knowledgeBase, replicaId } = parseResult.data;
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing TAVUS_API_KEY environment variable." }, { status: 500 });
    }

    // L11 Defense: Mentor session requires non-empty synthesized systemPrompt
    const isMentor = replicaId === CANONICAL_MENTOR_FACE_ID;
    if (isMentor && (!systemPrompt || !systemPrompt.trim() || systemPrompt.includes("Select a date session"))) {
      return NextResponse.json({ error: "Mentor session requires a completed date session synthesis." }, { status: 400 });
    }

    const combinedPrompt = `${systemPrompt}\n\nKNOWLEDGE BASE (RUBRICS):\n${knowledgeBase}`;
    const configHash = crypto.createHash('sha256').update(combinedPrompt).digest('hex');

    // Multi-level PAL Caching (L1 In-Memory + L2 Distributed Store)
    let palId = personaCache.get(configHash);
    if (!palId) {
      palId = (await personaStore.getCachedPalId(configHash)) || undefined;
      if (palId) {
        personaCache.set(configHash, palId);
      }
    }

    if (!palId) {
      palId = await createTavusPal(apiKey, combinedPrompt, replicaId);
      personaCache.set(configHash, palId);
      await personaStore.setCachedPalId(configHash, palId);
    }

    const maxCallDuration = isMentor ? MENTOR_MAX_CALL_DURATION : DATE_MAX_CALL_DURATION;

    // Attempt conversation creation with pal_id
    let conversationRes = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replica_id: replicaId || "r291e545fd67",
        pal_id: palId,
        conversation_name: isMentor ? "Shadowboxing Mentor Session" : "Shadowboxing Date Session",
        callback_url: `${new URL(req.url).origin}/api/webhooks/tavus`,
        properties: {
          max_call_duration: maxCallDuration, // 2-min cap for Date, 1-min cap for Mentor
          participant_left_timeout: 10, // kill if user drops
          participant_absent_timeout: 30 // kill if never joined
        }
      })
    });

    let conversationData = await conversationRes.json();

    // Fallback: If cached PAL ID was rejected/invalid, evict cache and recreate PAL transparently
    if (!conversationRes.ok && (conversationRes.status === 400 || conversationRes.status === 404)) {
      console.warn(`Cached palId ${palId} invalid/expired. Evicting cache and recreating...`);
      personaCache.delete(configHash);
      palId = await createTavusPal(apiKey, combinedPrompt, replicaId);
      personaCache.set(configHash, palId);

      conversationRes = await fetch("https://tavusapi.com/v2/conversations", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replica_id: replicaId || "r291e545fd67",
          pal_id: palId,
          conversation_name: isMentor ? "Shadowboxing Mentor Session" : "Shadowboxing Date Session",
          callback_url: `${new URL(req.url).origin}/api/webhooks/tavus`,
          properties: {
            max_call_duration: maxCallDuration,
            participant_left_timeout: 10,
            participant_absent_timeout: 30
          }
        })
      });
      conversationData = await conversationRes.json();
    }

    if (!conversationRes.ok) throw new Error(conversationData.message || "Failed to create conversation");

    // Store knowledge base for Phase 2 synthesis
    const { insightStore } = await import('@/lib/insightStore');
    await insightStore.setMetadata(conversationData.conversation_id, 'knowledge_base', knowledgeBase);

    return NextResponse.json({ 
      url: conversationData.conversation_url,
      conversationId: conversationData.conversation_id 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
