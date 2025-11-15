import type { Metadata } from 'next';
import { Ubuntu } from 'next/font/google';

import '@/styles/globals.css';

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
});

export const metadata: Metadata = {
  title: 'URL Shortener',
  description: 'Transform your long URLs into short, shareable links',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${ubuntu.variable} antialiased`}>{children}</body>
    </html>
  );
}
