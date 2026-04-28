'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import nextDynamic from 'next/dynamic';
import { Save, X, Eye, EyeOff, Tag as TagIcon, Paperclip, FileText, FileImage, File, Trash2, Pin, Calendar, Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { extractFirstImage } from '@/lib/extractFirstImage';
import { uploadFile, deleteFile, extractStoragePath } from '@/lib/storage';

const WysiwygEditor = nextDynamic(() => import('@/components/WysiwygEditor'), { ssr: false });
const MarkdownEditor = nextDynamic(() => import('@/components/MarkdownEditor'), { ssr: false });

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  url: string;       // Storage public URL
  storagePath: string; // 삭제용 경로
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
  const [pinned, setPinned] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [pinnedUntil, setPinnedUntil] = useState('');       // KST datetime-local string
  const [publishAt, setPublishAt] = useState('');           // 예약 공개
  const [unpublishAt, setUnpublishAt] = useState('');       // 예약 비공개
  const [showSchedule, setShowSchedule] = useState(false);  // 스케줄 패널 열림 여부
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
          setPinned(data.pinned || false);
          setCommentsEnabled(data.comments_enabled ?? true);
          // datetime-local은 "YYYY-MM-DDTHH:mm" 형식 필요 (KST 변환)
          const toLocal = (iso: string | null) => {
            if (!iso) return '';
            const d = new Date(iso);
            const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
            return kst.toISOString().slice(0, 16);
          };
          setPinnedUntil(toLocal(data.pinned_until));
          setPublishAt(toLocal(data.publish_at));
          setUnpublishAt(toLocal(data.unpublish_at));
          if (data.pinned_until || data.publish_at || data.unpublish_at) setShowSchedule(true);
          // Attachments 복원
          if (data.attachments) {
            try {
              const parsed = JSON.parse(data.attachments);
              // 이전 base64 형식(dataUrl) → url 없으면 제외
              setAttachments(parsed.filter((f: any) => f.url || f.dataUrl).map((f: any) => ({
                name: f.name, size: f.size, type: f.type,
                url: f.url || f.dataUrl || '',
                storagePath: f.storagePath || '',
              })));
            } catch {}
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

  // Attachments — Storage 업로드
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of files) {
      try {
        const ext = file.name.split('.').pop() || 'bin';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${user.id}/${Date.now()}_${safeName}`;
        const url = await uploadFile('blog-media', storagePath, file);
        setAttachments((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type, url, storagePath },
        ]);
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = async (idx: number) => {
    const file = attachments[idx];
    if (file?.storagePath) {
      await deleteFile('blog-media', file.storagePath).catch(() => {});
    }
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!content.trim()) { setError('Please enter content.'); return; }
    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const firstImage = extractFirstImage(content, contentType);
    // base64 이미지는 thumbnail에 그대로 저장, 외부 URL은 그대로 저장
    const payload = {
      title: title.trim(),
      content,
      content_type: contentType,
      tags,
      published,
      excerpt: generateExcerpt(content, contentType),
      user_id: user.id,
      attachments: attachments.length > 0 ? JSON.stringify(attachments.map(({ name, size, type, url, storagePath }) => ({ name, size, type, url, storagePath }))) : null,
      thumbnail: firstImage || null,
      pinned,
      comments_enabled: commentsEnabled,
      // datetime-local → UTC ISO (KST 기준 입력이므로 -9h)
      pinned_until: pinnedUntil
        ? new Date(new Date(pinnedUntil).getTime() - 9 * 60 * 60 * 1000).toISOString()
        : null,
      publish_at: publishAt
        ? new Date(new Date(publishAt).getTime() - 9 * 60 * 60 * 1000).toISOString()
        : null,
      unpublish_at: unpublishAt
        ? new Date(new Date(unpublishAt).getTime() - 9 * 60 * 60 * 1000).toISOString()
        : null,
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
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-end mobile-px">
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
              <button
                onClick={() => setPinned(!pinned)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: pinned ? '#f5f3ff' : 'var(--bg-secondary)',
                  border: `1px solid ${pinned ? '#7c3aed' : 'var(--border)'}`,
                  color: pinned ? '#7c3aed' : 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-pretendard)',
                }}
              >
                <Pin size={13} />
                {pinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                onClick={() => setCommentsEnabled(!commentsEnabled)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: commentsEnabled ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                  border: `1px solid ${commentsEnabled ? 'var(--accent)' : 'var(--border)'}`,
                  color: commentsEnabled ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-pretendard)',
                }}
              >
                <MessageCircle size={13} />
                {commentsEnabled ? 'Comments On' : 'Comments Off'}
              </button>
            </div>
          </div>

          {/* ③ Editor content */}
          {contentType === 'wysiwyg' ? (
            <WysiwygEditor value={content} onChange={setContent} />
          ) : (
            <MarkdownEditor value={content} onChange={setContent} />
          )}

          {/* ④ Scheduling panel */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)' }}>
            {/* Header toggle */}
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-secondary)',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-pretendard)',
                borderBottom: showSchedule ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Calendar size={13} />
                Scheduling
                {(pinnedUntil || publishAt || unpublishAt) && (
                  <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem' }}>
                    {[pinnedUntil, publishAt, unpublishAt].filter(Boolean).length}
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{showSchedule ? '▲' : '▼'}</span>
            </button>

            {showSchedule && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Pin until */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#7c3aed', marginBottom: '6px' }}>
                    <Pin size={12} /> Pin until (leave empty for permanent)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      value={pinnedUntil}
                      onChange={e => {
                        setPinnedUntil(e.target.value);
                        if (e.target.value) setPinned(true);
                      }}
                      style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
                    />
                    {pinnedUntil && (
                      <button type="button" onClick={() => setPinnedUntil('')}
                        style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-pretendard)' }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Publish at */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                    <Clock size={12} /> Scheduled publish (auto-publish at this time)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      value={publishAt}
                      onChange={e => {
                        setPublishAt(e.target.value);
                        if (e.target.value) setPublished(false);
                      }}
                      style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
                    />
                    {publishAt && (
                      <button type="button" onClick={() => setPublishAt('')}
                        style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-pretendard)' }}>
                        Clear
                      </button>
                    )}
                  </div>
                  {publishAt && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Post will be set to Private now and auto-published at the scheduled time.</p>}
                </div>

                {/* Unpublish at */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#d97706', marginBottom: '6px' }}>
                    <EyeOff size={12} /> Scheduled unpublish (auto-hide at this time)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      value={unpublishAt}
                      onChange={e => setUnpublishAt(e.target.value)}
                      style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
                    />
                    {unpublishAt && (
                      <button type="button" onClick={() => setUnpublishAt('')}
                        style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-pretendard)' }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ⑤ Attachments */}
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
