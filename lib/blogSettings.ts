import { createClient } from '@/lib/supabase/server';

export const DEFAULT_BLOG_NAME = '블로그';
export const DEFAULT_ACCENT = '#d4622a';

export interface BlogSettings {
  blogName: string;
  accentColor: string;
}

export async function getBlogSettings(): Promise<BlogSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_settings')
      .select('blog_name, accent_color')
      .limit(1)
      .single();
    return {
      blogName: data?.blog_name || DEFAULT_BLOG_NAME,
      accentColor: data?.accent_color || DEFAULT_ACCENT,
    };
  } catch {
    return { blogName: DEFAULT_BLOG_NAME, accentColor: DEFAULT_ACCENT };
  }
}

// 하위 호환 (기존 getBlogName 호출부가 있다면 유지)
export async function getBlogName(): Promise<string> {
  return (await getBlogSettings()).blogName;
}
