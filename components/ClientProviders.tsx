'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeColorInjector from '@/components/ThemeColorInjector';
import DynamicHead from '@/components/DynamicHead';

interface Props {
  children: React.ReactNode;
  accentColor: string;
  blogName: string;
  profileImage: string;
}

export default function ClientProviders({ children, accentColor, blogName, profileImage }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeColorInjector accentColor={accentColor} />
      <DynamicHead blogName={blogName} profileImage={profileImage} />
      {children}
    </ThemeProvider>
  );
}
