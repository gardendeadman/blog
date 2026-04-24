'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, RefreshCw, Tag, Pencil, Trash2 } from 'lucide-react';
import { Post } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  index: number;
}

export default function PostCard({ post, isOwner, index }: PostCardProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    router.refresh();
  };

  const isEdited =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 5000;

  return (
    <article
      className="animate-fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px 28px',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 4px 20px rgba(212, 98, 42, 0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <Link href={`/posts/${encodeURIComponent(post.slug)}`} style={{ textDecoration: 'none' }}>
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--accent-subtle)',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  letterSpacing: '0.02em',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.4,
            marginBottom: '10px',
            letterSpacing: '-0.01em',
          }}
        >
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            style={{
              fontSize: '0.925rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '16px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 flex-wrap">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <Clock size={12} />
            {format(new Date(post.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
          </span>

          {isEdited && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={11} />
              수정: {format(new Date(post.updated_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
            </span>
          )}
        </div>
      </Link>

      {/* Owner Actions */}
      {isOwner && (
        <div
          className="flex gap-2 mt-4 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Link
            href={`/write?id=${post.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              transition: 'all 0.15s ease',
            }}
            className="hover:text-accent hover:border-accent"
          >
            <Pencil size={12} />
            수정
          </Link>
          <button
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: 'transparent',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-pretendard)',
            }}
            className="hover:text-red-500 hover:border-red-400"
          >
            <Trash2 size={12} />
            삭제
          </button>
        </div>
      )}
    </article>
  );
}
