import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { path, referrer, visitorId } = await req.json();

    // 봇 필터링 (기본적인 UA 체크)
    const ua = req.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|preview/i.test(ua);
    if (isBot) return NextResponse.json({ ok: false, reason: 'bot' });

    // 설정·API 경로 제외
    const excluded = ['/settings', '/api/', '/login', '/write', '/_next'];
    if (excluded.some(e => path.startsWith(e))) {
      return NextResponse.json({ ok: false, reason: 'excluded' });
    }

    const supabase = createClient();
    await supabase.from('page_views').insert({
      path,
      referrer: referrer || null,
      visitor_id: visitorId || null,
      user_agent: ua.slice(0, 200),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
