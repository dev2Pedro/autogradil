'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { CheckIcon, CopyIcon } from 'lucide-react';
import {
  FASTENERS_BY_HEIGHT_MM,
  PANEL_LENGTH_MM,
  SCREWS_PER_POST,
  type FenceComponents,
  type OrderListItem,
} from '@autogradil/shared';
import { DeleteOrderButton } from '@/components/delete-order-button';
import { FenceElevation } from '@/components/fence-elevation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  COLOR_LABELS,
  formatMeters,
  formatOrderNumber,
  formatQuantity,
  formatRelativeDate,
  plural,
} from '@/lib/labels';
import { EDGE_BY_COLOR, POST_BY_COLOR } from '@/lib/fence-colors';
import { cn } from '@/lib/utils';

const Fence3D = dynamic(() => import('@/components/fence-3d').then((module) => module.Fence3D), {
  ssr: false,
  loading: () => <Skeleton className="h-72 rounded-none sm:h-96" />,
});

const areaFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type View = 'drawing' | '3d';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'drawing', label: 'Desenho cotado' },
  { value: '3d', label: '3D' },
];

function materialRows(order: OrderListItem) {
  return [
    {
      key: 'panels' as keyof FenceComponents,
      label: 'Telas',
      rule: `${formatMeters(PANEL_LENGTH_MM)} cada`,
    },
    { key: 'posts' as keyof FenceComponents, label: 'Postes', rule: 'uma a mais que as telas' },
    {
      key: 'fasteners' as keyof FenceComponents,
      label: 'Fixadores',
      rule: `${FASTENERS_BY_HEIGHT_MM[order.heightMm]} por tela`,
    },
    {
      key: 'screws' as keyof FenceComponents,
      label: 'Parafusos',
      rule: `${SCREWS_PER_POST} por poste`,
    },
  ];
}

function describeOrder(order: OrderListItem): string {
  return `${formatMeters(order.summary.soldLengthMm)} · ${formatMeters(order.heightMm)} · ${COLOR_LABELS[order.color]}`;
}

function materialListText(order: OrderListItem): string {
  const { components } = order.summary;
  return [
    `Pedido nº ${formatOrderNumber(order.id)} — ${describeOrder(order)}`,
    plural(components.panels, 'tela', 'telas'),
    plural(components.posts, 'poste', 'postes'),
    plural(components.fasteners, 'fixador', 'fixadores'),
    plural(components.screws, 'parafuso', 'parafusos'),
  ].join('\n');
}

function CopyListButton({ order }: { order: OrderListItem }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(materialListText(order));
      setCopied(true);
      toast.success('Lista de materiais copiada.');
    } catch {
      toast.error('Não foi possível copiar.', {
        description: 'Seu navegador bloqueou o acesso à área de transferência.',
      });
    }
  }

  return (
    <Button onClick={handleCopy} className="h-10 flex-1 px-4 sm:flex-none" aria-live="polite">
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Lista copiada' : 'Copiar lista de materiais'}
    </Button>
  );
}

function Cell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-r border-b border-foreground/55 px-3 py-2', className)}>
      <dt className="text-xs text-muted-foreground [font-stretch:80%]">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

type OrderSheetProps = {
  order: OrderListItem;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  onDeleted: () => void;
};

