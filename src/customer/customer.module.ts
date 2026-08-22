import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminCustomerController } from './adim-customer-controller';

@Module({
  controllers: [CustomerController, AdminCustomerController],
  providers: [CustomerService, PrismaService],
})
export class CustomerModule {}
