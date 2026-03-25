import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json();
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing TAVUS_API_KEY environment variable." }, { status: 500 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
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