function OrderSheet({ order, titleRef, onDeleted }: OrderSheetProps) {
  const [view, setView] = useState<View>('drawing');
  const { summary } = order;
  const areaM2 = (summary.soldLengthMm * order.heightMm) / 1_000_000;
  const elevation = {
    panels: summary.components.panels,
    heightMm: order.heightMm,
    color: order.color,
    soldLengthMm: summary.soldLengthMm,
    requestedLengthMm: order.lengthMm,
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr]">
          <section
            aria-label="Visualização da cerca"
            className="flex flex-col border-y border-rule/60 bg-sheet lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:border-y-0 lg:border-r"
          >
            <div
              role="radiogroup"
              aria-label="Tipo de visualização"
              className="flex gap-1 px-5 pt-4 sm:px-7"
            >
              {VIEWS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={view === option.value}
                  onClick={() => setView(option.value)}
                  className={cn(
                    'relative h-9 px-3 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                    'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary after:transition-transform after:duration-200',
                    view === option.value
                      ? 'text-foreground after:scale-x-100'
                      : 'text-muted-foreground after:scale-x-0 hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {view === 'drawing' ? (
              <figure className="flex flex-1 flex-col justify-center gap-4 px-5 pt-6 pb-6 sm:min-h-96 sm:px-7">
                <FenceElevation
                  {...elevation}
                  variant="compact"
                  className="h-auto w-full sm:hidden"
                />
                <FenceElevation
                  {...elevation}
                  className="mx-auto hidden h-auto max-h-[24rem] w-full sm:block"
                />
                <figcaption className="text-xs text-muted-foreground">
                  Vista frontal, sem escala.
                  {summary.components.panels > 3 ? ' O trecho do meio foi encurtado.' : ''}
                  {summary.differenceMm > 0 ? ' A área hachurada é a sobra da última tela.' : ''}
                </figcaption>
              </figure>
            ) : (
              <div className="mt-4">
                <Fence3D
                  panels={summary.components.panels}
                  posts={summary.components.posts}
                  heightMm={order.heightMm}
                  color={order.color}
                />
              </div>
            )}
          </section>

          <section
            aria-label="Carimbo do pedido"
            className="order-first space-y-2 px-5 pt-14 pb-6 sm:px-7 lg:order-none lg:col-start-2 lg:row-start-1"
          >
            <dl className="grid grid-cols-2 border-t border-l border-foreground/55">
              <Cell label="Pedido" className="col-span-2">
                <DialogTitle
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-3xl leading-none font-semibold tracking-[-0.02em] outline-none [font-stretch:82%]"
                >
                  <span className="sr-only">Pedido </span>nº {formatOrderNumber(order.id)}
                </DialogTitle>
              </Cell>
              <Cell label="Confirmado">
                <time dateTime={order.confirmedAt}>{formatRelativeDate(order.confirmedAt)}</time>
              </Cell>
              <Cell label="Altura">{formatMeters(order.heightMm)}</Cell>
              <Cell label="Cor" className="col-span-2">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-6 flex-1 rounded-[3px] border"
                    style={{
                      backgroundColor: POST_BY_COLOR[order.color],
                      borderColor: EDGE_BY_COLOR[order.color],
                    }}
                  />
                  {COLOR_LABELS[order.color]}
                </span>
              </Cell>
              <Cell label="Vendido">
                <span className="text-2xl leading-tight tracking-[-0.02em] [font-stretch:85%]">
                  {formatMeters(summary.soldLengthMm)}
                </span>
              </Cell>
              <Cell label="Solicitado">
                <span className="text-2xl leading-tight font-medium tracking-[-0.02em] text-muted-foreground [font-stretch:85%]">
                  {formatMeters(order.lengthMm)}
                </span>
              </Cell>
              <Cell label="Telas">{formatQuantity(summary.components.panels)}</Cell>
              <Cell label="Área de tela">{areaFormat.format(areaM2)} m²</Cell>
            </dl>
            <p className="text-xs text-pretty text-muted-foreground">
              {summary.differenceMm > 0
                ? `Sobra de ${formatMeters(summary.differenceMm)}: as telas são vendidas inteiras, de ${formatMeters(PANEL_LENGTH_MM)}.`
                : 'O comprimento fecha em telas inteiras, sem sobra.'}
            </p>
          </section>

          <section
            aria-labelledby="sheet-materials"
            className="space-y-3 px-5 py-6 sm:px-7 lg:col-start-2 lg:row-start-2 lg:pt-0"
          >
            <h3 id="sheet-materials" className="text-sm font-semibold">
              Lista de materiais
            </h3>
            <ul className="divide-y divide-rule/50 border-y border-rule/50">
              {materialRows(order).map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground [font-stretch:85%]">{row.rule}</p>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums [font-stretch:85%]">
                    {formatQuantity(summary.components[row.key])}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t border-rule/60 bg-popover px-4 py-3 sm:px-7">
        <DeleteOrderButton
          orderId={order.id}
          summary={`Nº ${formatOrderNumber(order.id)} · ${describeOrder(order)}`}
          onDeleted={onDeleted}
        />
        <div className="ml-auto flex flex-1 justify-end sm:flex-none">
          <CopyListButton order={order} />
        </div>
      </footer>
    </>
  );
}

type OrderDetailsDialogProps = {
  order: OrderListItem | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: number) => void;
};

export function OrderDetailsDialog({ order, onOpenChange, onDeleted }: OrderDetailsDialogProps) {
  const [shownOrder, setShownOrder] = useState(order);
  const titleRef = useRef<HTMLHeadingElement>(null);
  if (order && order !== shownOrder) setShownOrder(order);

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      {shownOrder && (
        <DialogContent
          initialFocus={titleRef}
          className="top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(92dvh,880px)] sm:max-w-6xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
        >
          <DialogDescription className="sr-only">
            {describeOrder(shownOrder)}, confirmado {formatRelativeDate(shownOrder.confirmedAt)}
          </DialogDescription>
          <OrderSheet
            key={shownOrder.id}
            order={shownOrder}
            titleRef={titleRef}
            onDeleted={() => onDeleted(shownOrder.id)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
