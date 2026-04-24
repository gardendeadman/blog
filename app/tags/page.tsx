import { createClient } from '@/lib/supabase/server';
import GNB from '@/components/GNB';
import Link from 'next/link';
import { getBlogName } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const blogName = await getBlogName();

  let query = supabase.from('posts').select('tags');
  if (!isLoggedIn) query = query.eq('published', true);
  const { data: posts } = await query;

  const tagMap: Record<string, number> = {};
  posts?.forEach((post) => {
    (post.tags || []).forEach((tag: string) => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          해시태그
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '0.925rem' }}>
          {tags.length}개의 태그
        </p>
        {tags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            아직 태그가 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {tags.map(({ name, count }) => (
              <Link
                key={name}
                href={`/?tag=${name}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 18px', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '30px',
                  textDecoration: 'none', transition: 'all 0.15s ease', fontSize: '0.925rem',
                }}
                className="hover:border-accent hover:bg-accent-subtle"
              >
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>#{name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>
                  {count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
