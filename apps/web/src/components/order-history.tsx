'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleAlertIcon, EyeIcon, RefreshCwIcon } from 'lucide-react';
import type { OrderListItem } from '@autogradil/shared';
import { DeleteOrderButton } from '@/components/delete-order-button';
import { OrderDetailsDialog } from '@/components/order-details-dialog';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ApiError, listOrders, toApiError } from '@/lib/api-client';
import { API_ERROR_TITLES, COLOR_LABELS, formatDateTime, formatMeters } from '@/lib/labels';

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; orders: OrderListItem[] };

const quantityFormat = new Intl.NumberFormat('pt-BR');

function plural(count: number, singular: string, pluralForm: string) {
  return `${quantityFormat.format(count)} ${count === 1 ? singular : pluralForm}`;
}

type OrderCardProps = {
  order: OrderListItem;
  onDeleted: () => void;
  onOpenDetails: () => void;
};

function OrderCard({ order, onDeleted, onOpenDetails }: OrderCardProps) {
  const { summary } = order;
  const rows = [
    { label: 'Comprimento solicitado', value: formatMeters(order.lengthMm) },
    { label: 'Comprimento vendido', value: formatMeters(summary.soldLengthMm) },
    ...(summary.differenceMm > 0
      ? [{ label: 'Diferença', value: formatMeters(summary.differenceMm) }]
      : []),
    { label: 'Altura', value: formatMeters(order.heightMm) },
  ];
  const components = [
    plural(summary.components.panels, 'tela', 'telas'),
    plural(summary.components.posts, 'poste', 'postes'),
    plural(summary.components.fasteners, 'fixador', 'fixadores'),
    plural(summary.components.screws, 'parafuso', 'parafusos'),
  ].join(' · ');

  return (
    <Card
      size="sm"
      onClick={onOpenDetails}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Pedido nº {order.id}
          <Badge variant="secondary">{COLOR_LABELS[order.color]}</Badge>
        </CardTitle>
        <CardAction
          className="flex flex-wrap justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDetails}
            aria-label={`Ver detalhes do pedido nº ${order.id}`}
          >
            <EyeIcon />
            Detalhes
          </Button>
          <DeleteOrderButton orderId={order.id} onDeleted={onDeleted} />
        </CardAction>
        <CardDescription>
          Confirmado em{' '}
          <time dateTime={order.confirmedAt}>{formatDateTime(order.confirmedAt)}</time>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">{components}</p>
      </CardContent>
    </Card>
  );
}

export function OrderHistory() {
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedOrder =
    state.status === 'success'
      ? (state.orders.find((order) => order.id === selectedId) ?? null)
      : null;

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const orders = await listOrders();
      setState({ status: 'success', orders });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Histórico</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos confirmados, do mais recente para o mais antigo.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={state.status === 'loading'}>
          <RefreshCwIcon />
          Atualizar
        </Button>
      </div>

      {state.status === 'loading' && (
        <div className="space-y-4" role="status" aria-label="Carregando pedidos">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

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

      {state.status === 'success' && state.orders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum pedido confirmado</CardTitle>
            <CardDescription>
              Os pedidos aparecem aqui depois de confirmados na calculadora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className={buttonVariants()}>
              Ir para a calculadora
            </Link>
          </CardContent>
        </Card>
      )}

      {state.status === 'success' && state.orders.length > 0 && (
        <section aria-label="Pedidos confirmados" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {plural(state.orders.length, 'pedido', 'pedidos')}
          </p>
          <ol className="space-y-4">
            {state.orders.map((order) => (
              <li key={order.id}>
                <OrderCard
                  order={order}
                  onDeleted={() => removeFromList(order.id)}
                  onOpenDetails={() => setSelectedId(order.id)}
                />
              </li>
            ))}
          </ol>
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
