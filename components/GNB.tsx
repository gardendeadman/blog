'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GNBProps {
  isLoggedIn: boolean;
}

export default function GNB({ isLoggedIn }: GNBProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
      }}
      className="sticky top-0 z-50 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--accent)',
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            블로그
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          <NavLink href="/">홈</NavLink>
          <NavLink href="/tags">해시태그</NavLink>
          <NavLink href="/about">소개</NavLink>
          {isLoggedIn && <NavLink href="/settings">설정</NavLink>}
        </nav>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 8px',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="hover:text-accent"
              title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        fontWeight: 500,
        padding: '6px 12px',
        borderRadius: '6px',
        transition: 'all 0.15s ease',
        textDecoration: 'none',
      }}
      className="hover:text-accent hover:bg-accent-subtle"
    >
      {children}
    </Link>
  );
}
