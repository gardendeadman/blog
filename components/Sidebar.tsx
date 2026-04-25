'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatKSTShort } from '@/lib/formatDate';
import { PenSquare, LogIn, LogOut, Eye, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';
import { useEffect, useState } from 'react';

interface SidebarProps {
  posts: Post[];
  isLoggedIn: boolean;
  selectedTag?: string;
}

interface VisitorStats {
  todayViews: number;
  totalViews: number;
  todayVisitors: number;
  totalVisitors: number;
}

export default function Sidebar({ posts, isLoggedIn, selectedTag }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10); // "YYYY-MM-DD"
        const todayStart = `${todayKST}T00:00:00+09:00`;

        const [todayRes, totalRes] = await Promise.all([
          supabase
            .from('page_views')
            .select('visitor_id', { count: 'exact' })
            .gte('created_at', todayStart),
          supabase
            .from('page_views')
            .select('visitor_id', { count: 'exact' }),
        ]);

        const todayRows = todayRes.data || [];
        const totalRows = totalRes.data || [];

        setStats({
          todayViews: todayRes.count || 0,
          totalViews: totalRes.count || 0,
          todayVisitors: new Set(todayRows.map((r: any) => r.visitor_id).filter(Boolean)).size,
          totalVisitors: new Set(totalRows.map((r: any) => r.visitor_id).filter(Boolean)).size,
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleLogin = () => router.push('/login');

  const statBox = (label: string, value: number | null, icon: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        {value === null ? '—' : value.toLocaleString()}
      </div>
    </div>
  );

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
      className="sidebar-wrapper"
    >
      {/* Visitor Stats */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Visitors
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {statBox('Today', stats?.todayVisitors ?? null, <Users size={10} />)}
          <div style={{ width: '1px', background: 'var(--border)' }} />
          {statBox('Total', stats?.totalVisitors ?? null, <Users size={10} />)}
          <div style={{ width: '1px', background: 'var(--border)' }} />
          {statBox('Views', stats?.todayViews ?? null, <Eye size={10} />)}
        </div>
      </div>

      {/* Auth Button */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-pretendard)' }}
            className="hover:border-accent hover:text-accent"
          >
            <LogOut size={14} /> Sign out
          </button>
        ) : (
          <button
            onClick={handleLogin}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-pretendard)' }}
          >
            <LogIn size={14} /> Sign in
          </button>
        )}
      </div>

      {/* Write Button */}
      {isLoggedIn && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link
            href="/write"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s ease' }}
          >
            <PenSquare size={14} /> New post
          </Link>
        </div>
      )}

      {/* Post List Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Posts
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 8px', borderRadius: '20px' }}>
          {posts.length}
        </span>
      </div>

      {/* Post List */}
      <div className="sidebar-post-list" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {posts.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No posts yet
          </div>
        ) : (
          posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/posts/${encodeURIComponent(post.slug)}`}
              style={{ display: 'block', padding: '11px 16px', borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', transition: 'background 0.15s ease' }}
              className="hover:bg-secondary group sidebar-post-item"
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatKSTShort(post.created_at)}
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
