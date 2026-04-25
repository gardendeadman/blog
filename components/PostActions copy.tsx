'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DeleteModal from '@/components/DeleteModal';

interface PostActionsProps {
  postId: string;
  postTitle: string;
}

export default function PostActions({ postId, postTitle }: PostActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('posts').delete().eq('id', postId);
    setDeleting(false);
    setShowModal(false);
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <DeleteModal
        isOpen={showModal}
        postTitle={postTitle}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        deleting={deleting}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        <Link
          href={`/write?id=${postId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '6px', transition: 'all 0.15s ease' }}
          className="hover:text-accent hover:border-accent"
        >
          <Pencil size={12} /> Edit
        </Link>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent', padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-pretendard)' }}
          className="hover:text-red-500 hover:border-red-400"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </>
  );
}
