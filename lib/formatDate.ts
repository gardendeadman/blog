/**
 * Supabase UTC timestamp → KST display
 * Uses Intl.DateTimeFormat with Asia/Seoul timezone so both
 * Vercel server (UTC) and browser render the same time.
 */
export function formatKST(
  dateStr: string,
  style: 'long' | 'short' = 'long'
): string {
  const date = new Date(dateStr);

  if (style === 'short') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatKSTShort(dateStr: string): string {
  return formatKST(dateStr, 'short');
}
