export interface Post {
  id: string;
  title: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
}

export interface Tag {
  name: string;
  count: number;
}
