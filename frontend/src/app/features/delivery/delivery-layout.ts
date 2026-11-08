import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DashboardShell,
  DashboardNavItem,
} from '../../shared/layout/dashboard-shell';

@Component({
  selector: 'app-delivery-layout',
  imports: [RouterOutlet, DashboardShell],
  template: `
    <app-dashboard-shell
      testIdPrefix="delivery"
      brandSubtitle="Delivery"
      homePath="/delivery"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-dashboard-shell>
  `,
})
export class DeliveryLayout {
  protected readonly navItems: DashboardNavItem[] = [
    {
      path: '/delivery',
      label: 'Pedidos',
      testId: 'delivery-orders',
      exact: true,
    },
  ];
}
