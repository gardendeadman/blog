import { createClient } from '@/lib/supabase/server';

export const DEFAULT_BLOG_NAME = '블로그';

export async function getBlogName(): Promise<string> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_settings')
      .select('blog_name')
      .limit(1)
      .single();
    return data?.blog_name || DEFAULT_BLOG_NAME;
  } catch {
    return DEFAULT_BLOG_NAME;
  }
}
