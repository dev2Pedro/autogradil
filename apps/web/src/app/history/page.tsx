import type { Metadata } from 'next';
import { OrderHistory } from '@/components/order-history';

export const metadata: Metadata = { title: 'Pedidos' };

export default function HistoryPage() {
  return <OrderHistory />;
}
