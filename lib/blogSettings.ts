import { createClient } from '@/lib/supabase/server';

export const DEFAULT_BLOG_NAME = '블로그';
export const DEFAULT_ACCENT = '#d4622a';
export const DEFAULT_BIO = '';

export interface BlogSettings {
  blogName: string;
  accentColor: string;
  bio: string;
}

export async function getBlogSettings(): Promise<BlogSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_settings')
      .select('blog_name, accent_color, bio')
      .limit(1)
      .single();
    return {
      blogName: data?.blog_name || DEFAULT_BLOG_NAME,
      accentColor: data?.accent_color || DEFAULT_ACCENT,
      bio: data?.bio || DEFAULT_BIO,
    };
  } catch {
    return { blogName: DEFAULT_BLOG_NAME, accentColor: DEFAULT_ACCENT, bio: DEFAULT_BIO };
  }
}

// 하위 호환
export async function getBlogName(): Promise<string> {
  return (await getBlogSettings()).blogName;
}
