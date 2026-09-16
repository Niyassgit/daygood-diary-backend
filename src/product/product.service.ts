import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRODUCT_MESSAGES } from 'src/common/constants/Product.messages';
import { UpdateProductDto } from './dto/update-product.dto';
import CATEGORY_MESSAGES from 'src/common/constants/category.messages';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateProductDto) {
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: {
          id: dto.categoryId,
        },
      });

      if (!category) {
        throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
      }
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        status: dto.status,
        availability: dto.availability,
        categoryId: dto.categoryId,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new Error(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new Error(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: {
          id: dto.categoryId,
        },
      });

      if (!category) {
        throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
      }
    }

    return this.prisma.product.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        status: dto.status,
        availability: dto.availability,
        categoryId: dto.categoryId,
      },
    });
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new Error(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}
