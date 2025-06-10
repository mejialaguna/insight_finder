import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from '@/components/providers/Providers';
import { Toaster } from '@/components/ui/sonner';

import type { Metadata } from 'next';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Insight Finder',
  description: 'Insight Finder, a tool for finding real-time with semantic similarity articles and news',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          </Providers>
        <Toaster />
      </body>
    </html>
  );
}
