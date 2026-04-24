'use client';

import { useEffect, useState } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [MDEditor, setMDEditor] = useState<any>(null);

  useEffect(() => {
    // Dynamically import to avoid SSR issues
    import('@uiw/react-md-editor').then((mod) => {
      setMDEditor(() => mod.default);
    });
  }, []);

  if (!MDEditor) {
    return (
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          background: 'var(--bg-card)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        에디터 로딩 중...
      </div>
    );
  }

  return (
    <div data-color-mode="auto">
      <MDEditor
        value={value}
        onChange={(v: string | undefined) => onChange(v || '')}
        height={500}
        preview="live"
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      />
    </div>
  );
}
