import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRODUCT_MESSAGES } from 'src/common/constants/Product.messages';

@Injectable()
export class ProductService {
    constructor(private readonly prisma: PrismaService) {}
    async create(dto:CreateProductDto){

    

        return this.prisma.product.create({
            data:{
                name:dto.name,
                description:dto.description,
                imageUrl:dto.imageUrl,
                status:dto.status,
                availability:dto.availability
            }
        });
    }

    async findAll(){
        return this.prisma.product.findMany({
            orderBy:{
                createdAt:'desc'
            }
        });
    }
    async findOne(id:string){
        const product = await this.prisma.product.findUnique({
            where:{
                id
            }
        });

        if(!product){
            throw new Error(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
        }
        return product;
    }
}
