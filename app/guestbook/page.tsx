import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GNB from '@/components/GNB';
import GuestbookClient from '@/components/GuestbookClient';
import { getBlogSettings } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export default async function GuestbookPage() {
  const { blogName, bio, guestbookEnabled } = await getBlogSettings();
  const hasBio = !!bio?.trim();

  if (!guestbookEnabled) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const { data: entries } = await supabase
    .from('guestbook')
    .select('id, name, content, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} hasBio={hasBio} />
      <main
        className="max-w-3xl mx-auto px-6 mobile-px"
        style={{ paddingTop: 'calc(64px + 2.5rem)', paddingBottom: '2.5rem' }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          Guestbook
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '40px' }}>
          Leave a message!
        </p>
        <GuestbookClient
          initialEntries={entries || []}
          isAdmin={isLoggedIn}
        />
      </main>
    </div>
  );
}
