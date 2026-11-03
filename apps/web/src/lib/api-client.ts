import axios, { isAxiosError } from 'axios';
import {
  apiErrorBodySchema,
  calculateInputSchema,
  createOrderInputSchema,
  orderIdParamsSchema,
  type CalculateInput,
  type CreateOrderInput,
  type FenceCalculation,
  type Order,
  type OrderListItem,
} from '@autogradil/shared';

export type ApiErrorKind = 'network' | 'validation' | 'not_found' | 'conflict' | 'server';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly code: string;
  readonly status: number | null;
  readonly fields: Record<string, string>;

  constructor(params: {
    kind: ApiErrorKind;
    code: string;
    message: string;
    status?: number | null;
    fields?: Record<string, string>;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.code = params.code;
    this.status = params.status ?? null;
    this.fields = params.fields ?? {};
  }
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

function kindFor(status: number, code: string): ApiErrorKind {
  if (code === 'VALIDATION_ERROR') return 'validation';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  return 'server';
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

    if (parsed.success) {
      const { code, message, fields } = parsed.data.error;
      return new ApiError({ kind: kindFor(status, code), code, message, status, fields });
    }

    return new ApiError({
      kind: 'server',
      code: 'UNEXPECTED_RESPONSE',
      message: 'O servidor respondeu de forma inesperada. Tente novamente.',
      status,
    });
  }

  return new ApiError({
    kind: 'server',
    code: 'UNKNOWN_ERROR',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  });
}

async function request<T>(run: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await run();
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function calculate(input: CalculateInput): Promise<FenceCalculation> {
  const body = calculateInputSchema.parse(input);
  return request(() => http.post<FenceCalculation>('/calculate', body));
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const body = createOrderInputSchema.parse(input);
  return request(() => http.post<Order>('/orders', body));
}

export async function listOrders(): Promise<OrderListItem[]> {
  return request(() => http.get<OrderListItem[]>('/orders'));
}

export async function deleteOrder(id: number): Promise<void> {
  const params = orderIdParamsSchema.parse({ id });
  await request(() => http.delete<void>(`/orders/${params.id}`));
}
