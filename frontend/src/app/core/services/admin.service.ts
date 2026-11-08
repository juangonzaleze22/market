import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Tag } from './product.service';
import type {
  Branch,
  DeliveryZone,
  ZonePoint,
} from './branch.service';

export interface BranchPayload {
  name: string;
  slug: string;
  code?: string;
  addressLine?: string;
  city: string;
  state: string;
  country?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  deliveryHours?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface ZonePayload {
  name: string;
  polygon?: ZonePoint[];
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  deliveryFee?: number;
  isActive?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  revenue: number;
  recentOrders: AdminRecentOrder[];
}

export type DashboardPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export interface AdminInventoryRisk {
  id: string;
  name: string;
  sku: string;
  image: string | null;
  stock: number;
  status: 'out' | 'low';
  unitsSold30d: number;
  velocityPerDay: number;
  daysOfCover: number | null;
}

export interface DashboardComparison {
  revenue: number | null;
  orders: number | null;
  delivered: number | null;
  averageOrderValue: number | null;
  grossProfit: number | null;
  netProfit: number | null;
  cancellationRatePoints: number | null;
}

export interface AdminDashboardData {
  period: DashboardPeriod;
  granularity: 'hour' | 'day' | 'month';
  from: string | null;
  to: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  averageOrderValue: number;
  activeOrders: number;
  cancellationRate: number;
  operatingExpenses: number;
  investmentExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  totalUsers: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  ordersToPrepare: number;
  inProgressOrders: number;
  activeProducts: number;
  inventoryUnits: number;
  inventoryValue: number;
  comparison: DashboardComparison | null;
  lowStockProducts: number;
  outOfStockProducts: number;
  productsWithoutCost: number;
  salesByDay: { date: string; revenue: number; orders: number; cost: number }[];
  inventoryAtRisk: AdminInventoryRisk[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  salesByCategory: { name: string; revenue: number }[];
  expensesByCategory: { category: string; total: number }[];
  lowStockAlerts: AdminStockAlert[];
  outOfStockAlerts: AdminStockAlert[];
  recentOrders: AdminRecentOrder[];
}

export interface AdminStockAlert {
  id: string;
  name: string;
  sku: string;
  stock: number;
  image: string | null;
}

export type ExpenseCategory =
  | 'rent'
  | 'remodeling'
  | 'investment'
  | 'services'
  | 'payroll'
  | 'marketing'
  | 'supplies'
  | 'other';

export type ExpenseKind = 'operating' | 'investment';

export interface AdminExpense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  kind: ExpenseKind;
  description: string;
  supplier: string | null;
  notes: string | null;
  receiptUrl: string | null;
  recurringExpenseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  kind: ExpenseKind;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  supplier: string | null;
  notes: string | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminExpenseListResponse {
  data: AdminExpense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminExpenseSummary {
  period: DashboardPeriod;
  operatingTotal: number;
  investmentTotal: number;
  total: number;
  byCategory: { category: ExpenseCategory; total: number; count: number }[];
}

export interface ExpensePayload {
  date: string;
  amount: number;
  category: ExpenseCategory;
  kind: ExpenseKind;
  description: string;
  supplier?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface RecurringExpensePayload {
  description: string;
  amount: number;
  category: ExpenseCategory;
  kind: ExpenseKind;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  supplier?: string;
  notes?: string;
  isActive?: boolean;
}

export interface AdminRecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  branchId?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number | null;
  stock: number;
  sku: string;
  images?: string[];
  featuredImage?: string;
  isActive: boolean;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  tags?: Tag[];
  createdAt: string;
  discountPercent?: number;
  discountPrice?: number;
  hasDiscount?: boolean;
}

export interface AdminProductListResponse {
  data: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon?: string | null;
}

export interface AdminCategoryListResponse {
  data: AdminCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  userId: string;
  paymentMethod: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrder {
  shippingAddressId: string;
  shippingAddress: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  receiptUrl: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
  deliveryId: string | null;
  delivery: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  deliveryPosition: {
    latitude: number;
    longitude: number;
    at: string | null;
  } | null;
  updatedAt: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId: string;
  productImage: string | null;
  flashSaleId: string | null;
  originalPrice: number | null;
  hasFlashDiscount: boolean;
}

export interface AdminOrderListResponse {
  data: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserDetail {
  user: AdminUser;
  stats: {
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  orders: AdminOrder[];
}

export type UploadBucket = 'products' | 'categories' | 'banners';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface AdminFlashSaleItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productPrice?: number;
  quantity: number;
  productStock: number;
}

export interface AdminFlashSale {
  id: string;
  title: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
  maxItems: number;
  isActive: boolean;
  itemCount: number;
  items: AdminFlashSaleItem[];
  createdAt: string;
}

export interface AdminFlashSaleListResponse {
  data: AdminFlashSale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly path = 'admin';

  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  // ─── Stats ────────────────────────────────────────────────────────

  getStats(branchId?: string): Observable<AdminStats> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<AdminStats>(this.api.url(`${this.path}/stats`), { params });
  }

  getDashboard(
    period: DashboardPeriod = 'month',
    branchId?: string,
  ): Observable<AdminDashboardData> {
    let params = new HttpParams().set('period', period);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<AdminDashboardData>(this.api.url(`${this.path}/dashboard`), { params });
  }

  // ─── Branches ─────────────────────────────────────────────────────

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.api.url(`${this.path}/branches`));
  }

  createBranch(payload: BranchPayload): Observable<Branch> {
    return this.http.post<Branch>(this.api.url(`${this.path}/branches`), payload);
  }

  updateBranch(id: string, payload: Partial<BranchPayload>): Observable<Branch> {
    return this.http.patch<Branch>(this.api.url(`${this.path}/branches/${id}`), payload);
  }

  deleteBranch(id: string): Observable<void> {
    return this.http.delete<void>(this.api.url(`${this.path}/branches/${id}`));
  }

  getBranchZones(branchId: string): Observable<DeliveryZone[]> {
    return this.http.get<DeliveryZone[]>(
      this.api.url(`${this.path}/branches/${branchId}/zones`),
    );
  }

  createZone(branchId: string, payload: ZonePayload): Observable<DeliveryZone> {
    return this.http.post<DeliveryZone>(
      this.api.url(`${this.path}/branches/${branchId}/zones`),
      payload,
    );
  }

  updateZone(
    branchId: string,
    zoneId: string,
    payload: Partial<ZonePayload>,
  ): Observable<DeliveryZone> {
    return this.http.patch<DeliveryZone>(
      this.api.url(`${this.path}/branches/${branchId}/zones/${zoneId}`),
      payload,
    );
  }

  deleteZone(branchId: string, zoneId: string): Observable<void> {
    return this.http.delete<void>(
      this.api.url(`${this.path}/branches/${branchId}/zones/${zoneId}`),
    );
  }

  // ─── Expenses ─────────────────────────────────────────────────────

  getExpenses(
    page = 1,
    limit = 20,
    period: DashboardPeriod = 'month',
    category = '',
    kind = '',
    search = '',
  ): Observable<AdminExpenseListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('period', period);
    if (category) params = params.set('category', category);
    if (kind) params = params.set('kind', kind);
    if (search) params = params.set('search', search);
    return this.http.get<AdminExpenseListResponse>(this.api.url(`${this.path}/expenses`), {
      params,
    });
  }

