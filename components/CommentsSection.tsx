'use client';

import { useState } from 'react';
import { formatKST } from '@/lib/formatDate';
import { Trash2, Send, Lock, User, MessageCircle, Loader2, X } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface Props {
  postId: string;
  initialComments: Comment[];
  isAdmin: boolean;
  commentsEnabled: boolean;
}

function DeleteModal({
  comment, isAdmin, onConfirm, onCancel,
}: {
  comment: Comment; isAdmin: boolean;
  onConfirm: (pw: string) => void; onCancel: () => void;
}) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', width: '320px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Delete Comment</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Delete <strong style={{ color: 'var(--text)' }}>{comment.name}</strong>'s comment?
        </p>
        {!isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password" placeholder="Enter your password" value={pw}
              onChange={e => { setPw(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { if (!pw.trim()) { setErr('Please enter your password.'); return; } onConfirm(pw); } }}
              autoFocus
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${err ? '#fca5a5' : 'var(--border)'}`, borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.875rem', fontFamily: 'var(--font-pretendard)', outline: 'none' }}
            />
            {err && <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>{err}</p>}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-pretendard)' }}>
            Cancel
          </button>
          <button
            onClick={() => { if (!isAdmin && !pw.trim()) { setErr('Please enter your password.'); return; } onConfirm(pw); }}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#dc2626', border: 'none', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-pretendard)', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </>
  );
}

export default function CommentsSection({ postId, initialComments, isAdmin, commentsEnabled }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg-secondary)', color: 'var(--text)',
    fontSize: '0.875rem', fontFamily: 'var(--font-pretendard)', outline: 'none',
  };

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim() || !password.trim()) {
      setError('All fields are required.'); return;
    }
    setError(''); setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, name, content, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to post.'); return; }
      setComments([...comments, json.data]);
      setName(''); setContent(''); setPassword('');
      setSuccess('Comment posted!');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (pw: string) => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, password: pw }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to delete.'); setDeleteTarget(null); return; }
      setComments(comments.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { setError('Network error.'); setDeleteTarget(null); }
  };

  return (
    <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
      {deleteTarget && (
        <DeleteModal comment={deleteTarget} isAdmin={isAdmin} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* Header */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={18} style={{ color: 'var(--accent)' }} />
        Comments
        {comments.length > 0 && (
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 10px', borderRadius: '20px' }}>
            {comments.length}
          </span>
        )}
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {comments.map((c, i) => (
            <div key={c.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms`, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatKST(c.created_at)}</span>
                </div>
                <button
                  onClick={() => setDeleteTarget(c)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', transition: 'all 0.15s ease', flexShrink: 0 }}
                  className="hover:text-red-500 hover:border-red-400"
                >
                  <Trash2 size={11} /> {isAdmin ? '' : 'Delete'}
                </button>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && commentsEnabled && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '24px' }}>
          No comments yet. Be the first!
        </div>
      )}

      {/* Write form */}
      {commentsEnabled ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leave a comment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }} className="form-row-mobile">
              <div style={{ flex: 1, position: 'relative' }}>
                <User size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} maxLength={30} style={{ ...inputStyle, paddingLeft: '32px' }} />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <Lock size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="password" placeholder="Password (for deletion)" value={password} onChange={e => setPassword(e.target.value)} maxLength={50} style={{ ...inputStyle, paddingLeft: '32px' }} />
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                placeholder="Write a comment..."
                value={content} onChange={e => setContent(e.target.value)}
                maxLength={1000} rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '0.68rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                {content.length}/1000
              </div>
            </div>
            {error && <div style={{ fontSize: '0.8rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '7px', padding: '8px 12px' }}>{error}</div>}
            {success && <div style={{ fontSize: '0.8rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '7px', padding: '8px 12px' }}>{success}</div>}
            <button
              onClick={handleSubmit} disabled={submitting}
              style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: submitting ? 'var(--text-muted)' : 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-pretendard)' }}
            >
              {submitting ? <Loader2 size={13} /> : <Send size={13} />}
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.875rem' }}>
          Comments are disabled for this post.
        </div>
      )}
    </div>
  );
}
