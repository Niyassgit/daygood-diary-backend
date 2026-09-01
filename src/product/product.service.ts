import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
