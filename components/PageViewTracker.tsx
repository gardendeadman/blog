'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getOrCreateVisitorId(): string {
  const key = 'blog_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 제외 경로
    const excluded = ['/settings', '/login', '/write'];
    if (excluded.some(p => pathname.startsWith(p))) return;

    const visitorId = getOrCreateVisitorId();

    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        visitorId,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
