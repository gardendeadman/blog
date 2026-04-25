'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { applyAccent } from '@/components/ThemeColorInjector';
import {
  Download, Upload, Trash2, AlertTriangle, CheckCircle,
  Loader2, ArrowLeft, Save, Palette, UserCircle2,
} from 'lucide-react';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import AnalyticsSection from '@/components/AnalyticsSection';

const MDEditor = nextDynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import { formatKST } from '@/lib/formatDate';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 사전 정의 컬러 팔레트
const PRESET_COLORS = [
  { label: 'Terracotta',  value: '#d4622a' },
  { label: 'Indigo',    value: '#4f46e5' },
  { label: 'Emerald',  value: '#059669' },
  { label: 'Rose',      value: '#e11d48' },
  { label: 'Amber',      value: '#d97706' },
  { label: 'Violet',  value: '#7c3aed' },
  { label: 'Sky',    value: '#0284c7' },
  { label: 'Pink',      value: '#db2777' },
  { label: 'Slate',  value: '#475569' },
  { label: 'Teal',        value: '#0d9488' },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  // Profile image
  const [profileImage, setProfileImage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Blog name
  const [blogName, setBlogName] = useState('Blog');
  const [blogNameInput, setBlogNameInput] = useState('Blog');
  const [savingName, setSavingName] = useState(false);

  // Bio
  const [bio, setBio] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Theme color
  const [accentColor, setAccentColor] = useState('#d4622a');
  const [accentInput, setAccentInput] = useState('#d4622a');
  const [savingColor, setSavingColor] = useState(false);

  // 백업/마이그레이션
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase
        .from('blog_settings')
        .select('blog_name, accent_color, bio, profile_image')
        .eq('user_id', user.id)
        .single();

      const name = data?.blog_name || 'Blog';
      const color = data?.accent_color || '#d4622a';
      const bioVal = data?.bio || '';
      const profileVal = data?.profile_image || '';
      setBlogName(name);
      setBlogNameInput(name);
      setAccentColor(color);
      setAccentInput(color);
      setBio(bioVal);
      setBioInput(bioVal);
      setProfileImage(profileVal);

      setLoading(false);
    });
  }, []);

  const showStatus = (type: 'success' | 'error' | 'info', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 5000);
  };

  // ── 공통 upsert helper ─────────────────────────────────
  const upsertSettings = async (patch: Record<string, string>) => {
    const { data: existing } = await supabase
      .from('blog_settings').select('id').eq('user_id', user.id).single();
    if (existing) {
      await supabase.from('blog_settings')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase.from('blog_settings')
        .insert({ user_id: user.id, ...patch });
    }
  };

  // ── Profile image 업로드 ────────────────────────────────
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      // 256×256 으로 리사이즈
      const img = new window.Image();
      img.onload = async () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // 정사각형 크롭 후 리사이즈
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const resized = canvas.toDataURL('image/png');
        setSavingProfile(true);
        try {
          await upsertSettings({ profile_image: resized });
          setProfileImage(resized);
          showStatus('success', 'Profile image saved. Favicon updates after refresh.');
        } catch (e: any) {
          showStatus('error', 'Save failed: ' + e.message);
        }
        setSavingProfile(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveProfileImage = async () => {
    setSavingProfile(true);
    try {
      await upsertSettings({ profile_image: '' });
      setProfileImage('');
      showStatus('success', 'Profile image removed.');
    } catch (e: any) {
      showStatus('error', 'Delete failed: ' + e.message);
    }
    setSavingProfile(false);
  };

  // ── Blog name Save ───────────────────────────────────
  const handleSaveBlogName = async () => {
    const trimmed = blogNameInput.trim();
    if (!trimmed) { showStatus('error', 'Please enter a blog name.'); return; }
    setSavingName(true);
    try {
      await upsertSettings({ blog_name: trimmed });
      setBlogName(trimmed);
      showStatus('success', 'Blog name saved.');
    } catch (e: any) {
      showStatus('error', 'Save failed: ' + e.message);
    }
    setSavingName(false);
  };

  // ── Bio Save ───────────────────────────────────────
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await upsertSettings({ bio: bioInput });
      setBio(bioInput);
      showStatus('success', 'Bio saved.');
    } catch (e: any) {
      showStatus('error', 'Save failed: ' + e.message);
    }
    setSavingBio(false);
  };

  // ── Theme color Save ─────────────────────────────────────
  const handleSaveColor = async () => {
    const hex = accentInput.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      showStatus('error', 'Enter a valid HEX color code (e.g. #d4622a).'); return;
    }
    setSavingColor(true);
    try {
      await upsertSettings({ accent_color: hex });
      setAccentColor(hex);
      applyAccent(hex); // Save 즉시 페이지에 반영
      showStatus('success', 'Theme color saved.');
    } catch (e: any) {
      showStatus('error', 'Save failed: ' + e.message);
    }
    setSavingColor(false);
  };

  const handlePreviewColor = (hex: string) => {
    setAccentInput(hex);
    applyAccent(hex); // 선택 즉시 Preview
  };

  // ── 백업 ───────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: posts, error } = await supabase
        .from('posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const backup = { version: '1.0', exported_at: new Date().toISOString(), post_count: posts?.length || 0, posts: posts || [] };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-backup-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('success', `${posts?.length} posts exported.`);
    } catch (e: any) {
      showStatus('error', 'Backup failed: ' + e.message);
    }
    setExporting(false);
  };

  // ── 파일 선택 → Preview ──────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.posts || !Array.isArray(data.posts)) { showStatus('error', 'Invalid backup file format.'); return; }
        setImportPreview(data.posts);
        showStatus('info', `${data.posts.length} posts ready to import.`);
      } catch { showStatus('error', 'Could not parse JSON file.'); }
    };
    reader.readAsText(file);
  };

  // ── 마이그레이션 ───────────────────────────────────────
  const handleImport = async () => {
    if (!importPreview || !user) return;
    setImporting(true);
    try {
      let success = 0, skip = 0;
      for (const post of importPreview) {
        const { data: existing } = await supabase.from('posts').select('id').eq('slug', post.slug).single();
        if (existing) post.slug = post.slug + '-import-' + Date.now();
        const { error } = await supabase.from('posts').insert({
          title: post.title, content: post.content, content_type: post.content_type || 'wysiwyg',
          slug: post.slug, excerpt: post.excerpt, tags: post.tags || [],
          published: post.published ?? true, user_id: user.id,
          created_at: post.created_at, updated_at: post.updated_at,
        });
        if (error) { skip++; } else { success++; }
      }
      showStatus('success', `Import complete: ${success} succeeded, ${skip} skipped`);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) { showStatus('error', 'Import failed: ' + e.message); }
    setImporting(false);
  };

  // ── 전체 Delete ──────────────────────────────────────────
  const handleClearAll = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    try {
      const { error } = await supabase.from('posts').delete().eq('user_id', user.id);
      if (error) throw error;
      showStatus('success', 'All posts deleted.');
      setConfirmClear(false);
    } catch (e: any) { showStatus('error', 'Delete failed: ' + e.message); }
  };

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '28px', marginBottom: '20px',
  };

  const btn = (variant: 'primary' | 'secondary' | 'danger'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 18px', borderRadius: '8px', fontSize: '0.875rem',
    fontWeight: 600, cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-pretendard)', transition: 'opacity 0.15s ease',
    ...(variant === 'primary' && { background: 'var(--accent)', color: 'white' }),
    ...(variant === 'secondary' && { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' } as any),
    ...(variant === 'danger' && { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' } as any),
  });

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: '1.125rem',
    fontWeight: 600, color: 'var(--text)', marginBottom: '6px',
  };

  const sectionDesc: React.CSSProperties = {
    fontSize: '0.875rem', color: 'var(--text-muted)',
    marginBottom: '20px', lineHeight: 1.6,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '10px 14px', border: '1px solid var(--border)',
    borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text)',
    fontSize: '0.925rem', fontFamily: 'var(--font-pretendard)', outline: 'none',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4 mobile-px">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 mobile-px mobile-py">

        {/* Status message */}
        {status && (
          <div className="animate-fade-in" style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '8px',
            display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem',
            background: status.type === 'success' ? '#f0fdf4' : status.type === 'error' ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${status.type === 'success' ? '#86efac' : status.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
            color: status.type === 'success' ? '#16a34a' : status.type === 'error' ? '#dc2626' : '#2563eb',
          }}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {status.msg}
          </div>
        )}

        {/* Account */}
        <div style={card}>
          <h2 style={sectionTitle}>Account</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>✍️</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{user?.email}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Joined: {user?.created_at ? formatKST(user.created_at) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile image */}
        <div style={card}>
          <h2 style={sectionTitle}>🖼️ Profile Image</h2>
          <p style={sectionDesc}>
            Used as avatar on the About page and browser favicon. Square image recommended.
          </p>
          <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Preview */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--accent-subtle)', border: '2px solid var(--accent)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserCircle2 size={40} style={{ color: 'var(--accent)', opacity: 0.5 }} />
              )}
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
              />
              <button
                onClick={() => profileInputRef.current?.click()}
                disabled={savingProfile}
                style={{ ...btn('primary'), opacity: savingProfile ? 0.5 : 1 }}
              >
                {savingProfile ? <Loader2 size={14} /> : <Upload size={14} />}
                {savingProfile ? 'Saving...' : 'Choose image'}
              </button>
              {profileImage && (
                <button
                  onClick={handleRemoveProfileImage}
                  disabled={savingProfile}
                  style={btn('danger')}
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            💡 Favicon updates after a hard refresh (Ctrl+Shift+R).
          </p>
        </div>

        {/* Blog name */}
        <div style={card}>
          <h2 style={sectionTitle}>✏️ Blog Name</h2>
          <p style={sectionDesc}>
            Displayed in the header. Current: <strong style={{ color: 'var(--accent)' }}>{blogName}</strong>
          </p>
          <div className="form-row-mobile" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text" value={blogNameInput} maxLength={40}
              onChange={(e) => setBlogNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBlogName(); }}
              placeholder="Enter blog name"
              style={inputStyle}
            />
            <button
              onClick={handleSaveBlogName}
              disabled={savingName || blogNameInput.trim() === blogName}
              style={{ ...btn('primary'), opacity: (savingName || blogNameInput.trim() === blogName) ? 0.5 : 1, cursor: (savingName || blogNameInput.trim() === blogName) ? 'not-allowed' : 'pointer' }}
            >
              {savingName ? <Loader2 size={14} /> : <Save size={14} />}
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{blogNameInput.length} / 40chars</div>
        </div>

        {/* Bio */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={sectionTitle}>📝 Bio</h2>
            <p style={{ ...sectionDesc, marginBottom: 0 }}>
              Displayed on the About page. Markdown is supported.
            </p>
          </div>
          {/* Markdown editor — full width */}
          <div data-color-mode="auto" style={{ width: '100%' }}>
            <MDEditor
              value={bioInput}
              onChange={(v) => setBioInput(v || '')}
              height={360}
              preview="live"
              style={{ width: '100%', borderRadius: 0, border: 'none' }}
            />
          </div>
          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {bioInput.length}chars
            </span>
            <button
              onClick={handleSaveBio}
              disabled={savingBio || bioInput === bio}
              style={{ ...btn('primary'), opacity: (savingBio || bioInput === bio) ? 0.5 : 1, cursor: (savingBio || bioInput === bio) ? 'not-allowed' : 'pointer' }}
            >
              {savingBio ? <Loader2 size={14} /> : <Save size={14} />}
              {savingBio ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Theme color */}
        <div style={card}>
          <h2 style={sectionTitle}>🎨 Theme Color</h2>
          <p style={sectionDesc}>
            Used for buttons, links, and accents. Current:{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px', background: accentColor, border: '1px solid var(--border)', verticalAlign: 'middle' }} />
              <strong style={{ color: 'var(--accent)' }}>{accentColor}</strong>
            </span>
          </p>

          {/* Preset palette */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handlePreviewColor(c.value)}
                title={c.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                }}
              >
                <span style={{
                  display: 'block', width: '36px', height: '36px', borderRadius: '8px',
                  background: c.value,
                  border: accentInput === c.value ? '3px solid var(--text)' : '2px solid transparent',
                  boxShadow: accentInput === c.value ? '0 0 0 1px var(--text)' : '0 1px 4px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease',
                }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Color picker */}
            <label style={{ position: 'relative', cursor: 'pointer' }} title="Open color picker">
              <input
                type="color"
                value={accentInput}
                onChange={(e) => handlePreviewColor(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: '44px', height: '44px', cursor: 'pointer', inset: 0 }}
              />
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '44px', height: '44px', borderRadius: '8px',
                background: accentInput, border: '2px solid var(--border)', cursor: 'pointer',
                transition: 'background 0.1s',
              }}>
                <Palette size={16} color="white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
              </span>
            </label>

            {/* HEX Custom input */}
            <input
              type="text"
              value={accentInput}
              onChange={(e) => handlePreviewColor(e.target.value)}
              placeholder="#d4622a"
              maxLength={7}
              style={{ ...inputStyle, maxWidth: '140px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
            />

            <button
              onClick={handleSaveColor}
              disabled={savingColor || accentInput === accentColor}
              style={{ ...btn('primary'), opacity: (savingColor || accentInput === accentColor) ? 0.5 : 1, cursor: (savingColor || accentInput === accentColor) ? 'not-allowed' : 'pointer' }}
            >
              {savingColor ? <Loader2 size={14} /> : <Save size={14} />}
              {savingColor ? 'Saving...' : 'Save'}
            </button>

            {/* Preview 변경된 경우 리셋 */}
            {accentInput !== accentColor && (
              <button
                onClick={() => handlePreviewColor(accentColor)}
                style={{ ...btn('secondary') as any, padding: '9px 12px' }}
                title="Reset color"
              >
                Reset
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            💡 Changes preview instantly. Click Save to apply permanently.
          </p>
        </div>

        {/* Analytics */}
        <AnalyticsSection />

        {/* Post backup */}
        <div style={card}>
          <h2 style={sectionTitle}>📦 Backup Posts</h2>
          <p style={sectionDesc}>Export all posts as a JSON file.</p>
          <button onClick={handleExport} disabled={exporting} style={btn('primary')}>
            {exporting ? <Loader2 size={14} /> : <Download size={14} />}
            {exporting ? 'Exporting...' : 'Export as JSON'}
          </button>
        </div>

        {/* Import posts */}
        <div style={card}>
          <h2 style={sectionTitle}>📥 Import Posts (Migration)</h2>
          <p style={sectionDesc}>Import a previously exported JSON backup.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} id="import-file" />
              <label htmlFor="import-file" style={{ ...btn('secondary') as any, cursor: 'pointer' }}>
                <Upload size={14} /> Choose JSON file
              </label>
              {importPreview && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{importPreview.length} posts loaded</span>}
            </div>
            {importPreview && importPreview.length > 0 && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' }}>
                {importPreview.slice(0, 20).map((post, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderBottom: i < Math.min(importPreview.length, 20) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{post.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                      {post.created_at ? format(new Date(post.created_at), 'yy.MM.dd', { locale: ko }) : '-'}
                    </span>
                  </div>
                ))}
                {importPreview.length > 20 && <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>and {importPreview.length - 20} more...</div>}
              </div>
            )}
            {importPreview && (
              <button onClick={handleImport} disabled={importing} style={btn('primary')}>
                {importing ? <Loader2 size={14} /> : <Upload size={14} />}
                {importing ? 'Importing...' : `${importPreview.length} posts`}
              </button>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...card, border: '1px solid #fca5a5', background: '#fff5f5' }}>
          <h2 style={{ ...sectionTitle, color: '#dc2626' }}>⚠️ Danger Zone</h2>
          <p style={{ ...sectionDesc, color: '#ef4444' }}>These actions cannot be undone. Please backup first.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleClearAll} style={btn('danger')}>
              <Trash2 size={14} />
              {confirmClear ? 'Are you sure? Click again to confirm' : 'Delete all posts'}
            </button>
            {confirmClear && <button onClick={() => setConfirmClear(false)} style={btn('secondary')}>Cancel</button>}
          </div>
        </div>
      </main>
    </div>
  );
}
