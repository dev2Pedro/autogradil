'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteOrder, toApiError } from '@/lib/api-client';
import { API_ERROR_TITLES, formatOrderNumber } from '@/lib/labels';

type DeleteOrderButtonProps = {
  orderId: number;
  summary: string;
  onDeleted: () => void;
};

export function DeleteOrderButton({ orderId, summary, onDeleted }: DeleteOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const number = formatOrderNumber(orderId);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);

  async function handleDelete() {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);

    try {
      await deleteOrder(orderId);
      toast.success(`Pedido nº ${number} excluído.`);
      setOpen(false);
      onDeleted();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'not_found') {
        toast.info(`O pedido nº ${number} já tinha sido excluído.`);
        setOpen(false);
        onDeleted();
      } else {
        toast.error(API_ERROR_TITLES[apiError.kind], { description: apiError.message });
      }
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2Icon />
        <span className="sr-only sm:not-sr-only">Excluir pedido</span>
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!deleting) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o pedido nº {number}?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block font-medium text-foreground">{summary}</span>O pedido sai do
              histórico e não pode ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
