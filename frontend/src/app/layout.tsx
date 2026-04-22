import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GenWallDecor',
  description: 'AI-powered wall decor that matches your style',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="antialiased pt-14">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
