import { createClient } from '@/lib/supabase/client';

const supabase = () => createClient();

/**
 * 파일을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 * @param bucket 버킷명 ('blog-media' | 'blog-profile')
 * @param path   저장 경로 (예: 'user-id/filename.jpg')
 * @param file   업로드할 File 객체
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const sb = supabase();
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * base64 dataURL을 File로 변환 후 Storage에 업로드합니다.
 */
export async function uploadBase64(
  bucket: string,
  path: string,
  dataUrl: string,
  mimeType = 'image/png'
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], path.split('/').pop() || 'file', { type: mimeType });
  return uploadFile(bucket, path, file);
}

/**
 * Storage에서 파일을 삭제합니다.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const sb = supabase();
  await sb.storage.from(bucket).remove([path]);
}

/**
 * Storage URL에서 파일 경로만 추출합니다.
 * (예: https://xxx.supabase.co/storage/v1/object/public/blog-media/uid/file.jpg → uid/file.jpg)
 */
export function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
