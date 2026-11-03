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
import { API_ERROR_TITLES } from '@/lib/labels';

export function DeleteOrderButton({
  orderId,
  onDeleted,
}: {
  orderId: number;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);

  async function handleDelete() {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);

    try {
      await deleteOrder(orderId);
      toast.success(`Pedido nº ${orderId} excluído.`);
      setOpen(false);
      onDeleted();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'not_found') {
        toast.info(`O pedido nº ${orderId} já tinha sido excluído.`);
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
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Excluir pedido nº ${orderId}`}
      >
        <Trash2Icon />
        Excluir
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!deleting) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o pedido nº {orderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              O pedido sai do histórico e não pode ser recuperado.
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
