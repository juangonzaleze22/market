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
import { AdminService } from './admin.service.js';
import {
  ListUsersQueryDto,
  UpdateUserRoleDto,
  UpdateUserBranchDto,
  CreateUserDto,
} from './dto/admin.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserRole, OrderStatus } from '../database/entities/index.js';
import { CreateProductDto, UpdateProductDto } from '../products/dto/product.dto.js';
import { CreateCategoryDto, UpdateCategoryDto } from '../categories/dto/category.dto.js';
import { OrderChatService } from '../chat/order-chat.service.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';
import type { ChatUser } from '../chat/order-chat.service.js';
import { SendMessageBodyDto } from '../chat/dto/chat.dto.js';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly orderChatService: OrderChatService,
    private readonly orderChatGateway: OrderChatGateway,
  ) {}

  // ─── Stats ────────────────────────────────────────────────────────

  @Get('stats')
  getStats(@Query('branchId') branchId?: string) {
    return this.adminService.getStats(branchId);
  }

  @Get('dashboard')
  getDashboard(
    @Query('period') period?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.adminService.getDashboardData(period, branchId);
  }

  // ─── Users ────────────────────────────────────────────────────────

  @Get('users')
  findUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.adminService.updateUserRole(id, dto.role, userId);
  }

  @Patch('users/:id/branch')
  updateUserBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserBranchDto,
  ) {
    return this.adminService.updateUserBranch(id, dto.branchId ?? null);
  }

  @Get('users/:id')
  findOneUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneUser(id);
  }

  @Delete('users/:id')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.adminService.removeUser(id, userId);
  }

  // ─── Products ─────────────────────────────────────────────────────

  @Get('products')
  findProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('stock') stock?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('tagId') tagId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.adminService.findProducts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      stock,
      sort,
      order: (order === 'ASC' || order === 'DESC') ? order : 'DESC',
      tagId,
      branchId,
    });
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeProduct(id);
  }

  // ─── Categories ───────────────────────────────────────────────────

  @Get('categories')
  findCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.adminService.findCategories({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      sort,
      order: (order === 'ASC' || order === 'DESC') ? order : 'ASC',
    });
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeCategory(id);
  }

  // ─── Orders ──────────────────────────────────────────────────────

  @Get('orders')
  findOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.adminService.findOrders({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
      sort,
      order: (order === 'ASC' || order === 'DESC') ? order : 'DESC',
      branchId,
    });
  }

  @Get('orders/:id')
  findOneOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneOrder(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Patch('orders/:id/reject')
  rejectOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectOrder(id, reason);
  }

  @Get('orders/:id/messages')
  getOrderMessages(@CurrentUser() user: ChatUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orderChatService.listForUser(user, id);
  }

  @Post('orders/:id/messages')
  async sendOrderMessage(
    @CurrentUser() user: ChatUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageBodyDto,
  ) {
    const message = await this.orderChatService.sendMessage(user, {
      orderId: id,
      body: dto.body,
      attachments: dto.attachments,
    });
    this.orderChatGateway.emitToOrder(id, 'message', message);
    return message;
  }
}
