import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatKST(dateStr: string, fmt = 'yyyy년 M월 d일 HH:mm'): string {
  const utc = new Date(dateStr);
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  return format(kst, fmt, { locale: ko });
}

export function formatKSTShort(dateStr: string): string {
  return formatKST(dateStr, 'yy.MM.dd');
}
