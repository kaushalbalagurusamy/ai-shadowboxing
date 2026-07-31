import { describe, it, expect } from 'vitest';
import { POST as tavusPOST } from '@/app/api/tavus/route';
import { POST as endPOST } from '@/app/api/tavus/end/route';
import { POST as webhookPOST } from '@/app/api/webhooks/tavus/route';
import { POST as mentorChatPOST } from '@/app/api/mentor/chat/route';
import { GET as progressGET } from '@/app/api/progress/route';
import crypto from 'crypto';

describe('Hermetic API Route Integration Tests (MSW Intercepted)', () => {
  it('POST /api/tavus - should validate input and initiate conversation via MSW without external API calls', async () => {
    const validReq = new Request('http://localhost:3000/api/tavus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: 'You are a corporate executive.',
        knowledgeBase: 'EQ, IQ, Wealth, Physique rubrics',
      }),
    });

    const res = await tavusPOST(validReq);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.conversationId).toBe('c_mock_conv_456');
    expect(data.url).toBe('https://tavus.mock/c_mock_conv_456');
  });

  it('POST /api/tavus - should reject invalid payload with status 400', async () => {
    const invalidReq = new Request('http://localhost:3000/api/tavus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt: '', knowledgeBase: '' }),
    });

    const res = await tavusPOST(invalidReq);
    expect(res.status).toBe(400);
  });

  it('POST /api/tavus/end - should process session hard close', async () => {
    const req = new Request('http://localhost:3000/api/tavus/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'c_mock_conv_456' }),
    });

    const res = await endPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('POST /api/webhooks/tavus - should verify HMAC signature and return static RESP_SUCCESS constant', async () => {
    const secret = 'test_webhook_secret';
    process.env.TAVUS_WEBHOOK_SECRET = secret;

    const payload = JSON.stringify({
      event_type: 'system.shutdown',
      conversation_id: 'c_mock_conv_456',
    });

    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const req = new Request('http://localhost:3000/api/webhooks/tavus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tavus-signature': signature,
      },
      body: payload,
    });

    const res = await webhookPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('POST /api/webhooks/tavus - should reject invalid HMAC signature with status 401', async () => {
    process.env.TAVUS_WEBHOOK_SECRET = 'secret123';

    const req = new Request('http://localhost:3000/api/webhooks/tavus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tavus-signature': 'bad_signature_hash',
      },
      body: JSON.stringify({ conversation_id: 'c_123' }),
    });

    const res = await webhookPOST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/mentor/chat - should process follow-up Q&A with Gemini model via MSW', async () => {
    const req = new Request('http://localhost:3000/api/mentor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: 'c_mock_conv_456',
        userMessage: 'How could I have handled turn 3 better?',
        history: [{ role: 'user', content: 'Hello M1' }],
      }),
    });

    const res = await mentorChatPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reply).toBeTruthy();
  });

  it('GET /api/progress - should return multi-session analytics summary', async () => {
    const req = new Request('http://localhost:3000/api/progress?conversationId=c_mock_conv_456');
    const res = await progressGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.history).toBeDefined();
    expect(data.averageScores).toBeDefined();
  });
});
