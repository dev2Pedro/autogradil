import axios, { isAxiosError, type AxiosResponse } from 'axios';
import { z } from 'zod';
import {
  apiErrorBodySchema,
  calculateInputSchema,
  createOrderInputSchema,
  fenceCalculationSchema,
  orderIdParamsSchema,
  orderListSchema,
  orderSchema,
  type CalculateInput,
  type CreateOrderInput,
  type FenceCalculation,
  type Order,
  type OrderListItem,
} from '@autogradil/shared';

export type ApiErrorKind =
  'network' | 'validation' | 'bad_request' | 'not_found' | 'conflict' | 'server';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(params: {
    kind: ApiErrorKind;
    code: string;
    message: string;
    fields?: Record<string, string>;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.code = params.code;
    this.fields = params.fields ?? {};
  }
}

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';

const apiBaseUrl = z
  .url({
    error: 'NEXT_PUBLIC_API_BASE_URL deve ser uma URL, por exemplo http://localhost:3001/api.',
  })
  .default(DEFAULT_API_BASE_URL)
  .parse(process.env.NEXT_PUBLIC_API_BASE_URL || undefined);

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

function kindFor(status: number, code: string): ApiErrorKind {
  if (code === 'VALIDATION_ERROR') return 'validation';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status >= 400 && status < 500) return 'bad_request';
  return 'server';
}

function unexpectedResponse(): ApiError {
  return new ApiError({
    kind: 'server',
    code: 'UNEXPECTED_RESPONSE',
    message: 'O servidor respondeu de forma inesperada. Tente novamente.',
  });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError({
        kind: 'network',
        code: 'NETWORK_ERROR',
        message: 'Não foi possível conectar ao servidor. Verifique se a API está rodando.',
      });
    }

    const { status, data } = error.response;
    const parsed = apiErrorBodySchema.safeParse(data);

    if (!parsed.success) return unexpectedResponse();

    const { code, message, fields } = parsed.data.error;
    return new ApiError({ kind: kindFor(status, code), code, message, fields });
  }

  return new ApiError({
    kind: 'server',
    code: 'UNKNOWN_ERROR',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  });
}

async function send(run: () => Promise<AxiosResponse<unknown>>): Promise<unknown> {
  try {
    const response = await run();
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

async function request<S extends z.ZodType>(
  schema: S,
  run: () => Promise<AxiosResponse<unknown>>,
): Promise<z.output<S>> {
  const parsed = schema.safeParse(await send(run));
  if (parsed.success) return parsed.data;
  throw unexpectedResponse();
}

export async function calculate(input: CalculateInput): Promise<FenceCalculation> {
  const body = calculateInputSchema.parse(input);
  return request(fenceCalculationSchema, () => http.post('/calculate', body));
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const body = createOrderInputSchema.parse(input);
  return request(orderSchema, () => http.post('/orders', body));
}

export async function listOrders(): Promise<OrderListItem[]> {
  return request(orderListSchema, () => http.get('/orders'));
}

export async function deleteOrder(id: number): Promise<void> {
  const params = orderIdParamsSchema.parse({ id });
  await send(() => http.delete(`/orders/${params.id}`));
}
