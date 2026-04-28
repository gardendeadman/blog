import { createClient } from '@/lib/supabase/server';

export const DEFAULT_BLOG_NAME = 'Blog';
export const DEFAULT_ACCENT = '#d4622a';
export const DEFAULT_BIO = '';
export const DEFAULT_PROFILE_IMAGE = '';

export interface BlogSettings {
  blogName: string;
  accentColor: string;
  bio: string;
  profileImage: string;
  guestbookEnabled: boolean;
}

export async function getBlogSettings(): Promise<BlogSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_settings')
      .select('blog_name, accent_color, bio, profile_image, guestbook_enabled')
      .limit(1)
      .single();
    return {
      blogName:         data?.blog_name         || DEFAULT_BLOG_NAME,
      accentColor:      data?.accent_color      || DEFAULT_ACCENT,
      bio:              data?.bio               || DEFAULT_BIO,
      profileImage:     data?.profile_image     || DEFAULT_PROFILE_IMAGE,
      guestbookEnabled: data?.guestbook_enabled ?? false,
    };
  } catch {
    return {
      blogName: DEFAULT_BLOG_NAME,
      accentColor: DEFAULT_ACCENT,
      bio: DEFAULT_BIO,
      profileImage: DEFAULT_PROFILE_IMAGE,
      guestbookEnabled: false,
    };
  }
}

export async function getBlogName(): Promise<string> {
  return (await getBlogSettings()).blogName;
}
