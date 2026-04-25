import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatKST } from '@/lib/formatDate';
import { Clock, RefreshCw, ArrowLeft, Pencil, Paperclip, FileText, FileImage, File } from 'lucide-react';
import Link from 'next/link';
import GNB from '@/components/GNB';
import PostContent from '@/components/PostContent';
import PostActions from '@/components/PostActions';
import { getBlogSettings } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const { blogName, bio } = await getBlogSettings();
  const hasBio = !!bio?.trim();

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
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} hasBio={hasBio} />

      <main className="max-w-3xl mx-auto px-6 py-10 mobile-px mobile-py">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '32px', transition: 'color 0.15s ease' }} className="hover:text-accent">
          <ArrowLeft size={14} /> Back to list
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {post.tags.map((tag: string) => (
              <Link key={tag} href={`/?tag=${tag}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '3px 12px', borderRadius: '20px', textDecoration: 'none' }}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, letterSpacing: '-0.02em', marginBottom: '20px' }}>
          {post.title}
        </h1>

        {/* Meta + Edit/Delete buttons */}
        <div className="post-meta-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            Posted: {formatKST(post.created_at)}
          </span>
          {isEdited && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={12} />
              Updated: {formatKST(post.updated_at)}
            </span>
          )}
          {!post.published && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '2px 10px', borderRadius: '20px' }}>
              Private
            </span>
          )}

          {/* Edit/Delete — separated as client component */}
          {isOwner && (
            <PostActions postId={post.id} postTitle={post.title} />
          )}
        </div>

        {/* Content */}
        <PostContent content={post.content} contentType={post.content_type} />

        {/* Attachments */}
        {post.attachments && (() => {
          let files: any[] = [];
          try { files = JSON.parse(post.attachments); } catch {}
          if (!files.length) return null;
          return (
            <div style={{ marginTop: '40px', padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={13} /> Attachments ({files.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {files.map((f: any, i: number) => (
                  <a key={i} href={f.dataUrl} download={f.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', textDecoration: 'none', transition: 'border-color 0.15s ease' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                      {f.type?.startsWith('image/') ? <FileImage size={14} /> : f.type?.includes('pdf') || f.type?.includes('text') ? <FileText size={14} /> : <File size={14} />}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {f.size < 1024 ? f.size + ' B' : f.size < 1024*1024 ? (f.size/1024).toFixed(1) + ' KB' : (f.size/(1024*1024)).toFixed(1) + ' MB'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '8px', transition: 'all 0.15s ease' }} className="hover:text-accent hover:border-accent">
            <ArrowLeft size={14} /> More posts
          </Link>
        </div>
      </main>
    </div>
  );
}
