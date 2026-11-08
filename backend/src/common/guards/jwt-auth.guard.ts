import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { UserRole } from '../../database/entities/user.entity.js';

export const ROLES_KEY = 'roles';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Primero ejecuta la autenticación JWT de Passport
    const result = super.canActivate(context);

    if (result instanceof Observable) {
      return result.pipe();
    }

    if (result instanceof Promise) {
      return result.then((authenticated) => {
        if (!authenticated) return false;
        return this.checkRoles(context);
      });
    }

    if (!result) return false;
    return this.checkRoles(context);
  }

  private checkRoles(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
