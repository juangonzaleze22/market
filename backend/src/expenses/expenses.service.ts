import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import {
  Expense,
  ExpenseKind,
  RecurringExpense,
} from '../database/entities/index.js';
import { resolvePeriod, toDateOnly } from '../common/utils/period.util.js';
import {
  CreateExpenseDto,
  CreateRecurringExpenseDto,
  ListExpensesQueryDto,
  UpdateExpenseDto,
  UpdateRecurringExpenseDto,
} from './dto/expense.dto.js';

@Injectable()
export class ExpensesService implements OnModuleInit {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(RecurringExpense)
    private readonly recurringRepository: Repository<RecurringExpense>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.syncRecurringExpenses();
    } catch {
      // La DB puede no estar disponible al iniciar; el cron reintenta.
    }
  }

  @Cron('5 0 * * *')
  async syncRecurringExpenses(now = new Date()): Promise<void> {
    const templates = await this.recurringRepository.find({
      where: { isActive: true },
    });

    for (const template of templates) {
      await this.generateForTemplate(template, now);
    }
  }

  private async generateForTemplate(
    template: RecurringExpense,
    now: Date,
  ): Promise<void> {
    const start = new Date(`${template.startDate}T00:00:00`);
    const endLimit = template.endDate
      ? new Date(`${template.endDate}T23:59:59`)
      : null;
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let lastGeneratedAt = template.lastGeneratedAt;

    while (cursor <= currentMonth) {
      const lastDay = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        0,
      ).getDate();
      const day = Math.min(template.dayOfMonth, lastDay);
      const target = new Date(cursor.getFullYear(), cursor.getMonth(), day);

      if (target >= start && target <= now && (!endLimit || target <= endLimit)) {
        const date = toDateOnly(target);
        if (lastGeneratedAt && date <= lastGeneratedAt) {
          cursor.setMonth(cursor.getMonth() + 1);
          continue;
        }

        const exists = await this.expenseRepository.findOne({
          where: { recurringExpenseId: template.id, date },
        });

        if (!exists) {
          const expense = this.expenseRepository.create({
            date,
            amount: Number(template.amount),
            category: template.category,
            kind: template.kind,
            description: template.description,
            supplier: template.supplier,
            notes: template.notes,
            receiptUrl: null,
            recurringExpenseId: template.id,
            createdById: null,
          });
          await this.expenseRepository.save(expense);
        }

        if (!lastGeneratedAt || date > lastGeneratedAt) {
          lastGeneratedAt = date;
        }
      }

      cursor.setMonth(cursor.getMonth() + 1);
    }

    if (lastGeneratedAt !== template.lastGeneratedAt) {
      template.lastGeneratedAt = lastGeneratedAt;
      await this.recurringRepository.save(template);
    }
  }

  async findExpenses(query: ListExpensesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { from, to } = resolvePeriod(query.period);
    const toDate = toDateOnly(to);

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.date <= :toDate', { toDate })
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (from) {
      qb.andWhere('expense.date >= :fromDate', { fromDate: toDateOnly(from) });
    }
    if (query.category) {
      qb.andWhere('expense.category = :category', { category: query.category });
    }
    if (query.kind) {
      qb.andWhere('expense.kind = :kind', { kind: query.kind });
    }
    if (query.search) {
      qb.andWhere(
        '(expense.description ILIKE :search OR expense.supplier ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((expense) => ({
        ...expense,
        amount: Number(expense.amount),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSummary(period?: string) {
    const { from, to, period: resolvedPeriod } = resolvePeriod(period);
    const toDate = toDateOnly(to);

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('expense.kind', 'kind')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('expense.date <= :toDate', { toDate })
      .groupBy('expense.category')
      .addGroupBy('expense.kind');

    if (from) {
      qb.andWhere('expense.date >= :fromDate', { fromDate: toDateOnly(from) });
    }

    const rows = await qb.getRawMany<{
      category: string;
      kind: string;
      total: string;
      count: string;
    }>();

    const byCategory = new Map<
      string,
      { category: string; total: number; count: number }
    >();
    let operatingTotal = 0;
    let investmentTotal = 0;

    for (const row of rows) {
      const total = Number(row.total);
      const count = Number(row.count);
      const current = byCategory.get(row.category) ?? {
        category: row.category,
        total: 0,
        count: 0,
      };
      current.total += total;
      current.count += count;
      byCategory.set(row.category, current);

      if (row.kind === ExpenseKind.INVESTMENT) {
        investmentTotal += total;
      } else {
        operatingTotal += total;
      }
    }

    return {
      period: resolvedPeriod,
      operatingTotal,
      investmentTotal,
      total: operatingTotal + investmentTotal,
      byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    };
  }

  async create(dto: CreateExpenseDto, createdById?: string) {
    const expense = this.expenseRepository.create({
      ...dto,
      date: dto.date.slice(0, 10),
      amount: Number(dto.amount),
      supplier: dto.supplier ?? null,
      notes: dto.notes ?? null,
      receiptUrl: dto.receiptUrl ?? null,
      recurringExpenseId: null,
      createdById: createdById ?? null,
    });
    const saved = await this.expenseRepository.save(expense);
    return { ...saved, amount: Number(saved.amount) };
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    Object.assign(expense, dto);
    if (dto.date) {
      expense.date = dto.date.slice(0, 10);
    }
    if (dto.amount !== undefined) {
      expense.amount = Number(dto.amount);
    }

    const saved = await this.expenseRepository.save(expense);
    return { ...saved, amount: Number(saved.amount) };
  }

  async remove(id: string) {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }
    await this.expenseRepository.delete(id);
    return { deleted: true, id };
  }

  async findRecurring() {
    const data = await this.recurringRepository.find({
      order: { createdAt: 'DESC' },
    });
    return data.map((item) => ({ ...item, amount: Number(item.amount) }));
  }

  async createRecurring(dto: CreateRecurringExpenseDto) {
    const template = this.recurringRepository.create({
      ...dto,
      amount: Number(dto.amount),
      startDate: dto.startDate.slice(0, 10),
      endDate: dto.endDate ? dto.endDate.slice(0, 10) : null,
      supplier: dto.supplier ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
      lastGeneratedAt: null,
    });
    const saved = await this.recurringRepository.save(template);
    await this.generateForTemplate(saved, new Date());
    return { ...saved, amount: Number(saved.amount) };
  }

  async updateRecurring(id: string, dto: UpdateRecurringExpenseDto) {
    const template = await this.recurringRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Gasto recurrente no encontrado');
    }

    Object.assign(template, dto);
    if (dto.amount !== undefined) {
      template.amount = Number(dto.amount);
    }
    if (dto.startDate) {
      template.startDate = dto.startDate.slice(0, 10);
    }
    if (dto.endDate !== undefined) {
      template.endDate = dto.endDate ? dto.endDate.slice(0, 10) : null;
    }

    const saved = await this.recurringRepository.save(template);
    if (saved.isActive) {
      await this.generateForTemplate(saved, new Date());
    }
    return { ...saved, amount: Number(saved.amount) };
  }

  async removeRecurring(id: string) {
    const template = await this.recurringRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Gasto recurrente no encontrado');
    }

    await this.expenseRepository.update(
      { recurringExpenseId: id },
      { recurringExpenseId: null },
    );
    await this.recurringRepository.delete(id);
    return { deleted: true, id };
  }
}
