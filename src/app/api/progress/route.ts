import { NextResponse } from 'next/server';
import { progressStore } from '@/lib/progressStore';
import { conversationIdSchema } from '@/lib/schemas';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const parseResult = conversationIdSchema.safeParse({ conversationId });
      if (!parseResult.success) {
        return NextResponse.json({ error: "Invalid conversationId query parameter" }, { status: 400 });
      }
    }

    const history = await progressStore.getProgressHistory(conversationId || undefined);
    const summary = progressStore.calculateSummary(history);

    return NextResponse.json({ success: true, ...summary });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
