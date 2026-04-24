'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PostContentProps {
  content: string;
  contentType: 'wysiwyg' | 'markdown';
}

export default function PostContent({ content, contentType }: PostContentProps) {
  if (contentType === 'markdown') {
    return (
      <div className="post-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div
      className="post-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
