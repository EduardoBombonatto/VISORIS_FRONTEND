import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import SessionRestore from '@/features/auth/components/SessionRestore';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EndoCloud — Acesso',
  description: 'Autenticação unificada do EndoCloud (login e cadastro).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <Providers>
          <SessionRestore />
          {children}
        </Providers>
      </body>
    </html>
  );
}
