import { createClient } from '@/lib/supabase/server';
import GNB from '@/components/GNB';
import { getBlogSettings } from '@/lib/blogSettings';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const { blogName, bio, profileImage } = await getBlogSettings();
  const hasBio = !!bio?.trim();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} hasBio={hasBio} />
      <main className="max-w-2xl mx-auto px-6 py-16 mobile-px mobile-py">
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(24px, 5vw, 48px)',
        }}>
          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--accent-subtle)', border: '2px solid var(--accent)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px', fontSize: '2rem', flexShrink: 0,
          }}>
            {profileImage
              ? <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '✍️'
            }
          </div>

          {/* Blog name */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem', fontWeight: 700,
            color: 'var(--text)', marginBottom: '8px',
          }}>
            {blogName}
          </h1>

          {/* Divider */}
          <div style={{
            height: '3px', width: '40px',
            background: 'var(--accent)', borderRadius: '2px',
            marginBottom: '28px',
          }} />

          {/* Bio */}
          {bio ? (
            <div className="post-content" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{bio}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.8 }}>
              <p>Welcome to <strong style={{ color: 'var(--text)' }}>{blogName}</strong>.</p>
              <p style={{ marginTop: '8px' }}>Write your bio in Settings.</p>
            </div>
          )}


        </div>
      </main>
    </div>
  );
}
