'use client';

import Link from 'next/link';
import { Pencil, Trash2, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DeleteModal from '@/components/DeleteModal';

interface PostActionsProps {
  postId: string;
  postTitle: string;
  postSlug: string;
  isOwner: boolean;
}

export default function PostActions({ postId, postTitle, postSlug, isOwner }: PostActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('posts').delete().eq('id', postId);
    setDeleting(false);
    setShowModal(false);
    router.push('/');
    router.refresh();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${encodeURIComponent(postSlug)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: postTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent',
    padding: '5px 12px', border: '1px solid var(--border)',
    borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease',
    fontFamily: 'var(--font-pretendard)',
  };

  return (
    <>
      {isOwner && (
        <DeleteModal
          isOpen={showModal}
          postTitle={postTitle}
          onConfirm={handleDelete}
          onCancel={() => setShowModal(false)}
          deleting={deleting}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        {/* Share — always visible */}
        <button
          onClick={handleShare}
          style={{ ...btnStyle, color: copied ? 'var(--accent)' : 'var(--text-muted)', borderColor: copied ? 'var(--accent)' : 'var(--border)' }}
        >
          {copied ? <Check size={12} /> : <Share2 size={12} />}
          {copied ? 'Copied!' : 'Share'}
        </button>

        {/* Edit / Delete — owner only */}
        {isOwner && (
          <>
            <Link
              href={`/write?id=${postId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '6px', transition: 'all 0.15s ease' }}
              className="hover:text-accent hover:border-accent"
            >
              <Pencil size={12} /> Edit
            </Link>
            <button
              onClick={() => setShowModal(true)}
              style={btnStyle}
              className="hover:text-red-500 hover:border-red-400"
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
      </div>
    </>
  );
}