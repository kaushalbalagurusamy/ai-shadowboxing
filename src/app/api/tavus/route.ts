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
        pipeline_mode: "full"
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
        conversation_name: "Phase 1 Demo Session"
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
