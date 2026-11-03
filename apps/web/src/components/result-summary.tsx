import type { FenceCalculation, FenceColor } from '@autogradil/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLOR_LABELS, formatMeters } from '@/lib/labels';

type ResultSummaryProps = {
  calculation: FenceCalculation;
  color: FenceColor;
};

export function ResultSummary({ calculation, color }: ResultSummaryProps) {
  const rows = [
    { label: 'Comprimento solicitado', value: formatMeters(calculation.requestedLengthMm) },
    { label: 'Comprimento vendido', value: formatMeters(calculation.soldLengthMm) },
    ...(calculation.differenceMm > 0
      ? [{ label: 'Diferença', value: formatMeters(calculation.differenceMm) }]
      : []),
    { label: 'Altura', value: formatMeters(calculation.heightMm) },
    { label: 'Cor', value: COLOR_LABELS[color] },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium tabular-nums sm:text-left">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
