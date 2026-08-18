import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@Controller('customer')
@UseGuards(AccessTokenGuard)
export class CustomerController {

    constructor(
        private readonly customerService:CustomerService,
    ){}

    @Get('me')
    async getMyProfille(
        @Req() req: AuthenticatedRequest,
    ){
        return this.customerService.getMyProfile(
            req.user.userId
        );
    }

    @Patch('me')
    async updateMyProfile(
        @Req() req: AuthenticatedRequest,
        @Body() dto: UpdateCustomerDto
    ){
        return this.customerService.updateMyProfile(
            req.user.userId,
            dto,
        );
    }
}
