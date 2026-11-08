import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity.js';
import { normalizeEmail } from '../common/utils/email.util.js';
import { MailService } from '../mail/mail.service.js';
import {
  expiryFromNow,
  generateOpaqueToken,
  hashToken,
  isExpired,
  tokenMatches,
} from './token.util.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const REGISTER_MESSAGE =
  'Si el correo es válido, recibirás un mensaje para completar el registro.';
const RESEND_MESSAGE =
  'Si la cuenta existe y no está verificada, recibirás un nuevo correo.';
const FORGOT_MESSAGE =
  'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.';

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash = '';

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await hash(randomBytes(16).toString('hex'), 10);
    await this.backfillLegacyUsers();
  }

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    const passwordHash = await hash(dto.password, 10);
    const token = generateOpaqueToken();

    const user = this.usersRepository.create({
      email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.CUSTOMER,
      emailVerifiedAt: null,
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: expiryFromNow(VERIFICATION_TTL_MS),
    });

    let saved: User;
    try {
      saved = await this.usersRepository.save(user);
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      await this.handleExistingAccount(email);
      return this.registerResponse();
    }

    void this.sendVerificationSafely(saved, token);
    return this.registerResponse(token);
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationTokenHash: hashToken(token) },
    });

    if (
      !user ||
      isExpired(user.emailVerificationExpiresAt) ||
      !tokenMatches(token, user.emailVerificationTokenHash)
    ) {
      throw new BadRequestException('El enlace de verificación es inválido o expiró');
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    user.tokenVersion += 1;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepository.save(user);

    return this.authResponse(user);
  }

  async resendVerification(dtoEmail: string) {
    const user = await this.usersRepository.findOne({
      where: { email: normalizeEmail(dtoEmail) },
    });

    if (user && !user.emailVerifiedAt) {
      const token = generateOpaqueToken();
      user.emailVerificationTokenHash = hashToken(token);
      user.emailVerificationExpiresAt = expiryFromNow(VERIFICATION_TTL_MS);
      await this.usersRepository.save(user);
      void this.sendVerificationSafely(user, token);
    } else if (user && user.emailVerifiedAt) {
      void this.sendAccountExistsSafely(user);
    }

    return { message: RESEND_MESSAGE };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: normalizeEmail(dto.email) },
    });

    if (!user) {
      await compare(dto.password, this.dummyHash);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.assertNotLocked(user);

    const isMatch = await compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.registerFailedAttempt(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (this.requiresVerification() && !user.emailVerifiedAt) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Debes verificar tu correo antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    return this.authResponse(user);
  }

  async forgotPassword(dtoEmail: string) {
    const user = await this.usersRepository.findOne({
      where: { email: normalizeEmail(dtoEmail) },
    });

    if (user) {
      const token = generateOpaqueToken();
      user.passwordResetTokenHash = hashToken(token);
      user.passwordResetExpiresAt = expiryFromNow(PASSWORD_RESET_TTL_MS);
      await this.usersRepository.save(user);
      void this.sendPasswordResetSafely(user, token);
    }

    return { message: FORGOT_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { passwordResetTokenHash: hashToken(dto.token) },
    });

    if (
      !user ||
      isExpired(user.passwordResetExpiresAt) ||
      !tokenMatches(dto.token, user.passwordResetTokenHash)
    ) {
      throw new BadRequestException('El enlace es inválido o expiró');
    }

    user.passwordHash = await hash(dto.password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    user.tokenVersion += 1;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepository.save(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const isMatch = await compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    user.passwordHash = await hash(dto.newPassword, 10);
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
  }

  async logoutAll(userId: string) {
    await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
  }

  private registerResponse(devToken?: string) {
    return {
      message: REGISTER_MESSAGE,
      ...(this.exposeDevToken() && devToken
        ? { devVerificationToken: devToken }
        : {}),
    };
  }

  private async handleExistingAccount(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return;

    if (!user.emailVerifiedAt) {
      const token = generateOpaqueToken();
      user.emailVerificationTokenHash = hashToken(token);
      user.emailVerificationExpiresAt = expiryFromNow(VERIFICATION_TTL_MS);
      await this.usersRepository.save(user);
      void this.sendVerificationSafely(user, token);
      return;
    }

    void this.sendAccountExistsSafely(user);
  }

  private async sendVerificationSafely(user: User, token: string) {
    try {
      await this.mailService.sendVerificationEmail({
        to: user.email,
        firstName: user.firstName,
        token,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de verificación a ${user.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async sendPasswordResetSafely(user: User, token: string) {
    try {
      await this.mailService.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        token,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de reseteo a ${user.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async sendAccountExistsSafely(user: User) {
    try {
      await this.mailService.sendAccountExistsEmail({
        to: user.email,
        firstName: user.firstName,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso de cuenta existente a ${user.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private assertNotLocked(user: User) {
    if (!user.lockedUntil) return;
    if (user.lockedUntil.getTime() > Date.now()) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta más tarde.',
          code: 'ACCOUNT_LOCKED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    user.lockedUntil = null;
    user.failedLoginAttempts = 0;
  }

  private async registerFailedAttempt(user: User) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    user.failedLoginAttempts = attempts;

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }

    await this.usersRepository.save(user);
  }

  private requiresVerification() {
    return (
      this.configService.get<string>('AUTH_REQUIRE_EMAIL_VERIFICATION') !==
      'false'
    );
  }

  private exposeDevToken() {
    return (
      this.configService.get<string>('NODE_ENV') !== 'production' &&
      this.configService.get<string>('AUTH_EXPOSE_VERIFICATION_TOKEN') === 'true'
    );
  }

  private authResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.tokenVersion ?? 0,
    };

    return {
      user: this.toAuthUser(user),
      token: this.jwtService.sign(payload, {
        secret:
          this.configService.get<string>('JWT_SECRET') ?? 'default-secret',
        expiresIn:
          (this.configService.get<string>('JWT_EXPIRES_IN') as `${number}d`) ??
          '7d',
      }),
    };
  }

  private toAuthUser(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23505'
    );
  }

  private async backfillLegacyUsers() {
    try {
      await this.usersRepository
        .createQueryBuilder()
        .update(User)
        .set({ emailVerifiedAt: () => '"createdAt"' })
        .where('"emailVerifiedAt" IS NULL')
        .andWhere('"emailVerificationTokenHash" IS NULL')
        .andWhere('"emailVerificationExpiresAt" IS NULL')
        .execute();
    } catch (error) {
      this.logger.warn(
        'No se pudo ejecutar el backfill de usuarios legacy',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
