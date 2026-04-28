import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const now = new Date().toISOString();
  const results: Record<string, string> = {};

  // 1. 핀 기간 만료 → pinned = false
  const { error: e1 } = await supabase
    .from('posts')
    .update({ pinned: false, pinned_until: null })
    .eq('pinned', true)
    .not('pinned_until', 'is', null)
    .lte('pinned_until', now);
  results.unpinned = e1 ? `error: ${e1.message}` : 'ok';

  // 2. 예약 공개: publish_at 도달 → published = true
  const { error: e2 } = await supabase
    .from('posts')
    .update({ published: true, publish_at: null })
    .eq('published', false)
    .not('publish_at', 'is', null)
    .lte('publish_at', now);
  results.published = e2 ? `error: ${e2.message}` : 'ok';

  // 3. 예약 비공개: unpublish_at 도달 → published = false
  const { error: e3 } = await supabase
    .from('posts')
    .update({ published: false, unpublish_at: null })
    .eq('published', true)
    .not('unpublish_at', 'is', null)
    .lte('unpublish_at', now);
  results.unpublished = e3 ? `error: ${e3.message}` : 'ok';

  return NextResponse.json({ ok: true, processed: results, at: now });
}
