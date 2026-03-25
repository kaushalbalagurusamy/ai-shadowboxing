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
              "Did the user maintain consistent eye contact throughout the conversation?",
              "Did the user exhibit any signs of nervousness like touching their face or fidgeting?",
              "How would you rate the user's postural confidence?",
              "At what moments did the user seem most challenged or hesitant?"
            ],
            visual_tool_prompt: "You have tools to detect specific behavioral signals. Use them when you see a clear lapse in confidence or an exceptionally strong conversational moment.",
            visual_tools: [
              {
                "type": "function",
                "function": {
                  "name": "log_confidence_lapse",
                  "description": "Triggered when the user breaks eye contact, hesitates significantly, or uses filler words repeatedly.",
                  "parameters": {
                    "type": "object",
                    "properties": {
                      "reason": { "type": "string", "description": "Specific reason for the lapse (e.g., eye contact break)." },
                      "severity": { "type": "string", "enum": ["low", "medium", "high"] }
                    },
                    "required": ["reason"]
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
        // callback_url: "https://your-domain.com/api/webhooks/tavus" // Requires public URL (e.g. via ngrok)
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
