import { CreateOrderInput } from '@autogradil/shared';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateOrderInput) {
    try {
      const order = await this.prismaService.order.create({
        data: {
          lengthMm: input.lengthMm,
          heightMm: input.heightMm,
          color: input.color,
          clientRequestId: input.clientRequestId,
        },
      });
      return { order, created: true };
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

        if (samePayload) return { order: existing, created: false };

        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Este clientRequestId já foi usado em um pedido com outros dados.',
        });
      }
      throw error;
    }
  }
}
