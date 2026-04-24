import { createClient } from '@/lib/supabase/server';
import GNB from '@/components/GNB';
import { getBlogName } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const blogName = await getBlogName();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GNB isLoggedIn={isLoggedIn} blogName={blogName} />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '2rem' }}>
            ✍️
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            소개
          </h1>
          <div style={{ height: '3px', width: '40px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '28px' }} />
          <div className="post-content" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>안녕하세요, <strong>{blogName}</strong>에 오신 것을 환영합니다.</p>
            <p>이 블로그는 일상, 기술, 생각들을 기록하는 공간입니다.</p>
            <p>Supabase와 Vercel을 기반으로 Next.js 14로 구축되었으며, 라이트/다크 모드와 WYSIWYG 및 마크다운 에디터를 지원합니다.</p>
          </div>
          <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['Next.js 14', 'Supabase', 'Vercel', 'TipTap', 'TypeScript'].map((tech) => (
              <span key={tech} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '20px' }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
