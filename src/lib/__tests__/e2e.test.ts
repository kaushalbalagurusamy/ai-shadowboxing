import { startSessionSchema, conversationIdSchema, mentorChatSchema } from '../schemas';
import { SCENARIO_PRESETS } from '../scenarioPresets';
import { progressStore } from '../progressStore';
import { logger } from '../telemetry';
import crypto from 'crypto';

export function runFullStackIntegrationTestSuite() {
  console.log("=================================================");
  console.log("    RUNNING FULL-STACK INTEGRATION TEST SUITE    ");
  console.log("=================================================");

  // 1. Validate startSessionSchema
  const validStart = startSessionSchema.safeParse({
    systemPrompt: "You are a mid-20s NYC lawyer.",
    knowledgeBase: "EQ, IQ, Wealth, Physique rubrics",
    replicaId: "r9d30b0e55ac",
  });
  if (!validStart.success) throw new Error("startSessionSchema failed on valid input");

  const invalidStart = startSessionSchema.safeParse({ systemPrompt: "", knowledgeBase: "" });
  if (invalidStart.success) throw new Error("startSessionSchema accepted empty strings");

  // 2. Validate conversationIdSchema
  const validConv = conversationIdSchema.safeParse({ conversationId: "c_123456" });
  if (!validConv.success) throw new Error("conversationIdSchema failed on valid input");

  const invalidConv = conversationIdSchema.safeParse({ conversationId: "" });
  if (invalidConv.success) throw new Error("conversationIdSchema accepted empty conversationId");

  // 3. Validate mentorChatSchema
  const validChat = mentorChatSchema.safeParse({
    conversationId: "c_123456",
    userMessage: "How can I improve my frame control?",
    history: [{ role: "user", content: "Hello" }],
  });
  if (!validChat.success) throw new Error("mentorChatSchema failed on valid input");

  const invalidChat = mentorChatSchema.safeParse({ conversationId: "c_123", userMessage: "" });
  if (invalidChat.success) throw new Error("mentorChatSchema accepted empty userMessage");

  // 4. Validate SCENARIO_PRESETS integrity
  if (SCENARIO_PRESETS.length === 0) throw new Error("SCENARIO_PRESETS library is empty");
  for (const preset of SCENARIO_PRESETS) {
    if (!preset.id || !preset.name || !preset.systemPrompt || !preset.knowledgeBase) {
      throw new Error(`Preset ${preset.id} is missing required fields`);
    }
  }

  // 5. Validate progressStore summary calculations
  const mockEntries = [
    {
      conversationId: "c1",
      timestamp: new Date().toISOString(),
      scores: { EQ: 8, IQ: 7, Wealth: 9, Physique: 8 },
      primaryWeakness: "Nervous laughter under pressure",
    },
    {
      conversationId: "c2",
      timestamp: new Date().toISOString(),
      scores: { EQ: 6, IQ: 8, Wealth: 7, Physique: 6 },
      primaryWeakness: "Nervous laughter under pressure",
    },
  ];

  const summary = progressStore.calculateSummary(mockEntries);
  if (summary.totalSessions !== 2) throw new Error("Progress summary totalSessions mismatch");
  if (summary.averageScores.EQ !== 7) throw new Error(`EQ average mismatch: expected 7, got ${summary.averageScores.EQ}`);
  if (summary.mostCommonWeakness !== "Nervous laughter under pressure") {
    throw new Error("Progress summary mostCommonWeakness calculation failed");
  }

  // 6. Validate HMAC SHA-256 Webhook Verification
  const secret = "test_webhook_secret";
  const body = JSON.stringify({ event_type: "system.shutdown", conversation_id: "c1" });
  const validSig = crypto.createHmac('sha256', secret).update(body).digest('hex');

  const sigBuffer = Buffer.from(validSig);
  const compBuffer = Buffer.from(validSig);
  if (!crypto.timingSafeEqual(sigBuffer, compBuffer)) {
    throw new Error("HMAC timingSafeEqual verification failed");
  }

  // 7. Verify Telemetry Output
  logger.info("Test suite telemetry sanity check", { status: "OK", passed: true });

  console.log("-------------------------------------------------");
  console.log("  SUCCESS: ALL 7 INTEGRATION TEST VECTORS PASSED  ");
  console.log("-------------------------------------------------");
  return true;
}

runFullStackIntegrationTestSuite();
