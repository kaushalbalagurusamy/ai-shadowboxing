import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

process.env.TAVUS_API_KEY = "test_tavus_key";
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test_gemini_key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test_supabase_key";
process.env.TAVUS_WEBHOOK_SECRET = "test_webhook_secret";

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
