import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService : UsersService,
    ) {}

    async register(dto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(dto.email);

        if(existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await argon2.hash(dto.password);

        await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone
        });

        return { message: 'User registered successfully' };
    }
    
}
