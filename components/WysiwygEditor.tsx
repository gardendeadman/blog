'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Code2, Upload,
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function WysiwygEditor({ value, onChange }: WysiwygEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '5px', border: 'none',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        cursor: 'pointer', transition: 'all 0.15s ease',
        fontFamily: 'var(--font-pretendard)',
      }}
    >
      {children}
    </button>
  );

  // 로컬 파일 → base64 → 에디터 삽입
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  // 드래그 앤 드롭 이미지 처리
  const handleDrop = (e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      e.preventDefault();
      handleImageFile(file);
    }
  };

  const addLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const Divider = () => (
    <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
  );

  return (
    <div
      style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '2px',
          padding: '8px 12px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)', alignItems: 'center',
        }}
      >
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게"><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><Italic size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="인라인 코드"><Code size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목 1"><Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2"><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목 3"><Heading3 size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호"><List size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록"><ListOrdered size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용"><Quote size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드 블록"><Code2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="구분선"><Minus size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="링크"><LinkIcon size={14} /></ToolbarBtn>

        {/* 이미지 업로드 버튼 */}
        <button
          type="button"
          onClick={handleImageUpload}
          title="이미지 파일 업로드"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            height: '30px', padding: '0 8px', borderRadius: '5px', border: 'none',
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.15s ease',
            fontSize: '0.75rem', fontFamily: 'var(--font-pretendard)',
            whiteSpace: 'nowrap',
          }}
        >
          <ImageIcon size={14} />
          <span>이미지</span>
        </button>

        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="실행 취소"><Undo size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="다시 실행"><Redo size={14} /></ToolbarBtn>
      </div>

      {/* 드래그 드롭 안내 */}
      <div style={{ padding: '4px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        이미지를 드래그 앤 드롭하거나 툴바의 이미지 버튼으로 업로드하세요
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
