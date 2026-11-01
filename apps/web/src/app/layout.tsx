import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Autogradil',
  description: 'Calculadora de pedidos de cerca em metros e milímetros',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn('font-sans', inter.variable)}>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <MainNav />
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
