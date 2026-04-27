/**
 * 포스트 content에서 첫 번째 이미지 src를 추출합니다.
 * WYSIWYG: <img src="..."> 파싱
 * Markdown: ![...](url) 파싱
 */
export function extractFirstImage(
  content: string,
  contentType: 'wysiwyg' | 'markdown'
): string | null {
  if (!content) return null;

  if (contentType === 'wysiwyg') {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  } else {
    // Markdown: ![alt](url) or ![alt](url "title")
    const match = content.match(/!\[[^\]]*\]\(([^)\s"']+)/);
    return match ? match[1] : null;
  }
}
