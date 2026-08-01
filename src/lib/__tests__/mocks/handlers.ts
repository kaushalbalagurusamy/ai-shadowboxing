import { http, HttpResponse } from 'msw';

export const handlers = [
  // 1. Mock Tavus PAL Creation API
  http.post('https://tavusapi.com/v2/pals', async () => {
    return HttpResponse.json({
      pal_id: 'pal_mock_pal_123',
      persona_id: 'p_mock_persona_123',
      pal_name: 'Mock Shadowboxing Partner',
      status: 'active',
      created_at: new Date().toISOString(),
    });
  }),

  // Legacy Tavus Persona Creation API fallback
  http.post('https://tavusapi.com/v2/personas', async () => {
    return HttpResponse.json({
      pal_id: 'p_mock_persona_123',
      persona_id: 'p_mock_persona_123',
      persona_name: 'Mock Shadowboxing Partner',
      created_at: new Date().toISOString(),
    });
  }),

  // 2. Mock Tavus Conversation Creation API
  http.post('https://tavusapi.com/v2/conversations', async () => {
    return HttpResponse.json({
      conversation_id: 'c_mock_conv_456',
      conversation_name: 'Mock Date Session',
      conversation_url: 'https://tavus.mock/c_mock_conv_456',
      status: 'active',
    });
  }),

  // 3. Mock Tavus End Conversation API
  http.post('https://tavusapi.com/v2/conversations/:id/end', async ({ params }) => {
    return HttpResponse.json({
      conversation_id: params.id,
      status: 'ended',
    });
  }),

  // 4. Mock Gemini API calls (Generative AI endpoint)
  http.post('https://generativelanguage.googleapis.com/*', async () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  audit: {
                    scores: { EQ: 8, IQ: 7, Wealth: 9, Physique: 8 },
                    primary_weakness: 'Nervous posture under pressure',
                    rationale: 'Client maintained solid vocal tone but exhibited subtle physical stiffness.',
                  },
                  master_log: '# Master Performance Log\nTimestamped transcript aligned.',
                  mentor_prompt: { system_instruction: 'You are M1, executive mentor.' },
                  next_partner_prompt: { system_instruction: 'You are P1, standoffish partner.' },
                }),
              },
            ],
          },
        },
      ],
    });
  }),

  // 5. Mock Supabase REST API calls
  http.post('https://*.supabase.co/rest/v1/insights*', async () => {
    return HttpResponse.json({ status: 'inserted', count: 1 }, { status: 201 });
  }),

  http.get('https://*.supabase.co/rest/v1/insights*', async () => {
    return HttpResponse.json([
      {
        id: 1,
        conversation_id: 'c_mock_conv_456',
        data: {
          type: 'session_summary',
          recordingUrl: 'https://s3.mock.aws/gamefilm.mp4',
          analysis: { overall: 'Solid composure' },
        },
      },
      {
        id: 2,
        conversation_id: 'c_mock_conv_456',
        data: {
          type: 'transcript_turn',
          role: 'user',
          text: 'Hi, nice to meet you!',
        },
      },
      {
        id: 3,
        conversation_id: 'c_mock_conv_456',
        data: {
          type: 'behavioral_cue',
          category: 'EQ',
          signalType: 'positive',
          reason: 'Good composure under pressure',
        },
      },
    ]);
  }),
];
