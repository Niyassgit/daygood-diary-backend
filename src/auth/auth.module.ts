import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}),
    MailModule
  ],
  providers: [
    AuthService,
    RefreshTokenStrategy
  ],
  controllers: [AuthController]
})
export class AuthModule {}
