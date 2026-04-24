'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { Save, X, Eye, EyeOff, Tag as TagIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const WysiwygEditor = dynamic(() => import('@/components/WysiwygEditor'), { ssr: false });
const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), { ssr: false });

function WritePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
    };
    checkAuth();

    if (postId) {
      setLoading(true);
      supabase.from('posts').select('*').eq('id', postId).single().then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setContentType(data.content_type || 'wysiwyg');
          setTags(data.tags || []);
          setPublished(data.published);
        }
        setLoading(false);
      });
    }
  }, [postId]);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const generateSlug = (title: string) => {
    return (
      title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) +
      '-' +
      Date.now()
    );
  };

  const generateExcerpt = (content: string, type: string) => {
    let text = content;
    if (type === 'wysiwyg') {
      text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      text = content.replace(/[#*`>\-\[\]!]/g, '').replace(/\s+/g, ' ').trim();
    }
    return text.slice(0, 200);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }
    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const payload = {
      title: title.trim(),
      content,
      content_type: contentType,
      tags,
      published,
      excerpt: generateExcerpt(content, contentType),
      user_id: user.id,
    };

    if (postId) {
      const { error } = await supabase.from('posts').update(payload).eq('id', postId);
      if (error) { setError('저장에 실패했습니다: ' + error.message); setSaving(false); return; }
      router.push('/');
      router.refresh();
    } else {
      const { error } = await supabase.from('posts').insert({
        ...payload,
        slug: generateSlug(title),
      });
      if (error) { setError('저장에 실패했습니다: ' + error.message); setSaving(false); return; }
      router.push('/');
      router.refresh();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
    color: 'var(--text)',
    fontSize: '0.925rem',
    fontFamily: 'var(--font-pretendard)',
    outline: 'none',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>
            블로그
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', padding: '7px 14px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <X size={14} /> 취소
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', background: saving ? 'var(--text-muted)' : 'var(--accent)',
                border: 'none', borderRadius: '8px', color: 'white',
                fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-pretendard)',
              }}
            >
              <Save size={14} />
              {saving ? '저장 중...' : (postId ? '수정 완료' : '발행')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', fontSize: '0.875rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              ...inputStyle,
              fontSize: '1.75rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              padding: '14px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid var(--border)',
              borderRadius: 0,
              letterSpacing: '-0.01em',
            }}
          />

          {/* Tags */}
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
                    background: 'var(--accent-subtle)', padding: '4px 10px',
                    borderRadius: '20px', cursor: 'pointer',
                  }}
                  onClick={() => removeTag(tag)}
                >
                  #{tag} ×
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="#태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                style={{ ...inputStyle, flex: 1, fontSize: '0.875rem' }}
              />
              <button
                type="button"
                onClick={addTag}
                style={{
                  padding: '8px 16px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--text-secondary)', fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'var(--font-pretendard)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <TagIcon size={13} /> 추가
              </button>
            </div>
          </div>

          {/* Editor Type Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              에디터
            </span>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
              {(['wysiwyg', 'markdown'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  style={{
                    padding: '5px 14px', borderRadius: '6px', border: 'none',
                    background: contentType === type ? 'var(--accent)' : 'transparent',
                    color: contentType === type ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-pretendard)', transition: 'all 0.15s ease',
                  }}
                >
                  {type === 'wysiwyg' ? 'WYSIWYG' : 'Markdown'}
                </button>
              ))}
            </div>

            {/* Published toggle */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>공개</span>
              <button
                onClick={() => setPublished(!published)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: published ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                  border: `1px solid ${published ? 'var(--accent)' : 'var(--border)'}`,
                  color: published ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-pretendard)',
                }}
              >
                {published ? <Eye size={13} /> : <EyeOff size={13} />}
                {published ? '공개' : '비공개'}
              </button>
            </div>
          </div>

          {/* Editor */}
          {contentType === 'wysiwyg' ? (
            <WysiwygEditor value={content} onChange={setContent} />
          ) : (
            <MarkdownEditor value={content} onChange={setContent} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <WritePageInner />
    </Suspense>
  );
}
