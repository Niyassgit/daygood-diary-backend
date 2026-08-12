import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthenticatedRequest } from "../types/authenticated-request";
import { AUTH_MESSAGES } from "src/common/constants/auth.messages";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor (
        private readonly reflector:Reflector
    ){}

    canActivate(context: ExecutionContext): boolean {
         const requiredRoles =
         this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ],
         );

         if(!requiredRoles || requiredRoles.length === 0){
            return true;
         }

         const request =
         context.switchToHttp().getRequest<AuthenticatedRequest>();

         const user =request.user;

         if(!user){
            throw new ForbiddenException(
                AUTH_MESSAGES.USER_NOT_AUTHENTICATED
            )
         }
          if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
    }
}