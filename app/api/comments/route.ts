import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const RATE_LIMIT_MINUTES = 3;
const MAX_NAME_LEN = 30;
const MAX_CONTENT_LEN = 1000;

function sha256(str: string) {
  return createHash('sha256').update(str).digest('hex');
}

function hashIp(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return sha256(ip + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 8));
}

// ── GET: 특정 포스트 댓글 목록 ─────────────────────────────
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId');
  if (!postId)
    return NextResponse.json({ error: 'postId is required.' }, { status: 400 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from('comments')
    .select('id, name, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// ── POST: 댓글 작성 ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { postId, name, content, password } = await req.json();

    if (!postId || !name?.trim() || !content?.trim() || !password?.trim())
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    if (name.trim().length > MAX_NAME_LEN)
      return NextResponse.json({ error: `Name must be ${MAX_NAME_LEN} chars or less.` }, { status: 400 });
    if (content.trim().length > MAX_CONTENT_LEN)
      return NextResponse.json({ error: `Comment must be ${MAX_CONTENT_LEN} chars or less.` }, { status: 400 });
    if (password.length < 4)
      return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });

    const supabase = createClient();

    // 포스트 댓글 허용 여부 확인
    const { data: post } = await supabase
      .from('posts')
      .select('comments_enabled')
      .eq('id', postId)
      .single();
    if (!post?.comments_enabled)
      return NextResponse.json({ error: 'Comments are disabled for this post.' }, { status: 403 });

    // 도배 방지
    const ipHash = hashIp(req);
    const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);

    if ((count ?? 0) > 0)
      return NextResponse.json(
        { error: `Please wait ${RATE_LIMIT_MINUTES} minutes before commenting again.` },
        { status: 429 }
      );

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        name: name.trim(),
        content: content.trim(),
        password_hash: sha256(password),
        ip_hash: ipHash,
      })
      .select('id, name, content, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

// ── DELETE: 댓글 삭제 ──────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id, password } = await req.json();
    if (!id || !password)
      return NextResponse.json({ error: 'ID and password are required.' }, { status: 400 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { data: entry } = await supabase
        .from('comments')
        .select('password_hash')
        .eq('id', id)
        .single();
      if (!entry) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
      if (entry.password_hash !== sha256(password))
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    }

    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
