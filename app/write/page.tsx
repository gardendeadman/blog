'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import nextDynamic from 'next/dynamic';
import { Save, X, Eye, EyeOff, Tag as TagIcon, Paperclip, FileText, FileImage, File, Trash2 } from 'lucide-react';
import Link from 'next/link';

const WysiwygEditor = nextDynamic(() => import('@/components/WysiwygEditor'), { ssr: false });
const MarkdownEditor = nextDynamic(() => import('@/components/MarkdownEditor'), { ssr: false });

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <FileImage size={14} />;
  if (type.includes('pdf') || type.includes('text')) return <FileText size={14} />;
  return <File size={14} />;
}

function WritePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(true);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
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
          // Attachments 복원
          if (data.attachments) {
            try { setAttachments(JSON.parse(data.attachments)); } catch {}
          }
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
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return (base || 'post') + '-' + Date.now();
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

  // Attachments
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type, dataUrl },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!content.trim()) { setError('Please enter content.'); return; }
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
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
    };

    if (postId) {
      const { error } = await supabase.from('posts').update(payload).eq('id', postId);
      if (error) { setError('Failed to save: ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('posts').insert({ ...payload, slug: generateSlug(title) });
      if (error) { setError('Failed to save: ' + error.message); setSaving(false); return; }
    }
    router.push('/');
    router.refresh();
  };

  const inputStyle: React.CSSProperties = {
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
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between mobile-px">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', padding: '7px 14px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <X size={14} /> Cancel
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
              {saving ? 'Saving...' : (postId ? 'Update' : 'Publish')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 mobile-px mobile-py" style={{ paddingTop: 'calc(64px + 2rem)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', fontSize: '0.875rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* ① Title */}
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              ...inputStyle,
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
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

          {/* ② Editor type toggle + visibility */}
          <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Editor
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
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                {published ? 'Public' : 'Private'}
              </button>
            </div>
          </div>

          {/* ③ Editor content */}
          {contentType === 'wysiwyg' ? (
            <WysiwygEditor value={content} onChange={setContent} />
          ) : (
            <MarkdownEditor value={content} onChange={setContent} />
          )}

          {/* ④ Attachments */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'var(--bg-card)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderBottom: attachments.length > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={13} />
                Attachments
                {attachments.length > 0 && (
                  <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem' }}>
                    {attachments.length}
                  </span>
                )}
              </span>
              <label
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileAttach}
                />
                + Choose file
              </label>
            </div>

            {/* Attachment list */}
            {attachments.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                {attachments.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 16px',
                      borderBottom: i < attachments.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                      <FileIcon type={f.type} />
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatBytes(f.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '2px', flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty dropzone */}
            {attachments.length === 0 && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                Select files to attach
              </div>
            )}
          </div>

          {/* ⑤ Tags (bottom) */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TagIcon size={13} />
              Tags
            </div>
            {/* Tag list */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
                      background: 'var(--accent-subtle)', padding: '4px 10px',
                      borderRadius: '20px', cursor: 'pointer',
                    }}
                  >
                    #{tag} ×
                  </span>
                ))}
              </div>
            )}
            {/* Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add tag and press Enter"
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
                <TagIcon size={13} /> Add
              </button>
            </div>
          </div>

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
