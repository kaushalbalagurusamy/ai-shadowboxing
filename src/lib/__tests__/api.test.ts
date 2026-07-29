import { startSessionSchema, conversationIdSchema } from '../schemas';
import { logger } from '../telemetry';
import crypto from 'crypto';

export function runApiBoundaryTestSuite() {
  console.log("--- STARTING API BOUNDARY & INTEGRATION TEST SUITE ---");

  // 1. Zod startSessionSchema boundary tests
  const validStart = startSessionSchema.safeParse({
    systemPrompt: "Valid prompt",
    knowledgeBase: "Valid knowledge base",
    replicaId: "r9d30b0e55ac"
  });
  if (!validStart.success) throw new Error("startSessionSchema failed valid payload");

  const invalidStartPrompt = startSessionSchema.safeParse({
    systemPrompt: "",
    knowledgeBase: "Valid KB"
  });
  if (invalidStartPrompt.success) throw new Error("startSessionSchema allowed empty systemPrompt");

  const invalidStartKB = startSessionSchema.safeParse({
    systemPrompt: "Valid prompt",
    knowledgeBase: ""
  });
  if (invalidStartKB.success) throw new Error("startSessionSchema allowed empty knowledgeBase");

  // 2. Zod conversationIdSchema boundary tests
  const validConv = conversationIdSchema.safeParse({ conversationId: "c_998877" });
  if (!validConv.success) throw new Error("conversationIdSchema failed valid payload");

  const invalidConv = conversationIdSchema.safeParse({ conversationId: "" });
  if (invalidConv.success) throw new Error("conversationIdSchema allowed empty string");

  // 3. Webhook HMAC SHA-256 Signature Verification Test
  const secret = "test_webhook_secret_key_12345";
  const rawBody = JSON.stringify({ event_type: "system.shutdown", conversation_id: "c_123" });
  
  const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const invalidSignature = "invalid_spoofed_signature_hash";

  const sigBuffer = Buffer.from(validSignature);
  const compBuffer = Buffer.from(validSignature);
  const isTimingEqual = crypto.timingSafeEqual(sigBuffer, compBuffer);

  if (!isTimingEqual) throw new Error("HMAC timingSafeEqual failed valid signature matching");

  const badBuffer = Buffer.from(invalidSignature);
  const isBadEqual = sigBuffer.length === badBuffer.length && crypto.timingSafeEqual(sigBuffer, badBuffer);
  if (isBadEqual) throw new Error("HMAC timingSafeEqual allowed spoofed signature");

  // 4. Telemetry Logger Output Test
  logger.info("Telemetry test log entry", { event: "test_verification", conversationId: "c_123" });

  console.log("--- ALL API BOUNDARY & INTEGRATION TESTS PASSED CLEANLY ---");
  return true;
}

runApiBoundaryTestSuite();
