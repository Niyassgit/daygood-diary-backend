import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { RedisService } from 'src/redis/redis.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService : UsersService,
        private readonly redisService: RedisService,
        private readonly mailService: MailService
    ) {}

    async register(dto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(dto.email);

        if(existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await argon2.hash(dto.password);
         const user =await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone
        });

        const token =randomBytes(32).toString('hex');
        const key = `email-verification:${token}`;
        
          await this.redisService.set(
            key,
            user.id,
            60 * 60 * 24
          ); // Store the token in Redis with a TTL of 24 hours
         
    
          await this.mailService.sendVerificationEmail(
            user.email,
            token
          );

        return { message: 'Registration successful. Please verify your email.' };
    }

    async verifyEmail(token: string) {
        
        const key = `email-verification:${token}`;
        const userId = await this.redisService.get(key);

        if (!userId) {
            throw new BadRequestException('Invalid or expired verification link');
        }

        const user = await this.usersService.findById(userId);

        if(!user){
            throw new NotFoundException('User not found');
        }

        if(user.emailVerified){
            await this.redisService.delete(key); 

            return { message: 'Email already verified' };
        }

        await this.usersService.verifyEmail(userId);

        await this.redisService.delete(key); // Delete the token from Redis after successful verification

        return { message: 'Email verified successfully' };

         
    }
    
}
