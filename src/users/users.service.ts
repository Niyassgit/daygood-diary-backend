import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {

    constructor(
        private readonly prisma : PrismaService
    ) {}

    async create(data:{
        name: string,
        email: string,
        password: string,
        phone?: string
    }){
        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: data.password,
                phone: data.phone
            }
        });
    }
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email: email
            }
        });
    }

    async findById(id: string) {   
        return this.prisma.user.findUnique({
            where: {
                id: id
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
    }

    async verifyEmail(userId: string) {
        return this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                emailVerified: true,
                status: 'ACTIVE'
            }
        });
    }
}
