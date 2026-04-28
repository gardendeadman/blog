'use client';

import { useState } from 'react';
import { formatKST } from '@/lib/formatDate';
import { Trash2, Send, Lock, User, MessageSquare, Loader2, X } from 'lucide-react';

interface Entry {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface Props {
  initialEntries: Entry[];
  isAdmin: boolean;
}

// 삭제 확인 모달
function DeleteConfirmModal({
  entry,
  isAdmin,
  onConfirm,
  onCancel,
}: {
  entry: Entry;
  isAdmin: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!isAdmin && !password.trim()) {
      setError('Please enter your password.');
      return;
    }
    onConfirm(password);
  };

  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', width: '320px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Delete Entry</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Delete <strong style={{ color: 'var(--text)' }}>{entry.name}</strong>'s message?
        </p>
        {!isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              autoFocus
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${error ? '#fca5a5' : 'var(--border)'}`, borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.875rem', fontFamily: 'var(--font-pretendard)', outline: 'none' }}
            />
            {error && <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-pretendard)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{ padding: '8px 16px', borderRadius: '8px', background: '#dc2626', border: 'none', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-pretendard)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </>
  );
}

export default function GuestbookClient({ initialEntries, isAdmin }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg-secondary)', color: 'var(--text)',
    fontSize: '0.9rem', fontFamily: 'var(--font-pretendard)', outline: 'none',
  };

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim() || !password.trim()) {
      setError('All fields are required.'); return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to post.'); return; }
      setEntries([json.data, ...entries]);
      setName(''); setContent(''); setPassword('');
      setSuccess('Your message has been posted!');
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (password: string) => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/guestbook', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDeleteError(json.error || 'Failed to delete.');
        setDeleting(false);
        return;
      }
      setEntries(entries.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError('Network error.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Delete modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          entry={deleteTarget}
          isAdmin={isAdmin}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        />
      )}

      {/* Write form */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <MessageSquare size={15} style={{ color: 'var(--accent)' }} /> Leave a message
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Name + Password row */}
          <div style={{ display: 'flex', gap: '10px' }} className="form-row-mobile">
            <div style={{ flex: 1, position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
                style={{ ...inputStyle, paddingLeft: '34px' }}
              />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="password"
                placeholder="Password (for deletion)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                maxLength={50}
                style={{ ...inputStyle, paddingLeft: '34px' }}
              />
            </div>
          </div>

          {/* Content */}
          <div style={{ position: 'relative' }}>
            <textarea
              placeholder="Write your message here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={500}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              {content.length}/500
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{ fontSize: '0.8rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '7px', padding: '8px 12px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ fontSize: '0.8rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '7px', padding: '8px 12px' }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: submitting ? 'var(--text-muted)' : 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-pretendard)' }}
          >
            {submitting ? <Loader2 size={14} /> : <Send size={14} />}
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.9rem' }}>
            No messages yet. Be the first!
          </div>
        ) : (
          entries.map((entry, i) => (
            <div
              key={entry.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 40}ms`, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', transition: 'border-color 0.15s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Avatar */}
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {entry.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{entry.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatKST(entry.created_at)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(entry)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', transition: 'all 0.15s ease', flexShrink: 0 }}
                  className="hover:text-red-500 hover:border-red-400"
                  title={isAdmin ? 'Delete (admin)' : 'Delete with password'}
                >
                  <Trash2 size={12} />
                  {isAdmin ? '' : 'Delete'}
                </button>
              </div>
              <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
