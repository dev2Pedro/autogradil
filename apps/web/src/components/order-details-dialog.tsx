'use client';

import { useState } from 'react';
import {
  FASTENERS_BY_HEIGHT_MM,
  PANEL_LENGTH_MM,
  SCREWS_PER_POST,
  type OrderListItem,
} from '@autogradil/shared';
import { ComponentsTable } from '@/components/components-table';
import { DeleteOrderButton } from '@/components/delete-order-button';
import { FenceViews } from '@/components/fence-views';
import { ResultSummary } from '@/components/result-summary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COLOR_LABELS, formatDateTime, formatMeters } from '@/lib/labels';
import { toCalculation } from '@/lib/orders';

const areaFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type OrderDetailsDialogProps = {
  order: OrderListItem | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: number) => void;
};

function TechnicalDetails({ order }: { order: OrderListItem }) {
  const areaM2 = (order.summary.soldLengthMm * order.heightMm) / 1_000_000;
  const rows = [
    { label: 'Comprimento de cada tela', value: formatMeters(PANEL_LENGTH_MM) },
    { label: 'Fixadores por tela', value: String(FASTENERS_BY_HEIGHT_MM[order.heightMm]) },
    { label: 'Parafusos por poste', value: String(SCREWS_PER_POST) },
    { label: 'Área de cerca', value: `${areaFormat.format(areaM2)} m²` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes técnicos</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrderDetailsDialog({ order, onOpenChange, onDeleted }: OrderDetailsDialogProps) {
  const [shownOrder, setShownOrder] = useState(order);
  if (order && order !== shownOrder) setShownOrder(order);

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      {shownOrder && (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
              Pedido nº {shownOrder.id}
              <Badge variant="secondary">{COLOR_LABELS[shownOrder.color]}</Badge>
            </DialogTitle>
            <DialogDescription>
              Confirmado em{' '}
              <time dateTime={shownOrder.confirmedAt}>
                {formatDateTime(shownOrder.confirmedAt)}
              </time>
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ResultSummary calculation={toCalculation(shownOrder)} color={shownOrder.color} />
              <ComponentsTable components={shownOrder.summary.components} />
            </div>
            <TechnicalDetails order={shownOrder} />
            <FenceViews
              panels={shownOrder.summary.components.panels}
              posts={shownOrder.summary.components.posts}
              heightMm={shownOrder.heightMm}
              color={shownOrder.color}
            />
          </div>

          <DialogFooter>
            <DeleteOrderButton orderId={shownOrder.id} onDeleted={() => onDeleted(shownOrder.id)} />
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