  getExpenseSummary(period: DashboardPeriod = 'month'): Observable<AdminExpenseSummary> {
    const params = new HttpParams().set('period', period);
    return this.http.get<AdminExpenseSummary>(this.api.url(`${this.path}/expenses/summary`), {
      params,
    });
  }

  createExpense(data: ExpensePayload): Observable<AdminExpense> {
    return this.http.post<AdminExpense>(this.api.url(`${this.path}/expenses`), data);
  }

  updateExpense(id: string, data: Partial<ExpensePayload>): Observable<AdminExpense> {
    return this.http.patch<AdminExpense>(this.api.url(`${this.path}/expenses/${id}`), data);
  }

  deleteExpense(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.path}/expenses/${id}`),
    );
  }

  getRecurringExpenses(): Observable<AdminRecurringExpense[]> {
    return this.http.get<AdminRecurringExpense[]>(this.api.url(`${this.path}/expenses/recurring`));
  }

  createRecurringExpense(data: RecurringExpensePayload): Observable<AdminRecurringExpense> {
    return this.http.post<AdminRecurringExpense>(
      this.api.url(`${this.path}/expenses/recurring`),
      data,
    );
  }

  updateRecurringExpense(
    id: string,
    data: Partial<RecurringExpensePayload>,
  ): Observable<AdminRecurringExpense> {
    return this.http.patch<AdminRecurringExpense>(
      this.api.url(`${this.path}/expenses/recurring/${id}`),
      data,
    );
  }

  deleteRecurringExpense(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.path}/expenses/recurring/${id}`),
    );
  }

  // ─── Users ────────────────────────────────────────────────────────

  getUsers(
    page = 1,
    limit = 10,
    search = '',
    role = '',
    sort = '',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Observable<AdminUserListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (sort) {
      params = params.set('sort', sort).set('order', order);
    }
    return this.http.get<AdminUserListResponse>(this.api.url(`${this.path}/users`), { params });
  }

  createUser(data: CreateAdminUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.api.url(`${this.path}/users`), data);
  }

  updateUserRole(id: string, role: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(this.api.url(`${this.path}/users/${id}/role`), { role });
  }

  updateUserBranch(id: string, branchId: string | null): Observable<AdminUser> {
    return this.http.patch<AdminUser>(
      this.api.url(`${this.path}/users/${id}/branch`),
      { branchId },
    );
  }

  getFullUser(id: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(this.api.url(`${this.path}/users/${id}`));
  }

  deleteUser(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.path}/users/${id}`),
    );
  }

  // ─── Products ─────────────────────────────────────────────────────

  getProducts(
    page = 1,
    limit = 10,
    search = '',
    categoryId = '',
    isActive = '',
    stock = '',
    sort = '',
    order: 'ASC' | 'DESC' = 'DESC',
    tagId = '',
  ): Observable<AdminProductListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    if (isActive) {
      params = params.set('isActive', isActive);
    }
    if (stock) {
      params = params.set('stock', stock);
    }
    if (sort) {
      params = params.set('sort', sort).set('order', order);
    }
    if (tagId) {
      params = params.set('tagId', tagId);
    }
    return this.http.get<AdminProductListResponse>(this.api.url(`${this.path}/products`), {
      params,
    });
  }

  createProduct(data: Partial<AdminProduct> & { tagIds?: string[] }): Observable<AdminProduct> {
    return this.http.post<AdminProduct>(this.api.url(`${this.path}/products`), data);
  }

  updateProduct(
    id: string,
    data: Partial<AdminProduct> & { tagIds?: string[] },
  ): Observable<AdminProduct> {
    return this.http.patch<AdminProduct>(this.api.url(`${this.path}/products/${id}`), data);
  }

  deleteProduct(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.path}/products/${id}`),
    );
  }

  // ─── Categories ───────────────────────────────────────────────────

  getCategories(
    page = 1,
    limit = 10,
    search = '',
    sort = '',
    order: 'ASC' | 'DESC' = 'ASC',
  ): Observable<AdminCategoryListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    if (sort) {
      params = params.set('sort', sort).set('order', order);
    }
    return this.http.get<AdminCategoryListResponse>(this.api.url(`${this.path}/categories`), {
      params,
    });
  }

  createCategory(data: Partial<AdminCategory>): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(this.api.url(`${this.path}/categories`), data);
  }

  updateCategory(id: string, data: Partial<AdminCategory>): Observable<AdminCategory> {
    return this.http.patch<AdminCategory>(this.api.url(`${this.path}/categories/${id}`), data);
  }

  deleteCategory(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.path}/categories/${id}`),
    );
  }

  // ─── Tags ────────────────────────────────────────────────────────

  getTags(
    page = 1,
    limit = 50,
    search = '',
  ): Observable<{ data: Tag[]; total: number; page: number; limit: number; totalPages: number }> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<{
      data: Tag[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(this.api.url('tags'), { params });
  }

  createTag(data: Partial<Tag>): Observable<Tag> {
    return this.http.post<Tag>(this.api.url('tags'), data);
  }

  deleteTag(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(this.api.url(`tags/${id}`));
  }

  // ─── Orders ─────────────────────────────────────────────────────

  getOrders(
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sort = '',
    order: 'ASC' | 'DESC' = 'DESC',
    branchId = '',
  ): Observable<AdminOrderListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (sort) {
      params = params.set('sort', sort).set('order', order);
    }
    if (branchId && branchId !== 'all') {
      params = params.set('branchId', branchId);
    }
    return this.http.get<AdminOrderListResponse>(this.api.url(`${this.path}/orders`), { params });
  }

  getOrder(id: string): Observable<AdminOrderDetail> {
    return this.http.get<AdminOrderDetail>(this.api.url(`${this.path}/orders/${id}`));
  }

  updateOrderStatus(id: string, status: string): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(this.api.url(`${this.path}/orders/${id}/status`), {
      status,
    });
  }

  rejectOrder(id: string, reason: string): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(this.api.url(`${this.path}/orders/${id}/reject`), {
      reason,
    });
  }

  // ─── Uploads ────────────────────────────────────────────────────

  uploadImage(bucket: UploadBucket, blob: Blob): Observable<UploadResponse> {
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const form = new FormData();
    form.append('file', blob, `imagen-${Date.now()}.${ext}`);
    return this.http.post<UploadResponse>(this.api.url(`${this.path}/upload/${bucket}`), form);
  }

  // ─── Settings ───────────────────────────────────────────────────

  getSettings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(this.api.url('settings'));
  }

  updateSettings(data: Partial<SiteSettings>): Observable<SiteSettings> {
    return this.http.patch<SiteSettings>(this.api.url('settings'), data);
  }

  // ─── Flash Sales ───────────────────────────────────────────────

  getFlashSales(page = 1, limit = 10): Observable<AdminFlashSaleListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<AdminFlashSaleListResponse>(this.api.url(`${this.path}/flash-sales`), {
      params,
    });
  }

  getFlashSale(id: string): Observable<AdminFlashSale> {
    return this.http.get<AdminFlashSale>(this.api.url(`${this.path}/flash-sales/${id}`));
  }

  createFlashSale(data: {
    title: string;
    discountPercent: number;
    startTime: string;
    endTime: string;
    maxItems?: number;
    isActive?: boolean;
    products: { productId: string; quantity: number }[];
  }): Observable<AdminFlashSale> {
    return this.http.post<AdminFlashSale>(this.api.url(`${this.path}/flash-sales`), data);
  }

  updateFlashSale(
    id: string,
    data: {
      title?: string;
      discountPercent?: number;
      startTime?: string;
      endTime?: string;
      maxItems?: number;
      isActive?: boolean;
      products?: { productId: string; quantity: number }[];
    },
  ): Observable<AdminFlashSale> {
    return this.http.patch<AdminFlashSale>(this.api.url(`${this.path}/flash-sales/${id}`), data);
  }

  deleteFlashSale(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.path}/flash-sales/${id}`),
    );
  }
}

export interface SiteSettings {
  id: string;
  topBannerText: string | null;
  topBannerPhone: string | null;
  topBannerCtaText: string | null;
  topBannerCtaLink: string | null;
  deliveryHours: string | null;
  secondaryLinks: { label: string; url: string }[] | null;
  socialLinks: { platform: string; url: string }[] | null;
  promoMessage: string | null;
  paymentInfo: {
    pago_movil?: { bank: string; phone: string; holderName: string; idDocument: string };
    zelle?: { email: string; holderName: string };
  } | null;
  updatedAt: string;
}
