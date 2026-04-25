'use client';

import { useEffect } from 'react';

interface Props {
  blogName: string;
  profileImage: string;
}

export default function DynamicHead({ blogName, profileImage }: Props) {
  useEffect(() => {
    // 타이틀 업데이트
    if (document.title === 'Blog' || !document.title) {
      document.title = blogName;
    }

    // 파비콘 업데이트
    if (!profileImage) return;

    const updateFavicon = (rel: string, href: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    updateFavicon('icon', profileImage);
    updateFavicon('shortcut icon', profileImage);
    updateFavicon('apple-touch-icon', profileImage);
  }, [blogName, profileImage]);

  return null;
}
