'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      setLoading(false);
    });
  }, []);

  const showStatus = (type: 'success' | 'error' | 'info', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 5000);
  };

  // ── 백업 (Export) ──────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const backup = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        post_count: posts?.length || 0,
        posts: posts || [],
      };

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

  // ── 파일 선택 → 미리보기 ───────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.posts || !Array.isArray(data.posts)) {
          showStatus('error', '올바른 백업 파일 형식이 아닙니다.');
          return;
        }
        setImportPreview(data.posts);
        showStatus('info', `${data.posts.length}개의 포스트를 가져올 준비가 됐습니다. 아래에서 확인 후 가져오기를 실행하세요.`);
      } catch {
        showStatus('error', 'JSON 파일을 파싱할 수 없습니다.');
      }
    };
    reader.readAsText(file);
  };

  // ── 마이그레이션 (Import) ─────────────────────────────
  const handleImport = async () => {
    if (!importPreview || !user) return;
    setImporting(true);

    try {
      let success = 0;
      let skip = 0;

      for (const post of importPreview) {
        // slug 중복 체크
        const { data: existing } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', post.slug)
          .single();

        if (existing) {
          // slug 충돌 시 새 slug 생성
          post.slug = post.slug + '-import-' + Date.now();
        }

        const { error } = await supabase.from('posts').insert({
          title: post.title,
          content: post.content,
          content_type: post.content_type || 'wysiwyg',
          slug: post.slug,
          excerpt: post.excerpt,
          tags: post.tags || [],
          published: post.published ?? true,
          user_id: user.id,
          created_at: post.created_at,
          updated_at: post.updated_at,
        });

        if (error) { skip++; } else { success++; }
      }

      showStatus('success', `가져오기 완료: ${success}개 성공, ${skip}개 건너뜀`);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      showStatus('error', '가져오기 실패: ' + e.message);
    }
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
    } catch (e: any) {
      showStatus('error', '삭제 실패: ' + e.message);
    }
  };

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '28px',
    marginBottom: '20px',
  };

  const btnStyle = (variant: 'primary' | 'secondary' | 'danger') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'var(--font-pretendard)',
    transition: 'opacity 0.15s ease',
    ...(variant === 'primary' && { background: 'var(--accent)', color: 'white' }),
    ...(variant === 'secondary' && { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }),
    ...(variant === 'danger' && { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }),
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
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

        {/* Status */}
        {status && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.875rem',
              background: status.type === 'success' ? '#f0fdf4' : status.type === 'error' ? '#fef2f2' : '#eff6ff',
              border: `1px solid ${status.type === 'success' ? '#86efac' : status.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
              color: status.type === 'success' ? '#16a34a' : status.type === 'error' ? '#dc2626' : '#2563eb',
            }}
            className="animate-fade-in"
          >
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {status.msg}
          </div>
        )}

        {/* Account Info */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
            계정 정보
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              ✍️
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{user?.email}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                가입일: {user?.created_at ? format(new Date(user.created_at), 'yyyy년 M월 d일', { locale: ko }) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            📦 포스트 백업
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
            모든 포스트를 JSON 파일로 내보냅니다. 이 파일로 다른 블로그에 마이그레이션하거나 복구할 수 있습니다.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={btnStyle('primary') as any}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? '내보내는 중...' : 'JSON으로 백업'}
          </button>
        </div>

        {/* Migration / Import */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            📥 포스트 가져오기 (마이그레이션)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
            이전에 백업한 JSON 파일을 가져옵니다. slug 중복 시 자동으로 새 slug를 생성합니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="import-file"
              />
              <label
                htmlFor="import-file"
                style={{ ...(btnStyle('secondary') as any), cursor: 'pointer' }}
              >
                <Upload size={14} /> JSON 파일 선택
              </label>
              {importPreview && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {importPreview.length}개 포스트 로드됨
                </span>
              )}
            </div>

            {/* Import Preview */}
            {importPreview && importPreview.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}
              >
                {importPreview.slice(0, 20).map((post, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      borderBottom: i < Math.min(importPreview.length, 20) - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {post.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                      {post.created_at ? format(new Date(post.created_at), 'yy.MM.dd', { locale: ko }) : '-'}
                    </span>
                  </div>
                ))}
                {importPreview.length > 20 && (
                  <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    외 {importPreview.length - 20}개...
                  </div>
                )}
              </div>
            )}

            {importPreview && (
              <button
                onClick={handleImport}
                disabled={importing}
                style={btnStyle('primary') as any}
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {importing ? '가져오는 중...' : `${importPreview.length}개 포스트 가져오기`}
              </button>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            ...cardStyle,
            border: '1px solid #fca5a5',
            background: '#fff5f5',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
            ⚠️ 위험 구역
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: '20px', lineHeight: 1.6 }}>
            아래 작업은 되돌릴 수 없습니다. 백업 후 진행하세요.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleClearAll}
              style={btnStyle('danger') as any}
            >
              <Trash2 size={14} />
              {confirmClear ? '정말로 삭제하시겠습니까? (한 번 더 클릭)' : '모든 포스트 삭제'}
            </button>
            {confirmClear && (
              <button
                onClick={() => setConfirmClear(false)}
                style={btnStyle('secondary') as any}
              >
                취소
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
