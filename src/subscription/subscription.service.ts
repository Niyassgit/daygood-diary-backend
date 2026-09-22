import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import SUBSCRIPTION_MESSAGES from 'src/common/constants/subscription.message';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId:string,dto:CreateSubscriptionDto){
        const product = await this.prisma.product.findUnique({
            where:{
                id:dto.productId
            }
        });

        if(!product){
            throw new Error(SUBSCRIPTION_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if(product.status !== 'ACTIVE' || 
            product.availability !== 'AVAILABLE'){
            throw new Error(SUBSCRIPTION_MESSAGES.PRODUCT_NOT_AVAILABLE);
        }

        return this.prisma.subscription.create({
            data:{
                userId,
                productId:dto.productId,
                startDate:new Date(dto.startDate)
            },
            include:{
                product:true,
                schedules:true,
                skipDates:true
            }
        });
    }
    
    async findAll(userId:string){  
        return this.prisma.subscription.findMany({
            where:{
                userId
            },
            include:{
                product:true,
                schedules:true,
                skipDates:true
            },
            orderBy:{
                createdAt:'desc'
            }
        });
    }

    async findOne(userId:string,id:string){
        const subscription = await this.prisma.subscription.findFirst({
            where:{
                id,
                userId
            },
            include:{
                product:true,
                schedules:true,
                skipDates:true
            }
        });
        if(!subscription){
            throw new Error(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
        }
        return subscription;    
    }

    async update(userId:string,id:string,dto:UpdateSubscriptionDto){
        const subscription = await this.prisma.subscription.findFirst({
            where:{ 
                id,
                userId
            }
        });

        if(!subscription){
            throw new Error(SUBSCRIPTION_MESSAGES.SUBSCRIPTION_NOT_FOUND);
        }

        return this.prisma.subscription.update({
            where:{
                id
            },
            data:{
                endDate:dto.endDate ? new Date(dto.endDate) : undefined
            },
            include:{
                product:true,
                schedules:true,
                skipDates:true
            }
        });
    }

}
