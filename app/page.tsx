import { createClient } from '@/lib/supabase/server';
import GNB from '@/components/GNB';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;
  const selectedTag = searchParams.tag;

  // Fetch all posts for sidebar (list)
  let sidebarQuery = supabase
    .from('posts')
    .select('id, title, slug, created_at, updated_at, tags')
    .order('created_at', { ascending: false });

  if (!isLoggedIn) {
    sidebarQuery = sidebarQuery.eq('published', true);
  }

  const { data: allPosts } = await sidebarQuery;

  // Fetch main posts (with tag filter)
  let mainQuery = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (!isLoggedIn) {
    mainQuery = mainQuery.eq('published', true);
  }

  if (selectedTag) {
    mainQuery = mainQuery.contains('tags', [selectedTag]);
  }

  const { data: posts } = await mainQuery;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {selectedTag && (
          <div className="mb-6 flex items-center gap-3">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              #{selectedTag}
            </span>
            <a
              href="/"
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                padding: '3px 10px',
                border: '1px solid var(--border)',
                borderRadius: '20px',
              }}
            >
              ✕ 필터 해제
            </a>
          </div>
        )}

        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
          {/* Main Posts */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {posts && posts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((post: Post, i: number) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={isLoggedIn && user?.id === post.user_id}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 40px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  아직 포스트가 없습니다
                </div>
                <div style={{ fontSize: '0.9rem' }}>첫 번째 포스트를 작성해보세요.</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar
            posts={(allPosts as Post[]) || []}
            isLoggedIn={isLoggedIn}
            selectedTag={selectedTag}
          />
        </div>
      </main>
    </div>
  );
}
