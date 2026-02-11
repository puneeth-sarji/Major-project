
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { PT_Sans } from 'next/font/google';
import { Source_Code_Pro } from 'next/font/google';

export const metadata: Metadata = {
  title: 'CloudSentinel',
  description: 'AI-Powered Cloud Threat Detection System',
};

const ptSans = PT_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '700'],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-code',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-body antialiased', ptSans.variable, sourceCodePro.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
