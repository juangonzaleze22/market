import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
  type ThrottlerRequest,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { normalizeEmail } from '../utils/email.util.js';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return super.handleRequest(requestProps);
    }

    const multiplier = Number(
      this.configService.get<string>('AUTH_THROTTLE_DEV_MULTIPLIER') ?? 10,
    );
    const safeMultiplier =
      Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 10;

    return super.handleRequest({
      ...requestProps,
      limit: requestProps.limit * safeMultiplier,
    });
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      req.ips?.[0] ?? req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const rawEmail = req.body?.email;
    const email = typeof rawEmail === 'string' ? normalizeEmail(rawEmail) : '';
    return email ? `${ip}:${email}` : ip;
  }

  protected async getErrorMessage(
    _context: ExecutionContext,
    _detail: ThrottlerLimitDetail,
  ): Promise<string> {
    return 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.';
  }
}
