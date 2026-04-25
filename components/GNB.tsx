'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GNBProps {
  isLoggedIn: boolean;
  blogName?: string;
  hasBio?: boolean;
}

export default function GNB({ isLoggedIn, blogName = 'Blog', hasBio = false }: GNBProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {blogName}
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/tags">Tags</NavLink>
          {hasBio && <NavLink href="/about">About</NavLink>}
          {isLoggedIn && <NavLink href="/settings">Settings</NavLink>}
        </nav>

        {/* Theme toggle */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, padding: '6px 12px', borderRadius: '6px', transition: 'all 0.15s ease', textDecoration: 'none' }}
      className="hover:text-accent hover:bg-accent-subtle"
    >
      {children}
    </Link>
  );
}
