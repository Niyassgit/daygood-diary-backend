import { Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOMER_MESSAGES } from 'src/common/constants/customer.messages';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {

    constructor(
        private readonly prisma :PrismaService
    ){}

    async getMyProfile(userId:string){
        const customer =await this.prisma.user.findUnique({
            where:{
                id:userId
            },
            select:{
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        language: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
            }
        });

        if(!customer){
            throw new NotFoundException(CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND);
        }
        return customer;
    }

    async updateMyProfile(
        userId:string,
        dto:UpdateCustomerDto
    ){
        const customer =await this.prisma.user.findUnique({
            where:{
                id:userId
            },
        });

        if(!customer){
            throw new NotFoundException(CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND);
        }
         return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.email !== undefined && {
          email: dto.email,
        }),

        ...(dto.language !== undefined && {
          language: dto.language,
        }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        language: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    }
}
