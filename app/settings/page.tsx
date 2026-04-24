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
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 사전 정의 컬러 팔레트
const PRESET_COLORS = [
  { label: '테라코타',  value: '#d4622a' },
  { label: '인디고',    value: '#4f46e5' },
  { label: '에메랄드',  value: '#059669' },
  { label: '로즈',      value: '#e11d48' },
  { label: '앰버',      value: '#d97706' },
  { label: '바이올렛',  value: '#7c3aed' },
  { label: '스카이',    value: '#0284c7' },
  { label: '핑크',      value: '#db2777' },
  { label: '슬레이트',  value: '#475569' },
  { label: '틸',        value: '#0d9488' },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  // 프로필 이미지
  const [profileImage, setProfileImage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // 블로그 이름
  const [blogName, setBlogName] = useState('블로그');
  const [blogNameInput, setBlogNameInput] = useState('블로그');
  const [savingName, setSavingName] = useState(false);

  // 소개글
  const [bio, setBio] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // 테마 컬러
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

      const name = data?.blog_name || '블로그';
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

  // ── 프로필 이미지 업로드 ────────────────────────────────
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
          showStatus('success', '프로필 이미지가 저장됐습니다. 파비콘은 페이지 새로고침 후 반영됩니다.');
        } catch (e: any) {
          showStatus('error', '저장 실패: ' + e.message);
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
      showStatus('success', '프로필 이미지가 삭제됐습니다.');
    } catch (e: any) {
      showStatus('error', '삭제 실패: ' + e.message);
    }
    setSavingProfile(false);
  };

  // ── 블로그 이름 저장 ───────────────────────────────────
  const handleSaveBlogName = async () => {
    const trimmed = blogNameInput.trim();
    if (!trimmed) { showStatus('error', '블로그 이름을 입력해주세요.'); return; }
    setSavingName(true);
    try {
      await upsertSettings({ blog_name: trimmed });
      setBlogName(trimmed);
      showStatus('success', '블로그 이름이 저장됐습니다.');
    } catch (e: any) {
      showStatus('error', '저장 실패: ' + e.message);
    }
    setSavingName(false);
  };

  // ── 소개글 저장 ───────────────────────────────────────
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await upsertSettings({ bio: bioInput });
      setBio(bioInput);
      showStatus('success', '소개글이 저장됐습니다.');
    } catch (e: any) {
      showStatus('error', '저장 실패: ' + e.message);
    }
    setSavingBio(false);
  };

  // ── 테마 컬러 저장 ─────────────────────────────────────
  const handleSaveColor = async () => {
    const hex = accentInput.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      showStatus('error', '올바른 HEX 색상 코드를 입력해주세요. (예: #d4622a)'); return;
    }
    setSavingColor(true);
    try {
      await upsertSettings({ accent_color: hex });
      setAccentColor(hex);
      applyAccent(hex); // 저장 즉시 페이지에 반영
      showStatus('success', '테마 컬러가 저장됐습니다.');
    } catch (e: any) {
      showStatus('error', '저장 실패: ' + e.message);
    }
    setSavingColor(false);
  };

  const handlePreviewColor = (hex: string) => {
    setAccentInput(hex);
    applyAccent(hex); // 선택 즉시 미리보기
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
      showStatus('success', `${posts?.length}개의 포스트를 백업했습니다.`);
    } catch (e: any) {
      showStatus('error', '백업 실패: ' + e.message);
    }
    setExporting(false);
  };

  // ── 파일 선택 → 미리보기 ──────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.posts || !Array.isArray(data.posts)) { showStatus('error', '올바른 백업 파일 형식이 아닙니다.'); return; }
        setImportPreview(data.posts);
        showStatus('info', `${data.posts.length}개의 포스트를 가져올 준비가 됐습니다.`);
      } catch { showStatus('error', 'JSON 파일을 파싱할 수 없습니다.'); }
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
      showStatus('success', `가져오기 완료: ${success}개 성공, ${skip}개 건너뜀`);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) { showStatus('error', '가져오기 실패: ' + e.message); }
    setImporting(false);
  };

  // ── 전체 삭제 ──────────────────────────────────────────
  const handleClearAll = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    try {
      const { error } = await supabase.from('posts').delete().eq('user_id', user.id);
      if (error) throw error;
      showStatus('success', '모든 포스트가 삭제됐습니다.');
      setConfirmClear(false);
    } catch (e: any) { showStatus('error', '삭제 실패: ' + e.message); }
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
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> 돌아가기
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>설정</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* 상태 메시지 */}
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

        {/* 계정 정보 */}
        <div style={card}>
          <h2 style={sectionTitle}>계정 정보</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>✍️</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{user?.email}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                가입일: {user?.created_at ? format(new Date(user.created_at), 'yyyy년 M월 d일', { locale: ko }) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 프로필 이미지 */}
        <div style={card}>
          <h2 style={sectionTitle}>🖼️ 프로필 이미지</h2>
          <p style={sectionDesc}>
            소개 페이지 아바타와 브라우저 파비콘에 사용됩니다. 정사각형 이미지를 권장합니다.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* 미리보기 */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--accent-subtle)', border: '2px solid var(--accent)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profileImage ? (
                <img src={profileImage} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserCircle2 size={40} style={{ color: 'var(--accent)', opacity: 0.5 }} />
              )}
            </div>
            {/* 버튼들 */}
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
                {savingProfile ? '저장 중...' : '이미지 선택'}
              </button>
              {profileImage && (
                <button
                  onClick={handleRemoveProfileImage}
                  disabled={savingProfile}
                  style={btn('danger')}
                >
                  <Trash2 size={14} /> 삭제
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            💡 파비콘은 저장 후 브라우저 새로고침(Ctrl+Shift+R) 시 반영됩니다.
          </p>
        </div>

        {/* 블로그 이름 */}
        <div style={card}>
          <h2 style={sectionTitle}>✏️ 블로그 이름</h2>
          <p style={sectionDesc}>
            GNB 로고에 표시됩니다. 현재: <strong style={{ color: 'var(--accent)' }}>{blogName}</strong>
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text" value={blogNameInput} maxLength={40}
              onChange={(e) => setBlogNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBlogName(); }}
              placeholder="블로그 이름 입력"
              style={inputStyle}
            />
            <button
              onClick={handleSaveBlogName}
              disabled={savingName || blogNameInput.trim() === blogName}
              style={{ ...btn('primary'), opacity: (savingName || blogNameInput.trim() === blogName) ? 0.5 : 1, cursor: (savingName || blogNameInput.trim() === blogName) ? 'not-allowed' : 'pointer' }}
            >
              {savingName ? <Loader2 size={14} /> : <Save size={14} />}
              {savingName ? '저장 중...' : '저장'}
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{blogNameInput.length} / 40자</div>
        </div>

        {/* 소개글 */}
        <div style={card}>
          <h2 style={sectionTitle}>📝 소개글</h2>
          <p style={sectionDesc}>
            소개 페이지에 표시됩니다. 마크다운을 지원합니다.
          </p>
          <textarea
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
            placeholder={"안녕하세요! 반갑습니다.\n\n이 블로그는 ..."}
            rows={6}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.7,
              fontFamily: 'var(--font-pretendard)',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {bioInput.length}자
            </span>
            <button
              onClick={handleSaveBio}
              disabled={savingBio || bioInput === bio}
              style={{ ...btn('primary'), opacity: (savingBio || bioInput === bio) ? 0.5 : 1, cursor: (savingBio || bioInput === bio) ? 'not-allowed' : 'pointer' }}
            >
              {savingBio ? <Loader2 size={14} /> : <Save size={14} />}
              {savingBio ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 테마 컬러 */}
        <div style={card}>
          <h2 style={sectionTitle}>🎨 테마 컬러</h2>
          <p style={sectionDesc}>
            버튼, 링크, 강조 색상에 사용됩니다. 현재:{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px', background: accentColor, border: '1px solid var(--border)', verticalAlign: 'middle' }} />
              <strong style={{ color: 'var(--accent)' }}>{accentColor}</strong>
            </span>
          </p>

          {/* 프리셋 팔레트 */}
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

          {/* 직접 입력 */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* 컬러 피커 */}
            <label style={{ position: 'relative', cursor: 'pointer' }} title="컬러 피커 열기">
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

            {/* HEX 직접 입력 */}
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
              {savingColor ? '저장 중...' : '저장'}
            </button>

            {/* 미리보기 변경된 경우 리셋 */}
            {accentInput !== accentColor && (
              <button
                onClick={() => handlePreviewColor(accentColor)}
                style={{ ...btn('secondary') as any, padding: '9px 12px' }}
                title="원래 색상으로"
              >
                되돌리기
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            💡 색상을 선택하면 즉시 미리보기가 적용됩니다. 저장 버튼을 눌러야 영구 반영됩니다.
          </p>
        </div>

        {/* 포스트 백업 */}
        <div style={card}>
          <h2 style={sectionTitle}>📦 포스트 백업</h2>
          <p style={sectionDesc}>모든 포스트를 JSON 파일로 내보냅니다.</p>
          <button onClick={handleExport} disabled={exporting} style={btn('primary')}>
            {exporting ? <Loader2 size={14} /> : <Download size={14} />}
            {exporting ? '내보내는 중...' : 'JSON으로 백업'}
          </button>
        </div>

        {/* 포스트 가져오기 */}
        <div style={card}>
          <h2 style={sectionTitle}>📥 포스트 가져오기 (마이그레이션)</h2>
          <p style={sectionDesc}>이전에 백업한 JSON 파일을 가져옵니다.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} id="import-file" />
              <label htmlFor="import-file" style={{ ...btn('secondary') as any, cursor: 'pointer' }}>
                <Upload size={14} /> JSON 파일 선택
              </label>
              {importPreview && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{importPreview.length}개 포스트 로드됨</span>}
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
                {importPreview.length > 20 && <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>외 {importPreview.length - 20}개...</div>}
              </div>
            )}
            {importPreview && (
              <button onClick={handleImport} disabled={importing} style={btn('primary')}>
                {importing ? <Loader2 size={14} /> : <Upload size={14} />}
                {importing ? '가져오는 중...' : `${importPreview.length}개 포스트 가져오기`}
              </button>
            )}
          </div>
        </div>

        {/* 위험 구역 */}
        <div style={{ ...card, border: '1px solid #fca5a5', background: '#fff5f5' }}>
          <h2 style={{ ...sectionTitle, color: '#dc2626' }}>⚠️ 위험 구역</h2>
          <p style={{ ...sectionDesc, color: '#ef4444' }}>아래 작업은 되돌릴 수 없습니다. 백업 후 진행하세요.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleClearAll} style={btn('danger')}>
              <Trash2 size={14} />
              {confirmClear ? '정말로 삭제하시겠습니까? (한 번 더 클릭)' : '모든 포스트 삭제'}
            </button>
            {confirmClear && <button onClick={() => setConfirmClear(false)} style={btn('secondary')}>취소</button>}
          </div>
        </div>
      </main>
    </div>
  );
}
