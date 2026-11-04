import {
  calculateFence,
  orderSchema,
  type CreateOrderInput,
  type Order,
  type OrderListItem,
} from '@autogradil/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, type Order as OrderRecord } from 'src/generated/prisma/client';

function toOrder(record: OrderRecord): Order {
  return orderSchema.parse({ ...record, confirmedAt: record.confirmedAt.toISOString() });
}

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateOrderInput): Promise<{ order: Order; created: boolean }> {
    try {
      const order = await this.prismaService.order.create({
        data: {
          lengthMm: input.lengthMm,
          heightMm: input.heightMm,
          color: input.color,
          clientRequestId: input.clientRequestId,
        },
      });
      return { order: toOrder(order), created: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prismaService.order.findUnique({
          where: { clientRequestId: input.clientRequestId },
        });
        if (!existing) throw error;
        const samePayload =
          existing.lengthMm === input.lengthMm &&
          existing.heightMm === input.heightMm &&
          existing.color === input.color;

        if (samePayload) return { order: toOrder(existing), created: false };

        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Este clientRequestId já foi usado em um pedido com outros dados.',
        });
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prismaService.order.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: `Pedido nº ${id} não encontrado.`,
        });
      }
      throw error;
    }
  }

  async list(): Promise<OrderListItem[]> {
    const records = await this.prismaService.order.findMany({
      orderBy: [{ confirmedAt: 'desc' }, { id: 'desc' }],
    });

    return records.map((record) => {
      const { id, lengthMm, heightMm, color, confirmedAt } = toOrder(record);
      const { soldLengthMm, differenceMm, components } = calculateFence({ lengthMm, heightMm });

      return {
        id,
        lengthMm,
        heightMm,
        color,
        confirmedAt,
        summary: { soldLengthMm, differenceMm, components },
      };
    });
  }
}
