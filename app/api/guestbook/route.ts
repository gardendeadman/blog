import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const RATE_LIMIT_MINUTES = 5;   // 동일 IP 최소 게시 간격
const MAX_NAME_LEN = 30;
const MAX_CONTENT_LEN = 500;

function sha256(str: string) {
  return createHash('sha256').update(str).digest('hex');
}

function hashIp(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return sha256(ip + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.slice(0, 8));
}

// ── GET: 방명록 목록 ───────────────────────────────────────
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('guestbook')
    .select('id, name, content, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// ── POST: 방명록 작성 ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, content, password } = await req.json();

    // 입력 검증
    if (!name?.trim() || !content?.trim() || !password?.trim())
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    if (name.trim().length > MAX_NAME_LEN)
      return NextResponse.json({ error: `Name must be ${MAX_NAME_LEN} characters or less.` }, { status: 400 });
    if (content.trim().length > MAX_CONTENT_LEN)
      return NextResponse.json({ error: `Message must be ${MAX_CONTENT_LEN} characters or less.` }, { status: 400 });
    if (password.length < 4)
      return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });

    const supabase = createClient();
    const ipHash = hashIp(req);

    // 도배 방지: 동일 IP에서 N분 이내 작성 여부 확인
    const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('guestbook')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);

    if ((count ?? 0) > 0)
      return NextResponse.json(
        { error: `Please wait ${RATE_LIMIT_MINUTES} minutes before posting again.` },
        { status: 429 }
      );

    // 저장
    const { data, error } = await supabase.from('guestbook').insert({
      name: name.trim(),
      content: content.trim(),
      password_hash: sha256(password),
      ip_hash: ipHash,
    }).select('id, name, content, created_at').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

// ── DELETE: 방명록 삭제 ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id, password } = await req.json();
    if (!id || !password)
      return NextResponse.json({ error: 'ID and password are required.' }, { status: 400 });

    const supabase = createClient();

    // 관리자(로그인 유저)는 패스워드 없이 삭제 가능
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // 일반 유저: 패스워드 검증
      const { data: entry } = await supabase
        .from('guestbook')
        .select('password_hash')
        .eq('id', id)
        .single();

      if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
      if (entry.password_hash !== sha256(password))
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    }

    const { error } = await supabase.from('guestbook').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
