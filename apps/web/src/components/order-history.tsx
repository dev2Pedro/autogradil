'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react';
import { FENCE_COLORS, type FenceColor, type OrderListItem } from '@autogradil/shared';
import { FenceElevation } from '@/components/fence-elevation';
import { FenceSwatch } from '@/components/fence-swatch';
import { OrderDetailsDialog } from '@/components/order-details-dialog';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { type ApiError, listOrders, toApiError } from '@/lib/api-client';
import {
  API_ERROR_TITLES,
  COLOR_LABELS,
  formatMeters,
  formatOrderNumber,
  formatRelativeDate,
  plural,
} from '@/lib/labels';
import {
  filterOrders,
  hasActiveFilters,
  isSortKey,
  paginate,
  SORT_OPTIONS,
  type SortKey,
} from '@/lib/order-filters';
import { cn } from '@/lib/utils';

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; orders: OrderListItem[] };

function summarize(orders: OrderListItem[]): string {
  const meters = orders.reduce((total, order) => total + order.summary.soldLengthMm, 0);
  const panels = orders.reduce((total, order) => total + order.summary.components.panels, 0);
  return `${plural(orders.length, 'pedido', 'pedidos')} · ${formatMeters(meters)} de cerca · ${plural(panels, 'tela', 'telas')}`;
}

type ColorFilterProps = {
  orders: OrderListItem[];
  value: FenceColor | null;
  onChange: (value: FenceColor | null) => void;
};

function ColorFilter({ orders, value, onChange }: ColorFilterProps) {
  const counts = FENCE_COLORS.map((color) => ({
    color,
    count: orders.filter((order) => order.color === color).length,
  })).filter((entry) => entry.count > 0);
  const chip =
    'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/30';
  const idle =
    'border-border bg-sheet text-muted-foreground hover:border-rule hover:text-foreground';
  const active = 'border-foreground bg-foreground text-background';

  return (
    <div
      role="group"
      aria-label="Filtrar por cor"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(chip, value === null ? active : idle)}
      >
        Todas
        <span className="tabular-nums opacity-70">{orders.length}</span>
      </button>
      {counts.map(({ color, count }) => (
        <button
          key={color}
          type="button"
          aria-pressed={value === color}
          onClick={() => onChange(value === color ? null : color)}
          className={cn(chip, value === color ? active : idle)}
        >
          <FenceSwatch color={color} />
          {COLOR_LABELS[color]}
          <span className="tabular-nums opacity-70">{count}</span>
        </button>
      ))}
    </div>
  );
}

const ROW_GRID =
  'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-3 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_11rem_8.5rem] sm:gap-x-8';

type OrderRowProps = {
  order: OrderListItem;
  longestMm: number;
  onOpen: () => void;
};

function OrderRow({ order, longestMm, onOpen }: OrderRowProps) {
  const { summary } = order;
  const { components } = summary;
  const share = Math.max(3, (summary.soldLengthMm / longestMm) * 100);

  return (
    <li className="border-b border-rule/50">
      <article
        aria-labelledby={`order-${order.id}`}
        className={cn(
          ROW_GRID,
          'group/row relative -mx-2 rounded-md px-2 transition-colors duration-200 hover:bg-sheet sm:-mx-4 sm:px-4',
        )}
      >
        <h2 id={`order-${order.id}`}>
          <button
            type="button"
            onClick={onOpen}
            className="flex items-baseline gap-1 rounded-sm text-left outline-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
          >
            <span className="text-base font-medium text-muted-foreground font-stretch-80%">
              <span className="sr-only">Pedido </span>nº{' '}
            </span>
            <span className="text-3xl leading-none font-semibold tracking-[-0.02em] font-stretch-82%">
              {formatOrderNumber(order.id)}
            </span>
          </button>
        </h2>

        <div className="col-start-2 text-right sm:col-start-4 sm:row-start-1">
          <p className="text-2xl leading-none font-semibold tracking-[-0.02em] font-stretch-85%">
            {formatMeters(summary.soldLengthMm)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.differenceMm > 0 ? `pedido ${formatMeters(order.lengthMm)}` : 'sem sobra'}
          </p>
          <div
            role="img"
            aria-label={`${Math.round((summary.soldLengthMm / longestMm) * 100)}% do maior pedido da lista`}
            className="mt-2 ml-auto h-1 w-24 overflow-hidden rounded-full bg-rule/45"
          >
            <div
              className="ml-auto h-full rounded-full bg-primary"
              style={{ width: `${share}%` }}
            />
          </div>
        </div>

        <div className="col-span-2 min-w-0 space-y-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <FenceElevation
            variant="mini"
            panels={components.panels}
            heightMm={order.heightMm}
            color={order.color}
            soldLengthMm={summary.soldLengthMm}
            requestedLengthMm={order.lengthMm}
            className="h-14 w-auto max-w-full"
          />
          <p className="text-sm text-muted-foreground">
            {plural(components.panels, 'tela', 'telas')} ·{' '}
            {plural(components.posts, 'poste', 'postes')} ·{' '}
            {plural(components.fasteners, 'fixador', 'fixadores')} ·{' '}
            {plural(components.screws, 'parafuso', 'parafusos')}
          </p>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-start sm:gap-1.5">
          <p className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
            <FenceSwatch color={order.color} className="size-3.5" />
            {COLOR_LABELS[order.color]}
            <span className="font-normal text-muted-foreground">
              · {formatMeters(order.heightMm)}
            </span>
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <time dateTime={order.confirmedAt}>{formatRelativeDate(order.confirmedAt)}</time>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-primary"
            />
          </p>
        </div>
      </article>
    </li>
  );
}

