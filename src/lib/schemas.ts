import { z } from 'zod';

export const startSessionSchema = z.object({
  systemPrompt: z.string().min(1, "systemPrompt must not be empty"),
  knowledgeBase: z.string().min(1, "knowledgeBase must not be empty"),
  replicaId: z.string().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const conversationIdSchema = z.object({
  conversationId: z.string().min(1, "conversationId must not be empty"),
});

export type ConversationIdInput = z.infer<typeof conversationIdSchema>;

export const mentorChatSchema = z.object({
  conversationId: z.string().min(1, "conversationId must not be empty"),
  userMessage: z.string().min(1, "userMessage must not be empty"),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
});

export type MentorChatInput = z.infer<typeof mentorChatSchema>;
