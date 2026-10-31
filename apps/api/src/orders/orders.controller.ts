import { createOrderInputSchema, type CreateOrderInput } from '@autogradil/shared';
import { Body, Controller, Res, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { type Response } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createOrderInputSchema)) input: CreateOrderInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.ordersService.create(input);
    res.status(result.created ? 201 : 200);
    return result.order;
  }
}
