import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor(
        private readonly userService:UsersService
    ){}

    @Get('me')
    @UseGuards(AccessTokenGuard)
    getMe(@Req() req:AuthenticatedRequest){
        return this.userService.findById(
            req.user.userId
        )
    }
}
