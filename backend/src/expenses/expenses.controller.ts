import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service.js';
import {
  CreateExpenseDto,
  CreateRecurringExpenseDto,
  ListExpensesQueryDto,
  UpdateExpenseDto,
  UpdateRecurringExpenseDto,
} from './dto/expense.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserRole } from '../database/entities/index.js';

@ApiTags('Admin Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@Query() query: ListExpensesQueryDto) {
    return this.expensesService.findExpenses(query);
  }

  @Get('summary')
  summary(@Query('period') period?: string) {
    return this.expensesService.getSummary(period);
  }

  @Get('recurring')
  findRecurring() {
    return this.expensesService.findRecurring();
  }

  @Post('recurring')
  createRecurring(@Body() dto: CreateRecurringExpenseDto) {
    return this.expensesService.createRecurring(dto);
  }

  @Patch('recurring/:id')
  updateRecurring(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringExpenseDto,
  ) {
    return this.expensesService.updateRecurring(id, dto);
  }

  @Delete('recurring/:id')
  removeRecurring(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.removeRecurring(id);
  }

  @Post()
  create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.expensesService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.remove(id);
  }
}
