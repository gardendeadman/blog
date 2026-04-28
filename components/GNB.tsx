'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Menu, X, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface GNBProps {
  isLoggedIn: boolean;
  blogName?: string;
  hasBio?: boolean;
  guestbookEnabled?: boolean;
}

export default function GNB({
  isLoggedIn,
  blogName = 'Blog',
  hasBio = false,
  guestbookEnabled: guestbookEnabledProp = false,
}: GNBProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guestbookEnabled, setGuestbookEnabled] = useState(guestbookEnabledProp);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 설정 변경이 즉시 반영되도록 클라이언트에서 직접 조회
  useEffect(() => {
    supabase
      .from('blog_settings')
      .select('guestbook_enabled')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setGuestbookEnabled(data.guestbook_enabled ?? false);
      });
  }, [pathname]); // 페이지 이동 시마다 갱신

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  return (
    <>
      <header
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
        className="backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {blogName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="gnb-nav-desktop items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            {hasBio && <NavLink href="/about">About</NavLink>}
            {guestbookEnabled && <NavLink href="/guestbook">Guestbook</NavLink>}
            {isLoggedIn && <NavLink href="/settings">Settings</NavLink>}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            {/* Hamburger */}
            <button
              className="gnb-nav-mobile"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: 'var(--text-secondary)', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.2)' }} />
          <nav className="mobile-menu">
            <MobileLink href="/" onClick={() => setMenuOpen(false)}>Home</MobileLink>
            <MobileLink href="/tags" onClick={() => setMenuOpen(false)}>Tags</MobileLink>
            {hasBio && <MobileLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileLink>}
            {guestbookEnabled && <MobileLink href="/guestbook" onClick={() => setMenuOpen(false)}>Guestbook</MobileLink>}
            {isLoggedIn && (
              <>
                <MobileLink href="/settings" onClick={() => setMenuOpen(false)}>Settings</MobileLink>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px' }}>
                  <button
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-pretendard)' }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </>
            )}
            {!isLoggedIn && (
              <MobileLink href="/login" onClick={() => setMenuOpen(false)}>
                <LogIn size={15} style={{ marginRight: '6px' }} /> Sign in
              </MobileLink>
            )}
          </nav>
        </>
      )}
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, padding: '6px 12px', borderRadius: '6px', transition: 'all 0.15s ease', textDecoration: 'none' }} className="hover:text-accent hover:bg-accent-subtle">
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="mobile-menu-link">
      {children}
    </Link>
  );
}
