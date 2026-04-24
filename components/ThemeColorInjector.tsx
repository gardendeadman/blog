'use client';

import { useEffect } from 'react';

// hex → RGB 변환
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

// 밝기 조정 (amount: -1.0 ~ 1.0)
function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r + 255 * amount);
  const g = clamp(rgb.g + 255 * amount);
  const b = clamp(rgb.b + 255 * amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// hex → rgba (투명도 포함)
function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

interface Props {
  accentColor: string;
}

export default function ThemeColorInjector({ accentColor }: Props) {
  useEffect(() => {
    applyAccent(accentColor);
  }, [accentColor]);

  return null;
}

export function applyAccent(color: string) {
  const root = document.documentElement;
  // light mode
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-light', adjustBrightness(color, 0.15));
  root.style.setProperty('--accent-dark', adjustBrightness(color, -0.1));
  root.style.setProperty('--accent-subtle', hexToRgba(color, 0.08));
  // dark mode overrides via data-theme / .dark 는 별도 처리 불필요:
  // CSS 변수는 :root 에 적용되고 .dark 안의 변수가 없으면 :root 값 상속
}
