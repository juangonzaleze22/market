import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { warehouseGuard } from './core/guards/warehouse.guard';
import { deliveryGuard } from './core/guards/delivery.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'shop',
    loadComponent: () => import('./features/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about').then((m) => m.About),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password').then((m) => m.ResetPassword),
  },

  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favorites/favorites').then((m) => m.Favorites),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/orders').then((m) => m.Orders),
  },
  {
    path: 'order-completed/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-completed').then((m) => m.OrderCompleted),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/user-dashboard').then((m) => m.UserDashboard),
  },
  {
    path: 'account/order/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/order-invoice').then((m) => m.OrderInvoice),
  },
  {
    path: 'account/addresses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/user-addresses').then((m) => m.UserAddresses),
  },
  {
    path: 'account/notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'warehouse',
    canActivate: [warehouseGuard],
    loadComponent: () =>
      import('./features/warehouse/warehouse-layout').then((m) => m.WarehouseLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/warehouse/warehouse-orders').then((m) => m.WarehouseOrders),
      },
    ],
  },
  {
    path: 'delivery',
    canActivate: [deliveryGuard],
    loadComponent: () =>
      import('./features/delivery/delivery-layout').then((m) => m.DeliveryLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/delivery/delivery-orders').then((m) => m.DeliveryOrders),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users').then((m) => m.AdminUsers),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/products').then((m) => m.AdminProducts),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories').then((m) => m.AdminCategories),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders').then((m) => m.AdminOrders),
      },
      {
        path: 'branches',
        loadComponent: () =>
          import('./features/admin/branches/branches').then((m) => m.AdminBranches),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/admin/expenses/expenses').then((m) => m.AdminExpenses),
      },
      {
        path: 'banners',
        loadComponent: () =>
          import('./features/admin/banners/banners').then((m) => m.AdminBanners),
      },
      {
        path: 'flash-sales',
        loadComponent: () =>
          import('./features/admin/flash-sales/flash-sales').then((m) => m.AdminFlashSales),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings').then((m) => m.AdminSettings),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
