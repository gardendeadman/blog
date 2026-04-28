import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Vercel Cron: vercel.json에 schedule 추가 필요
// 이 라우트는 매 5분마다 호출되어 예약 상태를 처리합니다
export async function GET(req: Request) {
  // 보안: CRON_SECRET 헤더 검증
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const now = new Date().toISOString();
  const results: Record<string, number> = {};

  // 1. 핀 기간 만료 → pinned = false
  const { count: unpinned } = await supabase
    .from('posts')
    .update({ pinned: false, pinned_until: null })
    .eq('pinned', true)
    .not('pinned_until', 'is', null)
    .lte('pinned_until', now)
    .select('id', { count: 'exact', head: true });
  results.unpinned = unpinned || 0;

  // 2. 예약 공개: publish_at 도달 → published = true
  const { count: published } = await supabase
    .from('posts')
    .update({ published: true, publish_at: null })
    .eq('published', false)
    .not('publish_at', 'is', null)
    .lte('publish_at', now)
    .select('id', { count: 'exact', head: true });
  results.published = published || 0;

  // 3. 예약 비공개: unpublish_at 도달 → published = false
  const { count: unpublished } = await supabase
    .from('posts')
    .update({ published: false, unpublish_at: null })
    .eq('published', true)
    .not('unpublish_at', 'is', null)
    .lte('unpublish_at', now)
    .select('id', { count: 'exact', head: true });
  results.unpublished = unpublished || 0;

  return NextResponse.json({ ok: true, processed: results, at: now });
}
