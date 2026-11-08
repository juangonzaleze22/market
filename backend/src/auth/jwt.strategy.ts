import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  ver?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'default-secret',
      issuer: 'market-api',
      audience: 'market-web',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'role',
        'branchId',
        'tokenVersion',
        'lockedUntil',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    if ((payload.ver ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Sesión expirada');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
