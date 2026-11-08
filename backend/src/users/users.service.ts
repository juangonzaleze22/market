import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity.js';
import { Order, OrderStatus } from '../database/entities/order.entity.js';
import { normalizeEmail } from '../common/utils/email.util.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: UserRole;
  emailVerifiedAt?: Date | null;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const user = this.userRepository.create({ ...input, email } as any);
    return this.userRepository.save(user) as any;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: normalizeEmail(email) },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  async getStats(userId: string): Promise<UserStats> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalSpent')
      .addSelect(
        "COUNT(*) FILTER (WHERE order.status = :pending)",
        'pendingOrders',
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE order.status = :delivered)",
        'deliveredOrders',
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE order.status = :cancelled)",
        'cancelledOrders',
      )
      .where('order.userId = :userId', { userId })
      .setParameters({
        pending: OrderStatus.PENDING,
        delivered: OrderStatus.DELIVERED,
        cancelled: OrderStatus.CANCELLED,
      })
      .getRawOne();

    return {
      totalOrders: parseInt(result.totalOrders, 10) || 0,
      totalSpent: parseFloat(result.totalSpent) || 0,
      pendingOrders: parseInt(result.pendingOrders, 10) || 0,
      deliveredOrders: parseInt(result.deliveredOrders, 10) || 0,
      cancelledOrders: parseInt(result.cancelledOrders, 10) || 0,
    };
  }
}
