import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { getBlogSettings } from '@/lib/blogSettings';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { blogName, profileImage } = await getBlogSettings();

  const icons: Metadata['icons'] = profileImage
    ? { icon: profileImage, shortcut: profileImage, apple: profileImage }
    : undefined;

  return {
    title: {
      default: blogName,
      template: `%s | ${blogName}`,
    },
    description: `${blogName} — Personal Blog`,
    ...(icons && { icons }),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accentColor, blogName, profileImage } = await getBlogSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProviders
          accentColor={accentColor}
          blogName={blogName}
          profileImage={profileImage}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
