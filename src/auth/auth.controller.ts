import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RefreshTokenPayload } from './types/refresh-token-payload';

interface AuthenticatedRequest extends Request {
  user: RefreshTokenPayload;
}


@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService : AuthService
    ){}

    @Post('register')
    register(@Body() dto:RegisterDto) {
        return this.authService.register(dto);
    }

    @Get('verify-email')
    verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    
    }
    
    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    refreshToken(@Req() req: AuthenticatedRequest) {
        return this.authService.refresh(req.user);
    }
  
    @UseGuards(RefreshTokenGuard)
    @Post('logout')
    logout(@Req() req: AuthenticatedRequest) {
        return this.authService.logout(req.user);
    }
}
