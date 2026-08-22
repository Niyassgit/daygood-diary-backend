import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CustomerService } from './customer.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminUpdateCustomerDto } from './dto/adimn-update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';

@Controller('customers')
@UseGuards(AccessTokenGuard, RolesGuard)
export class AdminCustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCustomers(@Query() query: CustomerQueryDto) {
    return this.customerService.getCutomers(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCustomerById(@Param('id') customerId: string) {
    return this.customerService.getCustomerById(customerId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCustomer(
    @Param('id') customerId: string,
    @Body() dto: AdminUpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(customerId, dto);
  }

  @Patch(':id/block')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async blockCustomer(@Param('id') customerId: string) {
    return this.customerService.blockCustomer(customerId);
  }

  @Patch(':id/unblock')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async unblockCustomer(@Param('id') customerId: string) {
    return this.customerService.unblockCustomer(customerId);
  }
}
