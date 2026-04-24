import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { getBlogSettings } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: '블로그',
    template: '%s | 블로그',
  },
  description: '개인 블로그',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accentColor } = await getBlogSettings();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ClientProviders accentColor={accentColor}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
