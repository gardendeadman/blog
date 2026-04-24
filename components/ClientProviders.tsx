'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeColorInjector from '@/components/ThemeColorInjector';

interface Props {
  children: React.ReactNode;
  accentColor: string;
}

export default function ClientProviders({ children, accentColor }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeColorInjector accentColor={accentColor} />
      {children}
    </ThemeProvider>
  );
}
