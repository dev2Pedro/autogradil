'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  API_FIELD_TO_FORM_FIELD,
  FENCE_FORM_DEFAULTS,
  fenceFormSchema,
  type FenceFormInput,
  type FenceFormOutput,
} from '@/lib/fence-form-schema';
import { COLOR_OPTIONS, HEIGHT_OPTIONS } from '@/lib/labels';

type FenceFormProps = {
  pending: boolean;
  onCalculate: (values: FenceFormOutput) => Promise<Record<string, string> | void>;
  onValuesChange: () => void;
};

export function FenceForm({ pending, onCalculate, onValuesChange }: FenceFormProps) {
  const form = useForm<FenceFormInput, unknown, FenceFormOutput>({
    resolver: zodResolver(fenceFormSchema),
    defaultValues: FENCE_FORM_DEFAULTS,
  });

  useEffect(() => {
    const subscription = form.watch(() => onValuesChange());
    return () => subscription.unsubscribe();
  }, [form, onValuesChange]);

  async function handleValid(values: FenceFormOutput) {
    const fieldErrors = await onCalculate(values);
    if (!fieldErrors) return;

    for (const [apiField, message] of Object.entries(fieldErrors)) {
      const formField = API_FIELD_TO_FORM_FIELD[apiField];
      if (formField) form.setError(formField, { type: 'server', message });
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleValid)} aria-busy={pending}>
      <FieldGroup className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={form.control}
          name="length"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="fence-length">Comprimento (m)</FieldLabel>
              <Input
                {...field}
                id="fence-length"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Ex.: 12,5"
                aria-invalid={fieldState.invalid}
                aria-describedby="fence-length-error"
              />
              <div id="fence-length-error" aria-live="polite">
                <FieldError errors={[fieldState.error]} />
              </div>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="heightMm"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="fence-height">Altura</FieldLabel>
              <Select
                items={HEIGHT_OPTIONS}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger
                  id="fence-height"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                  aria-describedby="fence-height-error"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {HEIGHT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div id="fence-height-error" aria-live="polite">
                <FieldError errors={[fieldState.error]} />
              </div>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="color"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="fence-color">Cor</FieldLabel>
              <Select
                items={COLOR_OPTIONS}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger
                  id="fence-color"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                  aria-describedby="fence-color-error"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div id="fence-color-error" aria-live="polite">
                <FieldError errors={[fieldState.error]} />
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={pending}>
        {pending ? 'Calculando…' : 'Calcular'}
      </Button>
    </form>
  );
}
