import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import CATEGORY_MESSAGES from 'src/common/constants/category.messages';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return this.prisma.category.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        status: dto.status,
      },
    });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return this.prisma.category.delete({
      where: {
        id,
      },
    });
  }
}
