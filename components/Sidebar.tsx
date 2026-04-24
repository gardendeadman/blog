'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PenSquare, LogIn, LogOut, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';

interface SidebarProps {
  posts: Post[];
  isLoggedIn: boolean;
  selectedTag?: string;
}

export default function Sidebar({ posts, isLoggedIn, selectedTag }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        height: 'fit-content',
        position: 'sticky',
        top: '80px',
      }}
    >
      {/* Auth Button */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-pretendard)',
            }}
            className="hover:border-accent hover:text-accent"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-pretendard)',
            }}
          >
            <LogIn size={14} />
            로그인
          </button>
        )}
      </div>

      {/* Write Button */}
      {isLoggedIn && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link
            href="/write"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              color: 'var(--accent)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <PenSquare size={14} />
            포스트 작성
          </Link>
        </div>
      )}

      {/* Post List Header */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          포스트 목록
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            padding: '1px 8px',
            borderRadius: '20px',
          }}
        >
          {posts.length}
        </span>
      </div>

      {/* Post List */}
      <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {posts.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            포스트가 없습니다
          </div>
        ) : (
          posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              style={{
                display: 'block',
                padding: '11px 16px',
                borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              className="hover:bg-secondary group"
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text)',
                  lineHeight: 1.4,
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {post.title}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                {format(new Date(post.created_at), 'yy.MM.dd', { locale: ko })}
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
