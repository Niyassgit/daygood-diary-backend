import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { RefreshTokenPayload } from "../types/refresh-token-payload";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy, 'jwt-refresh') {
        constructor(
            private readonly configService: ConfigService
        ) {
            super({
                jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
                ignoreExpiration:false,
                secretOrKey:configService.getOrThrow<string>('jwt.refreshSecret'),
            });
        }
    
        async validate(
            payload: RefreshTokenPayload
        ) {
            if(payload.type !== 'refresh'){
                throw new UnauthorizedException('Invalid refresh token');
            }
            return payload;
        }
    
    }