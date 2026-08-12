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
import { AUTH_CONSTANTS } from 'src/common/constants/auth.constants';
import { AUTH_MESSAGES } from 'src/common/constants/auth.messages';

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
            throw new ConflictException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
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
            AUTH_CONSTANTS.REDIS_STORE_TTL
          ); // Store the token in Redis with a TTL of 24 hours
         
    
          await this.mailService.sendVerificationEmail(
            user.email,
            token
          );

        return { message: AUTH_MESSAGES.REGISTRATION_SUCCESS };
    }

    async verifyEmail(token: string) {
        
        const key = `email-verification:${token}`;
        const userId = await this.redisService.get(key);

        if (!userId) {
            throw new BadRequestException(AUTH_MESSAGES.INVALID_VERIFICATION_LINK);
        }

        const user = await this.usersService.findById(userId);

        if(!user){
            throw new NotFoundException('User not found');
        }

        if(user.emailVerified){
            await this.redisService.delete(key); 

            return { message: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS };
        }

        await this.usersService.verifyEmail(userId);

        await this.redisService.delete(key); // Delete the token from Redis after successful verification


        return { message: AUTH_MESSAGES.EMAIL_VERIFIED };

         
    }

    async login(dto:LoginDto){
        const user = await this.usersService.findByEmail(dto.email);

        if(!user){
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        const passwordValid =await argon2.verify(
            user.passwordHash,
            dto.password
        );

        if(!passwordValid){
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        if(!user.emailVerified){
            throw new ForbiddenException(AUTH_MESSAGES.EMAIL_NOT_VERIFIED);
        }

        if(user.status !== 'ACTIVE'){
            throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_NOT_ACTIVE);
        }

        const sessionId = uuidv4();

        const accessToken = await this.generateAccessToken(user.id, user.role);
        const refreshToken = await this.generateRefreshToken(user.id, sessionId);

        await this.redisService.set(
       `${AUTH_CONSTANTS.REFRESH_SESSION_PREFIX}:${sessionId}`,
       user.id,
         AUTH_CONSTANTS.REFRESH_SESSION_TTL,
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
                type:AUTH_CONSTANTS.ACCESS_TOKEN_TYPE
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
                type:AUTH_CONSTANTS.REFRESH_TOKEN_TYPE
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

        const key= `${AUTH_CONSTANTS.REFRESH_SESSION_PREFIX}:${sessionId}`;
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
    throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_NOT_ALLOWED);
  }

  const newSessionId = uuidv4();
  const accessToken = await this.generateAccessToken(user.id, user.role);
  const refreshToken = await this.generateRefreshToken(user.id, newSessionId);

  await this.redisService.set(
    `${AUTH_CONSTANTS.REFRESH_SESSION_PREFIX}:${sessionId}`,
    user.id,
    AUTH_CONSTANTS.REFRESH_SESSION_TTL// Store the new refresh token in Redis with a TTL of 7 days
  );

  return {
    accessToken,
    refreshToken,
  };
}
    async logout(payload:RefreshTokenPayload){
        const key = `${AUTH_CONSTANTS.REFRESH_SESSION_PREFIX}:${payload.sid}`;

        await this.redisService.delete(key);

        return{
            Message:AUTH_MESSAGES.LOGOUT_SUCCESS,
        }
    }
}
