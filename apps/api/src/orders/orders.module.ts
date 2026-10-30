import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule],
  providers: [OrdersService],
  controllers: []
})
export class OrdersModule {}
