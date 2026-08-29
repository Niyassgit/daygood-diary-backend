import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_CONSTANTS } from 'src/common/constants/auth.constants';
import { AUTH_MESSAGES } from 'src/common/constants/auth.messages';
import { UsersService } from 'src/users/users.service';

interface AccessTokenPayload {
  sub: string;
  role: string;
  type: string;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService:UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.type !== AUTH_CONSTANTS.ACCESS_TOKEN_TYPE) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_ACCESS_TOKEN);
    }
  
    const user =await this.userService.findById(payload.sub);

    if(!user){
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    if(user.status === 'BLOCKED'){
      throw new UnauthorizedException(
        AUTH_MESSAGES.USER_BLOCKED
      )
    }
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
