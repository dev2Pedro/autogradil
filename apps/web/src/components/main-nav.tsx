'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Calculadora' },
  { href: '/history', label: 'Histórico' },
];

function isActive(pathname: string, href: string) {
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);
  return normalize(pathname) === normalize(href);
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3"
      >
        <span className="mr-auto text-base font-semibold">Autogradil</span>
        {links.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(buttonVariants({ variant: active ? 'default' : 'ghost' }))}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
