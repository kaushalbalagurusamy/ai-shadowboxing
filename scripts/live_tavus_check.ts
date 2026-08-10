import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const tavusKeyMatch = envContent.match(/TAVUS_API_KEY="?([^"\n]+)"?/);
const apiKey = tavusKeyMatch ? tavusKeyMatch[1] : '';

if (!apiKey) {
  console.error("Missing TAVUS_API_KEY");
  process.exit(1);
}

const combinedPrompt = `You are an attractive mid 20s woman from NYC on a first date at a coffee shop.\n\nKNOWLEDGE BASE (RUBRICS):\nYour date or the user's high value is defined by: EQ, IQ, wealth, and physique.`;

async function testFullRoutePayload() {
  console.log("Testing exact src/app/api/tavus/route.ts payload against live Tavus API...");
  
  const palRes = await fetch("https://tavusapi.com/v2/pals", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pal_name: "P0_Baseline_Sparring_Partner",
      persona_name: "P0_Baseline_Sparring_Partner",
      default_face_id: "r291e545fd67",
      system_prompt: `${combinedPrompt}\n\nIMPORTANT: If the user fails to respond or remains silent for more than 10 seconds, or if you decide the date is over based on your rubrics, you must verbally excuse yourself and immediately call the 'end_conversation' tool.`,
      pipeline_mode: "full",
      layers: {
        stt: {
          stt_engine: "tavus-parakeet"
        },
        rendering: {
          rendering_model: "phoenix-4"
        },
        timing: {
          timing_model: "sparrow-1"
        },
        llm: {
          tools: [
            {
              "type": "function",
              "function": {
                "name": "end_conversation",
                "description": "Call this tool immediately when you decide the date is over or when the user is inactive for more than 10 seconds. This will hang up the call.",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "reason": { "type": "string", "description": "The reason for ending the date (e.g., 'User Inactivity', 'Low Interest', 'Natural Conclusion')." }
                  },
                  "required": ["reason"]
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

  const palStatus = palRes.status;
  const palData = await palRes.json();
  console.log(`PAL Creation Status: ${palStatus}`);
  console.log("PAL Response Body:", JSON.stringify(palData, null, 2));

  if (!palRes.ok) {
    console.error("PAL Creation ERROR message:", palData.message || JSON.stringify(palData));
    process.exit(1);
  }

  const palId = palData.pal_id || palData.persona_id;

  // Test conversation creation
  console.log("\nTesting POST /v2/conversations with pal_id:", palId);
  const convRes = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replica_id: "r291e545fd67",
      pal_id: palId,
      conversation_name: "Phase 1 Demo Session",
      callback_url: "https://ai-shadowboxing.vercel.app/api/webhooks/tavus",
      properties: {
        max_call_duration: 120,
        participant_left_timeout: 10,
        participant_absent_timeout: 30
      }
    })
  });

  const convStatus = convRes.status;
  const convData = await convRes.json();
  console.log(`Conversation Status: ${convStatus}`);
  console.log("Conversation Response Body:", JSON.stringify(convData, null, 2));

  if (convData.conversation_id) {
    console.log(`\nEnding conversation ${convData.conversation_id} immediately...`);
    await fetch(`https://tavusapi.com/v2/conversations/${convData.conversation_id}/end`, {
      method: "POST",
      headers: { "x-api-key": apiKey }
    });
  }
}

testFullRoutePayload();
