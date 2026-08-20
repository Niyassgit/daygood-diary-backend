import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateAddressDto } from './dto/create-address.dto';

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
    @Post('addresses')
    async crateAddress(
        @Req() req: AuthenticatedRequest,
        @Body() dto:CreateAddressDto,
    ){
        return this.customerService.createAddress(
            req.user.userId,
            dto
        )
    }

    @Get('addresses')
    async getAddresses(
        @Req() req:AuthenticatedRequest,
    ){
        return this.customerService.getAddresses(
            req.user.userId,
        );
    }

    @Get('addresses/:id')
    async getAddress(
        @Req() req:AuthenticatedRequest,
        @Param('id') addressId:string
    ){
        return this.customerService.getAddress(
            req.user.userId,
            addressId
        )
    }
}
