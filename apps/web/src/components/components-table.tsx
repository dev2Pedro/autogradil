import type { FenceComponents } from '@autogradil/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const quantityFormat = new Intl.NumberFormat('pt-BR');

const ROWS: Array<{ key: keyof FenceComponents; label: string }> = [
  { key: 'panels', label: 'Tela' },
  { key: 'posts', label: 'Poste' },
  { key: 'fasteners', label: 'Fixador' },
  { key: 'screws', label: 'Parafuso' },
];

export function ComponentsTable({ components }: { components: FenceComponents }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Componentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Componente</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead>Unidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {quantityFormat.format(components[row.key])}
                </TableCell>
                <TableCell>un</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
