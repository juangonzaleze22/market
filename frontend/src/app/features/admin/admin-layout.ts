import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DashboardShell,
  DashboardNavItem,
} from '../../shared/layout/dashboard-shell';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, DashboardShell],
  template: `
    <app-dashboard-shell
      testIdPrefix="admin"
      brandSubtitle="Admin Panel"
      homePath="/admin"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-dashboard-shell>
  `,
})
export class AdminLayout {
  protected readonly navItems: DashboardNavItem[] = [
    { path: '/admin', label: 'Dashboard', testId: 'dashboard', exact: true },
    { path: '/admin/users', label: 'Usuarios', testId: 'users', exact: false },
    { path: '/admin/products', label: 'Productos', testId: 'products', exact: false },
    { path: '/admin/categories', label: 'Categorías', testId: 'categories', exact: false },
    { path: '/admin/orders', label: 'Pedidos', testId: 'orders', exact: false },
    { path: '/admin/branches', label: 'Sucursales', testId: 'branches', exact: false },
    { path: '/admin/expenses', label: 'Gastos', testId: 'expenses', exact: false },
    { path: '/admin/banners', label: 'Banners', testId: 'banners', exact: false },
    { path: '/admin/flash-sales', label: 'Ofertas Flash', testId: 'flash-sales', exact: false },
    { path: '/admin/settings', label: 'Configuración', testId: 'settings', exact: false },
  ];
}
