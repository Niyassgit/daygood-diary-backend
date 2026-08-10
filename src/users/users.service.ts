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
            }
        });
    }
}
