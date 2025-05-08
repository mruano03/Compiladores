import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Fira_Code } from 'next/font/google';
import { Providers } from '@/components/provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
  title: 'Compilador',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${firaCode.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}