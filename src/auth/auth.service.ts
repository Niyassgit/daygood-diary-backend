import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { RedisService } from 'src/redis/redis.service';
import { MailService } from 'src/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import { JwtService ,JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload } from './types/refresh-token-payload';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService : UsersService,
        private readonly redisService: RedisService,
        private readonly mailService: MailService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
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

    async login(dto:LoginDto){
        const user = await this.usersService.findByEmail(dto.email);

        if(!user){
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordValid =await argon2.verify(
            user.passwordHash,
            dto.password
        );

        if(!passwordValid){
            throw new UnauthorizedException('Invalid email or password');
        }

        if(!user.emailVerified){
            throw new ForbiddenException('Please verify your email before logging in');
        }

        if(user.status !== 'ACTIVE'){
            throw new ForbiddenException('Your account is not active. Please contact support.');
        }

        const sessionId = uuidv4();

        const accessToken = await this.generateAccessToken(user.id, user.role);
        const refreshToken = await this.generateRefreshToken(user.id, sessionId);

        await this.redisService.set(
       `auth:refresh:${sessionId}`,
       user.id,
         60 * 60 * 24 * 7,
         );

        return { message: 'Login successful',
            accessToken,
            refreshToken
         };
    }

    private generateAccessToken(userId: string, role: string) {
        return this.jwtService.signAsync(
            {
                sub:userId,
                role:role,
                type:'access'
            },
            {
                secret:this.configService.getOrThrow<string>('jwt.secret'),
                expiresIn:this.configService.getOrThrow<JwtSignOptions['expiresIn']>('jwt.expiresIn')
            }
        );
    
    }

    private generateRefreshToken(userId: string, sessionId: string) {
        return this.jwtService.signAsync(
            {
                sub:userId,
                sid:sessionId,
                type:'refresh'
            },
            {
                secret:this.configService.getOrThrow<string>('jwt.refreshSecret'),
                expiresIn:this.configService.getOrThrow<JwtSignOptions['expiresIn']>('jwt.refreshExpiresIn')
            }
        );
    }

   async refresh(payload: RefreshTokenPayload) {

        const userId = payload.sub;
        const sessionId = payload.sid;

        const key= `auth:refresh:${sessionId}`;
        const storedUserId =await this.redisService.get(key);

       if (!storedUserId) {
    throw new UnauthorizedException(
      'Invalid or expired refresh session',
    );
  }

  if (storedUserId !== userId) {
    throw new UnauthorizedException(
      'Invalid refresh session',
    );
  }

  await this.redisService.delete(key);

  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  if(user.status !== 'ACTIVE' || !user.emailVerified){
    throw new ForbiddenException('Your account is not active or email is not verified.');
  }

  const newSessionId = uuidv4();
  const accessToken = await this.generateAccessToken(user.id, user.role);
  const refreshToken = await this.generateRefreshToken(user.id, newSessionId);

  await this.redisService.set(
    `auth:refresh:${newSessionId}`,
    user.id,
    60 * 60 * 24 * 7 // Store the new refresh token in Redis with a TTL of 7 days
  );

  return {
    accessToken,
    refreshToken,
  };
}
}
