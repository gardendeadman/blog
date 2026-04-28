import { createClient } from '@/lib/supabase/server';
import GNB from '@/components/GNB';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { Post } from '@/lib/types';
import { getBlogSettings } from '@/lib/blogSettings';

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
  const { blogName, bio, guestbookEnabled } = await getBlogSettings();
  const hasBio = !!bio?.trim();

  // Fetch all posts for sidebar
  let sidebarQuery = supabase
    .from('posts')
    .select('id, title, slug, created_at, updated_at, tags')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (!isLoggedIn) sidebarQuery = sidebarQuery.eq('published', true);
  const { data: allPosts } = await sidebarQuery;

  // Fetch main posts (with tag filter)
  let mainQuery = supabase
    .from('posts')
    .select('id, title, slug, excerpt, tags, published, pinned, pinned_until, publish_at, unpublish_at, comments_enabled, created_at, updated_at, user_id, content_type, thumbnail, attachments, content')
    .order('created_at', { ascending: false });
  if (!isLoggedIn) mainQuery = mainQuery.eq('published', true);
  if (selectedTag) mainQuery = mainQuery.contains('tags', [selectedTag]);
  const { data: posts } = await mainQuery;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} hasBio={hasBio} guestbookEnabled={guestbookEnabled} />

      <main className="max-w-6xl mx-auto px-6 py-10" style={{ paddingTop: "calc(64px + 2.5rem)" }}>
        {selectedTag && (
          <div className="mb-6 flex items-center gap-3">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)' }}>
              #{selectedTag}
            </span>
            <a href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '3px 10px', border: '1px solid var(--border)', borderRadius: '20px' }}>
              ✕ Clear filter
            </a>
          </div>
        )}

        <div className="layout-main" style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
          {/* Main Posts */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {posts && posts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((post: Post, i: number) => {
                  // 핀 포스트와 일반 포스트 사이에 구분선 표시
                  const prevPinned = i > 0 && posts[i - 1].pinned;
                  const showDivider = prevPinned && !post.pinned;
                  return (
                    <div key={post.id}>
                      {showDivider && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Posts
                          </span>
                          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        </div>
                      )}
                      <PostCard
                        post={post}
                        isOwner={isLoggedIn && user?.id === post.user_id}
                        index={i}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  No posts yet
                </div>
                <div style={{ fontSize: '0.9rem' }}>Write your first post.</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar-wrapper">
          <Sidebar
            posts={(allPosts as Post[]) || []}
            isLoggedIn={isLoggedIn}
            selectedTag={selectedTag}
          />
          </div>
        </div>
      </main>
    </div>
  );
}
