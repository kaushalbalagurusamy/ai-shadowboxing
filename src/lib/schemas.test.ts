import { startSessionSchema, conversationIdSchema } from './schemas';

export function runSchemaTests() {
  // Test startSessionSchema valid input
  const validStart = startSessionSchema.safeParse({
    systemPrompt: "You are a sparring partner.",
    knowledgeBase: "EQ, IQ, Wealth, Physique",
    replicaId: "r9d30b0e55ac"
  });
  if (!validStart.success) {
    throw new Error("Failed valid startSessionSchema test");
  }

  // Test startSessionSchema invalid input (empty prompt)
  const invalidStart = startSessionSchema.safeParse({
    systemPrompt: "",
    knowledgeBase: "EQ, IQ"
  });
  if (invalidStart.success) {
    throw new Error("Failed invalid startSessionSchema test");
  }

  // Test conversationIdSchema valid input
  const validConv = conversationIdSchema.safeParse({ conversationId: "c12345" });
  if (!validConv.success) {
    throw new Error("Failed valid conversationIdSchema test");
  }

  // Test conversationIdSchema invalid input
  const invalidConv = conversationIdSchema.safeParse({ conversationId: "" });
  if (invalidConv.success) {
    throw new Error("Failed invalid conversationIdSchema test");
  }

  return true;
}

runSchemaTests();
