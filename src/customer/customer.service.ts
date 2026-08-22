import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CUSTOMER_MESSAGES } from 'src/common/constants/customer.messages';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { StringSchema } from 'joi';
import { UpdateAddressDto } from './dto/update-address.dto';
import { dot } from 'node:test/reporters';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const customer = await this.prisma.user.findUnique({
      where: {
        id: userId,
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

    if (!customer) {
      throw new NotFoundException(CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND);
    }
    return customer;
  }

  async updateMyProfile(userId: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!customer) {
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

  async createAddress(userId: string, dto: CreateAddressDto) {
    const customer = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND);
    }

    if (customer.role !== 'CUSTOMER') {
      throw new BadRequestException(CUSTOMER_MESSAGES.ADDRESS_CREATE_REJECT);
    }

    const addressCount = await this.prisma.address.count({
      where: {
        userId,
      },
    });

    const shouldBeDefault = dto.isDefault === true || addressCount === 0;

    if (shouldBeDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });

        return tx.address.create({
          data: {
            userId,
            label: dto.label,
            line1: dto.line1,
            line2: dto.line2,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode,
            latitude: dto.latitude,
            longitude: dto.longitude,
            isDefault: true,
          },
        });
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: false,
      },
    });
  }

  async getAddresses(userId: string) {
    const customer = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND);
    }

    return this.prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException(CUSTOMER_MESSAGES.ADDRESS_NOT_FOUND);
    }
    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException(CUSTOMER_MESSAGES.ADDRESS_NOT_FOUND);
    }

    if (dto.isDefault === false && address.isDefault === true) {
      throw new BadRequestException(
        CUSTOMER_MESSAGES.CUSTOMER_MUST_HAVE_DEFAULT_ADDRES,
      );
    }

    if (dto.isDefault === true) {
      return this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
            id: {
              not: addressId,
            },
          },

          data: {
            isDefault: false,
          },
        });

        return tx.address.update({
          where: {
            id: addressId,
          },

          data: {
            ...(dto.label !== undefined && {
              label: dto.label,
            }),

            ...(dto.line1 !== undefined && {
              line1: dto.line1,
            }),

            ...(dto.line2 !== undefined && {
              line2: dto.line2,
            }),

            ...(dto.city !== undefined && {
              city: dto.city,
            }),

            ...(dto.state !== undefined && {
              state: dto.state,
            }),

            ...(dto.pincode !== undefined && {
              pincode: dto.pincode,
            }),

            ...(dto.latitude !== undefined && {
              latitude: dto.latitude,
            }),

            ...(dto.longitude !== undefined && {
              longitude: dto.longitude,
            }),

            isDefault: true,
          },
        });
      });
    }

    return this.prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        ...(dto.label !== undefined && {
          label: dto.label,
        }),

        ...(dto.line1 !== undefined && {
          line1: dto.line1,
        }),

        ...(dto.line2 !== undefined && {
          line2: dto.line2,
        }),

        ...(dto.city !== undefined && {
          city: dto.city,
        }),

        ...(dto.state !== undefined && {
          state: dto.state,
        }),

        ...(dto.pincode !== undefined && {
          pincode: dto.pincode,
        }),

        ...(dto.latitude !== undefined && {
          latitude: dto.latitude,
        }),

        ...(dto.longitude !== undefined && {
          longitude: dto.longitude,
        }),
      },
    });
  }

  async deleteteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException(CUSTOMER_MESSAGES.ADDRESS_NOT_FOUND);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: {
          id: addressId,
        },
      });

      if (!address.isDefault) {
        return {
          message: CUSTOMER_MESSAGES.ADDRESS_DELETED,
        };
      }

      const nextAddress = await tx.address.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!nextAddress) {
        return {
          message: CUSTOMER_MESSAGES.ADDRESS_DELETED,
        };
      }

      await tx.address.update({
        where: {
          id: nextAddress.id,
        },
        data: {
          isDefault: true,
        },
      });

      return {
        message: CUSTOMER_MESSAGES.ADDRESS_DELETED,
      };
    });
  }

  async getCutomers() {
    return this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
