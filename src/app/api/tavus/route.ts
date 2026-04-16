import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { systemPrompt, knowledgeBase, replicaId } = await req.json();
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing TAVUS_API_KEY environment variable." }, { status: 500 });
    }

    const combinedPrompt = `${systemPrompt}\n\nKNOWLEDGE BASE (RUBRICS):\n${knowledgeBase}`;

    // 1. Create Persona
    const personaRes = await fetch("https://tavusapi.com/v2/personas", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        persona_name: "P0_Baseline_Sparring_Partner",
        system_prompt: combinedPrompt,
        pipeline_mode: "full",
        layers: {
          perception: {
            perception_model: "raven-1",
            perception_analysis_queries: [
              "User Appearance: Describe the user's physical presentation, clothing, and overall physique in relation to the 'physique' rubric.",
              "User Behavior \u0026 Demeanor: Analyze specific behavioral cues like eye contact, fidgeting, and posture in relation to the 'Confidence' and 'Assertiveness' rubrics.",
              "Emotional State: Evaluate the user's emotional intelligence (EQ) and IQ based on their responses, tone, and facial expressions.",
              "Screen Activities: Note any external distractions or screen-related behavior (e.g., looking away at another monitor) that affects their engagement level."
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

    const personaData = await personaRes.json();
    if (!personaRes.ok) throw new Error(personaData.message || "Failed to create persona");

    // 2. Create Conversation
    const conversationRes = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replica_id: replicaId || "r9d30b0e55ac",
        persona_id: personaData.persona_id,
        conversation_name: "Phase 1 Demo Session",
        enable_recording: false, // Cloud recording requires AWS S3 config which is not yet provided
        callback_url: `${new URL(req.url).origin}/api/webhooks/tavus`
      })
    });

    const conversationData = await conversationRes.json();
    if (!conversationRes.ok) throw new Error(conversationData.message || "Failed to create conversation");

    return NextResponse.json({ 
      url: conversationData.conversation_url,
      conversationId: conversationData.conversation_id 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
