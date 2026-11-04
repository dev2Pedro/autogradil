'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Calculadora' },
  { href: '/history', label: 'Pedidos' },
];

function isActive(pathname: string, href: string) {
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);
  return normalize(pathname) === normalize(href);
}

function BrandMark() {
  return (
    <svg viewBox="0 0 28 20" aria-hidden="true" className="h-5 w-7 text-foreground">
      <path d="M1 19h26" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="3" width="2" height="16" fill="currentColor" />
      <rect x="24" y="3" width="2" height="16" fill="currentColor" />
      <path
        d="M4 6h20M4 10.5h20M4 15h20M8 5v12M12 5v12M16 5v12M20 5v12"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
    </svg>
  );
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-rule/60 bg-sheet">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-14 max-w-6xl items-stretch gap-6 px-4 sm:px-6"
      >
        <Link href="/" className="mr-auto flex items-center gap-2.5 rounded-sm">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Autogradil</span>
        </Link>
        {links.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground',
                'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200',
                active && 'text-foreground after:scale-x-100',
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
