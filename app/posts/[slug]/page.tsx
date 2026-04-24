import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, RefreshCw, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import GNB from '@/components/GNB';
import PostContent from '@/components/PostContent';
import { getBlogName } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const blogName = await getBlogName();

  // URL 인코딩된 slug 디코딩 (한글 slug 등 대비)
  const rawSlug = decodeURIComponent(params.slug);

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', rawSlug)
    .single();

  if (!post) notFound();
  if (!post.published && !isLoggedIn) notFound();

  const isEdited =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 5000;
  const isOwner = isLoggedIn && user?.id === post.user_id;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '32px', transition: 'color 0.15s ease' }} className="hover:text-accent">
          <ArrowLeft size={14} /> 목록으로
        </Link>

        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {post.tags.map((tag: string) => (
              <Link key={tag} href={`/?tag=${tag}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '3px 12px', borderRadius: '20px', textDecoration: 'none' }}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, letterSpacing: '-0.02em', marginBottom: '20px' }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            작성: {format(new Date(post.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
          </span>
          {isEdited && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={12} />
              수정: {format(new Date(post.updated_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
            </span>
          )}
          {!post.published && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '2px 10px', borderRadius: '20px' }}>
              비공개
            </span>
          )}
          {isOwner && (
            <Link href={`/write?id=${post.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '6px', transition: 'all 0.15s ease' }} className="hover:text-accent hover:border-accent">
              <Pencil size={12} /> 수정
            </Link>
          )}
        </div>

        <PostContent content={post.content} contentType={post.content_type} />

        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '8px', transition: 'all 0.15s ease' }} className="hover:text-accent hover:border-accent">
            <ArrowLeft size={14} /> 다른 포스트 보기
          </Link>
        </div>
      </main>
    </div>
  );
}
