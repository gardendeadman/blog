'use client';

import {
  useEditor, EditorContent,
  NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image as TiptapImage } from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, Code2,
} from 'lucide-react';

// ── Resizable Image NodeView ───────────────────────────────
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const src = node.attrs.src as string;
  const width = node.attrs.width as number | null;

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = imgRef.current?.offsetWidth ?? (width ?? 300);

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.max(60, Math.round(startWidth.current + delta));
      // live preview without saving to state
      if (imgRef.current) imgRef.current.style.width = newWidth + 'px';
    };

    const onMouseUp = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      isResizing.current = false;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.max(60, Math.round(startWidth.current + delta));
      updateAttributes({ width: newWidth });
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes, width]);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isResizing.current = true;
    startX.current = e.touches[0].clientX;
    startWidth.current = imgRef.current?.offsetWidth ?? (width ?? 300);

    const onTouchMove = (ev: TouchEvent) => {
      if (!isResizing.current) return;
      const delta = ev.touches[0].clientX - startX.current;
      const newWidth = Math.max(60, Math.round(startWidth.current + delta));
      if (imgRef.current) imgRef.current.style.width = newWidth + 'px';
    };

    const onTouchEnd = (ev: TouchEvent) => {
      if (!isResizing.current) return;
      isResizing.current = false;
      const lastX = ev.changedTouches[0].clientX;
      const delta = lastX - startX.current;
      const newWidth = Math.max(60, Math.round(startWidth.current + delta));
      updateAttributes({ width: newWidth });
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
  }, [updateAttributes, width]);

  return (
    <NodeViewWrapper style={{ display: 'block' }}>
      <div
        ref={containerRef}
        style={{
          display: 'inline-block',
          position: 'relative',
          maxWidth: '100%',
          lineHeight: 0,
          userSelect: 'none',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          style={{
            display: 'block',
            width: width ? width + 'px' : '100%',
            maxWidth: '100%',
            borderRadius: '6px',
            margin: '8px 0',
            outline: selected ? '2px solid var(--accent)' : '2px solid transparent',
            outlineOffset: '2px',
            transition: 'outline 0.15s ease',
          }}
        />

        {/* Size label — visible when selected */}
        {selected && width && (
          <div style={{
            position: 'absolute', top: '16px', left: '8px',
            background: 'rgba(0,0,0,0.55)', color: 'white',
            fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px',
            borderRadius: '4px', pointerEvents: 'none', lineHeight: 1.6,
          }}>
            {width}px
          </div>
        )}

        {/* ── Right resize handle ── */}
        {selected && (
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            title="Drag to resize"
            style={{
              position: 'absolute',
              top: '50%',
              right: '-6px',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '36px',
              background: 'var(--accent)',
              borderRadius: '6px',
              cursor: 'ew-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              zIndex: 10,
            }}
          >
            {/* grip dots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'white', opacity: 0.85 }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── ResizableImage Extension ───────────────────────────────
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: el => {
          const w = el.getAttribute('width') || el.style.width;
          return w ? parseInt(w) : null;
        },
        renderHTML: attrs =>
          attrs.width ? { width: String(attrs.width), style: `width: ${attrs.width}px` } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

// ── Main Editor Component ──────────────────────────────────
interface WysiwygEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function WysiwygEditor({ value, onChange }: WysiwygEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your content here...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick, active, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button" onClick={onClick} title={title}
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

  const resizeAndInsert = (src: string) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * 0.3);
      canvas.height = Math.round(img.naturalHeight * 0.3);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mime = src.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      editor.chain().focus().setImage({ src: canvas.toDataURL(mime) }).run();
    };
    img.src = src;
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => { const s = e.target?.result as string; if (s) resizeAndInsert(s); };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleImageFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) { e.preventDefault(); handleImageFile(f); }
  };

  const addLink = () => {
    const url = prompt('Enter link URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const Divider = () => (
    <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
  );

  return (
    <div
      style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', alignItems: 'center' }}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><Code size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list"><ListOrdered size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code2 size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider"><Minus size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Link"><LinkIcon size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => fileInputRef.current?.click()} active={false} title="Upload image"><ImageIcon size={14} /></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo"><Undo size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo"><Redo size={14} /></ToolbarBtn>
      </div>

      {/* Hint */}
      <div style={{ padding: '4px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Drag & drop or upload an image · Click image to select, then drag the right handle to resize
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
