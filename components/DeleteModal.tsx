'use client';

import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  postTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting?: boolean;
}

export default function DeleteModal({
  isOpen,
  postTitle,
  onConfirm,
  onCancel,
  deleting = false,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 101,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: '400px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            pointerEvents: 'auto',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <AlertTriangle size={18} style={{ color: '#dc2626' }} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                fontWeight: 700, color: 'var(--text)',
              }}>
                Delete Post
              </h2>
            </div>
            <button
              onClick={onCancel}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '2px', borderRadius: '6px',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
            This action cannot be undone.
          </p>
          <div style={{
            padding: '10px 14px', borderRadius: '8px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)',
            marginBottom: '24px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {postTitle}
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              disabled={deleting}
              style={{
                padding: '9px 18px', borderRadius: '8px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-pretendard)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '8px',
                background: deleting ? '#fca5a5' : '#dc2626',
                border: 'none', color: 'white',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-pretendard)',
                transition: 'background 0.15s ease',
              }}
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
