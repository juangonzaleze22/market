import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity.js';
import { ROLES_KEY } from '../guards/jwt-auth.guard.js';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
