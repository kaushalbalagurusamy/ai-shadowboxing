import { NextResponse } from 'next/server';
import { insightStore } from '@/lib/insightStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const insights = insightStore.getInsights(conversationId);
  return NextResponse.json({ insights });
}
