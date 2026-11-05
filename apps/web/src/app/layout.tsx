import type { Metadata } from 'next';
import './globals.css';
import { Archivo } from 'next/font/google';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Autogradil', template: '%s · Autogradil' },
  description: 'Calculadora de pedidos de cerca em metros e milímetros',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn('font-sans', archivo.variable)}>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <MainNav />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
