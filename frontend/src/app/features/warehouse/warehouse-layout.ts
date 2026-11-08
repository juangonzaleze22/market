import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DashboardShell,
  DashboardNavItem,
} from '../../shared/layout/dashboard-shell';

@Component({
  selector: 'app-warehouse-layout',
  imports: [RouterOutlet, DashboardShell],
  template: `
    <app-dashboard-shell
      testIdPrefix="warehouse"
      brandSubtitle="Bodega"
      homePath="/warehouse"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-dashboard-shell>
  `,
})
export class WarehouseLayout {
  protected readonly navItems: DashboardNavItem[] = [
    {
      path: '/warehouse',
      label: 'Pedidos',
      testId: 'warehouse-orders',
      exact: true,
    },
  ];
}
