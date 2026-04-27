'use client';

import Link from 'next/link';
import { formatKST } from '@/lib/formatDate';
import { Clock, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Post } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DeleteModal from '@/components/DeleteModal';
import { extractFirstImage } from '@/lib/extractFirstImage';

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  index: number;
}

export default function PostCard({ post, isOwner, index }: PostCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('posts').delete().eq('id', post.id);
    setDeleting(false);
    setShowModal(false);
    router.refresh();
  };

  const isEdited =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 5000;

  const [imgError, setImgError] = useState(false);
  const thumbnail = !imgError
    ? (post.thumbnail || (post.content ? extractFirstImage(post.content, post.content_type ?? 'wysiwyg') : null))
    : null;

  return (
    <>
      <DeleteModal
        isOpen={showModal}
        postTitle={post.title}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        deleting={deleting}
      />

      <article
        className="animate-fade-in"
        style={{
          animationDelay: `${index * 60}ms`,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(212, 98, 42, 0.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        <Link href={`/posts/${encodeURIComponent(post.slug)}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* Thumbnail */}
            {thumbnail && (
              <div style={{
                width: '100px',
                height: '100px',
                flexShrink: 0,
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt=""
                  onError={() => setImgError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {post.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.02em' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2
                className="post-title-mobile"
                style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: '6px', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: thumbnail ? 2 : 3, WebkitBoxOrient: 'vertical' }}
              >
                {post.title}
              </h2>

              {/* Excerpt */}
              {post.excerpt && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: thumbnail ? 1 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt}
                </p>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <Clock size={11} />
                  {formatKST(post.created_at)}
                </span>
                {isEdited && isOwner && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={10} />
                    Updated: {formatKST(post.updated_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex gap-2 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
            <Link
              href={`/write?id=${post.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', transition: 'all 0.15s ease' }}
              className="hover:text-accent hover:border-accent"
            >
              <Pencil size={12} /> Edit
            </Link>
            <button
              onClick={(e) => { e.preventDefault(); setShowModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-pretendard)' }}
              className="hover:text-red-500 hover:border-red-400"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </article>
    </>
  );
}
