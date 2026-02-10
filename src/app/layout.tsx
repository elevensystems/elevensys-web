import type { Metadata } from 'next';
import { Ubuntu } from 'next/font/google';
import { headers } from 'next/headers';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { DomainProvider } from '@/contexts/domain-context';
import { getUserFromSession } from '@/lib/auth';
import { getDomainConfig } from '@/lib/domain-config';
import '@/styles/globals.css';

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const config = getDomainConfig(host);

  return {
    title: config.appName,
    description: config.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const domainConfig = getDomainConfig(host);
  const user = await getUserFromSession();

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${ubuntu.variable} antialiased`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <DomainProvider config={domainConfig}>
            <AuthProvider user={user}>
              {children}
              <Toaster />
            </AuthProvider>
          </DomainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
