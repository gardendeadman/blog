import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Supabase UTC 타임스탬프 → KST 포맷
 *
 * Supabase는 "2024-01-01T12:00:00+00:00" 형식으로 반환합니다.
 * new Date()는 이 값을 UTC로 올바르게 파싱하고,
 * format()은 실행 환경의 로컬 시간으로 출력합니다.
 *
 * - 브라우저(클라이언트): 사용자 로컬 시간 → 한국 사용자는 자동으로 KST
 * - Vercel 서버(UTC): UTC로 출력되어 9시간 차이 발생
 *
 * 해결: 서버/클라이언트 구분 없이 항상 KST(+9)로 강제 변환
 * Intl.DateTimeFormat을 사용해 timeZone을 명시하면 환경 무관하게 동일한 결과를 얻습니다.
 */
export function formatKST(
  dateStr: string,
  fmt = 'yyyy년 M월 d일 HH:mm'
): string {
  const date = new Date(dateStr);

  // Intl로 KST 각 파트 추출
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const year   = get('year');
  const month  = get('month');
  const day    = get('day');
  const hour   = get('hour') === '24' ? '00' : get('hour');
  const minute = get('minute');

  // KST 기준 Date 객체 재생성
  const kstDate = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:00`
  );

  return format(kstDate, fmt, { locale: ko });
}

export function formatKSTShort(dateStr: string): string {
  return formatKST(dateStr, 'yy.MM.dd');
}