function RowsSkeleton() {
  return (
    <div role="status" aria-label="Carregando pedidos" className="border-t border-rule/50">
      {[0, 1, 2].map((row) => (
        <div key={row} className={cn(ROW_GRID, 'border-b border-rule/50')}>
          <Skeleton className="h-10 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-64 max-w-full" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          <Skeleton className="hidden h-8 w-28 sm:block" />
          <Skeleton className="hidden h-4 w-24 justify-self-end sm:block" />
        </div>
      ))}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-start gap-5 border-y border-rule/50 py-12 sm:flex-row sm:items-center sm:gap-10">
      <svg viewBox="0 0 220 70" aria-hidden="true" className="h-16 w-auto shrink-0 text-rule">
        <path d="M2 64h216" stroke="currentColor" strokeWidth="1.5" />
        {[10, 110, 210].map((x) => (
          <rect key={x} x={x - 2} y="10" width="4" height="54" fill="currentColor" />
        ))}
        <rect
          x="12"
          y="16"
          width="196"
          height="46"
          fill="none"
          stroke="currentColor"
          strokeDasharray="5 4"
        />
      </svg>
      <div className="max-w-md space-y-3">
        <h2 className="text-lg font-semibold">Nenhum pedido confirmado ainda</h2>
        <p className="text-sm text-muted-foreground">
          Calcule uma cerca e confirme o pedido. Ele aparece aqui com o desenho cotado e a lista de
          materiais.
        </p>
        <Link href="/" className={buttonVariants()}>
          Calcular uma cerca
        </Link>
      </div>
    </div>
  );
}

export function OrderHistory() {
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [colorFilter, setColorFilter] = useState<FenceColor | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLElement>(null);

  const orders = useMemo(() => (state.status === 'success' ? state.orders : []), [state]);
  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;
  const visibleOrders = useMemo(
    () => filterOrders(orders, { color: colorFilter, query, sort }),
    [orders, colorFilter, query, sort],
  );
  const filtering = hasActiveFilters({ color: colorFilter, query });
  const pagination = paginate(visibleOrders, page);
  const longestMm = Math.max(1, ...visibleOrders.map((order) => order.summary.soldLengthMm));

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const result = await listOrders();
      setState({ status: 'success', orders: result });
    } catch (error) {
      setState({ status: 'error', error: toApiError(error) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const removeFromList = useCallback((id: number) => {
    setState((current) =>
      current.status === 'success'
        ? { status: 'success', orders: current.orders.filter((order) => order.id !== id) }
        : current,
    );
  }, []);

  function goToPage(next: number) {
    setPage(next);
    listRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function changeColorFilter(color: FenceColor | null) {
    setColorFilter(color);
    setPage(1);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changeSort(value: SortKey) {
    setSort(value);
    setPage(1);
  }

  function clearFilters() {
    changeColorFilter(null);
    changeQuery('');
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-x-6">
        <div className="space-y-1.5">
          <h1 className="text-4xl leading-none font-semibold tracking-tight font-stretch-88%">
            Pedidos
          </h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {state.status === 'success'
              ? orders.length > 0
                ? summarize(orders)
                : 'Nenhum pedido ainda'
              : state.status === 'loading'
                ? 'Carregando pedidos…'
                : 'Não foi possível carregar'}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={load}
          disabled={state.status === 'loading'}
          className="text-muted-foreground"
        >
          <RefreshCwIcon className={cn(state.status === 'loading' && 'animate-spin')} />
          <span className="sr-only sm:not-sr-only">Atualizar</span>
        </Button>
      </header>

      {state.status === 'success' && orders.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ColorFilter orders={orders} value={colorFilter} onChange={changeColorFilter} />
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 lg:w-44 lg:flex-none">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                inputMode="numeric"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Buscar nº"
                aria-label="Buscar pedido pelo número"
                className="h-9 pl-9"
              />
            </div>
            <Select
              items={SORT_OPTIONS}
              value={sort}
              onValueChange={(value) => changeSort(isSortKey(value) ? value : 'recent')}
            >
              <SelectTrigger aria-label="Ordenar pedidos" className="h-9! w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {state.status === 'loading' && <RowsSkeleton />}

      {state.status === 'error' && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{API_ERROR_TITLES[state.error.kind]}</AlertTitle>
          <AlertDescription>{state.error.message}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={load}>
              Tentar novamente
            </Button>
          </AlertAction>
        </Alert>
      )}

      {state.status === 'success' && orders.length === 0 && <EmptyHistory />}

      {state.status === 'success' && orders.length > 0 && visibleOrders.length === 0 && (
        <div className="space-y-3 border-y border-rule/50 py-10">
          <p className="font-medium">Nenhum pedido com esses filtros.</p>
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {visibleOrders.length > 0 && (
        <section ref={listRef} aria-label="Pedidos confirmados" className="scroll-mt-6">
          {filtering && (
            <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
              Mostrando {plural(visibleOrders.length, 'pedido', 'pedidos')} de {orders.length}
            </p>
          )}
          <ol className="border-t border-rule/50">
            {pagination.items.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                longestMm={longestMm}
                onOpen={() => setSelectedId(order.id)}
              />
            ))}
          </ol>
          {pagination.totalPages > 1 && (
            <nav
              aria-label="Paginação dos pedidos"
              className="mt-6 flex items-center justify-between gap-3"
            >
              <Button
                variant="outline"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeftIcon />
                Anterior
              </Button>
              <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <Button
                variant="outline"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Próxima
                <ChevronRightIcon />
              </Button>
            </nav>
          )}
        </section>
      )}

      <OrderDetailsDialog
        order={selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onDeleted={(id) => {
          setSelectedId(null);
          removeFromList(id);
        }}
      />
    </div>
  );
}
