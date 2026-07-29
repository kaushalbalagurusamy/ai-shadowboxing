import { NextResponse } from 'next/server';
import { conversationIdSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = conversationIdSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid payload", details: parseResult.error.format() }, { status: 400 });
    }

    const { conversationId } = parseResult.data;
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing TAVUS_API_KEY environment variable." }, { status: 500 });
    }

    const res = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to end conversation");
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
