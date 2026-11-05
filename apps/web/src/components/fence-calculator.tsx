'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CircleAlertIcon } from 'lucide-react';
import type { CalculateInput, FenceCalculation } from '@autogradil/shared';
import { FenceForm } from '@/components/fence-form';
import { ResultSummary } from '@/components/result-summary';
import { ComponentsTable } from '@/components/components-table';
import { FenceViews } from '@/components/fence-views';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ApiError, calculate, createOrder, toApiError } from '@/lib/api-client';
import { toFormFieldErrors, type FormFieldErrors } from '@/lib/fence-form-schema';
import { API_ERROR_TITLES, COLOR_LABELS, formatMeters } from '@/lib/labels';

type CalculationResult = {
  calculation: FenceCalculation;
  input: CalculateInput;
  clientRequestId: string;
};

export function FenceCalculator() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<ApiError | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmLock = useRef(false);
  const latestRequest = useRef(0);

  const handleValuesChange = useCallback(() => {
    latestRequest.current += 1;
    setResult(null);
    setCalculationError(null);
    setCalculating(false);
  }, []);

  async function handleCalculate(input: CalculateInput): Promise<FormFieldErrors> {
    const request = ++latestRequest.current;
    const isStale = () => request !== latestRequest.current;
    setCalculating(true);
    setCalculationError(null);
    setResult(null);

    try {
      const calculation = await calculate(input);
      if (isStale()) return {};
      setResult({ calculation, input, clientRequestId: crypto.randomUUID() });
      return {};
    } catch (error) {
      if (isStale()) return {};
      const apiError = toApiError(error);
      if (apiError.kind !== 'validation') {
        setCalculationError(apiError);
        return {};
      }

      const { errors, unmapped } = toFormFieldErrors(apiError.fields);
      if (unmapped.length > 0 || Object.keys(errors).length === 0) {
        setCalculationError(apiError);
      }
      return errors;
    } finally {
      if (!isStale()) setCalculating(false);
    }
  }

  async function handleConfirm() {
    if (!result || confirmLock.current) return;
    confirmLock.current = true;
    setConfirming(true);

    try {
      const order = await createOrder({ ...result.input, clientRequestId: result.clientRequestId });
      toast.success(`Pedido nº ${order.id} confirmado.`, {
        description: `${formatMeters(order.lengthMm)} de cerca ${COLOR_LABELS[order.color].toLowerCase()}, altura ${formatMeters(order.heightMm)}.`,
      });
      setResult(null);
      setDialogOpen(false);
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(API_ERROR_TITLES[apiError.kind], { description: apiError.message });
    } finally {
      confirmLock.current = false;
      setConfirming(false);
    }
  }

  function handleDiscard() {
    setResult(null);
    toast('Pedido não confirmado.', { description: 'Nada foi salvo.' });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de cerca</CardTitle>
          <CardDescription>
            Informe o comprimento, a altura e a cor para calcular os materiais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FenceForm
            pending={calculating}
            onCalculate={handleCalculate}
            onValuesChange={handleValuesChange}
          />
        </CardContent>
      </Card>

      {calculationError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{API_ERROR_TITLES[calculationError.kind]}</AlertTitle>
          <AlertDescription>{calculationError.message}</AlertDescription>
        </Alert>
      )}

      {calculating && (
        <div className="space-y-4" aria-label="Calculando" role="status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {result && (
        <section aria-label="Resultado do cálculo" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultSummary calculation={result.calculation} color={result.input.color} />
            <ComponentsTable components={result.calculation.components} />
          </div>

          <FenceViews calculation={result.calculation} color={result.input.color} />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleDiscard} disabled={confirming}>
              Não confirmar
            </Button>
            <Button onClick={() => setDialogOpen(true)} disabled={confirming}>
              Confirmar pedido
            </Button>
          </div>
        </section>
      )}

      <AlertDialog
        open={dialogOpen && result !== null}
        onOpenChange={(open) => {
          if (!confirming) setDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              {result
                ? `${formatMeters(result.calculation.requestedLengthMm)} de cerca ${COLOR_LABELS[result.input.color].toLowerCase()}, altura ${formatMeters(result.calculation.heightMm)}. O pedido será salvo no histórico.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={confirming}>
              {confirming ? 'Confirmando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
