import {
  createOrderInputSchema,
  orderIdParamsSchema,
  type CreateOrderInput,
  type Order,
  type OrderIdParams,
  type OrderListItem,
} from '@autogradil/shared';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res } from '@nestjs/common';
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
  ): Promise<Order> {
    const result = await this.ordersService.create(input);
    res.status(result.created ? 201 : 200);
    return result.order;
  }

  @Get()
  list(): Promise<OrderListItem[]> {
    return this.ordersService.list();
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param(new ZodValidationPipe(orderIdParamsSchema)) params: OrderIdParams,
  ): Promise<void> {
    await this.ordersService.remove(params.id);
  }
}
