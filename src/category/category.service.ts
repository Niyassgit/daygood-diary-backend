import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import CATEGORY_MESSAGES from 'src/common/constants/category.messages';

@Injectable()
export class CategoryService {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(dto: CreateCategoryDto) {
        const existingCategory = await this.prisma.category.findUnique({
            where: {
                name: dto.name,
            },
        });

        if (existingCategory) {
            throw new Error(CATEGORY_MESSAGES.CATEGORY_ALREADY_EXISTS);
        }
        return this.prisma.category.create({
            data: {
                name: dto.name,
                description: dto.description,
                imageUrl: dto.imageUrl,
                status: dto.status,
            },
        });
    }
}
