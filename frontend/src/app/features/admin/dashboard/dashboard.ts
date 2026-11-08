import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  AdminService,
  AdminDashboardData,
  DashboardPeriod,
} from '../../../core/services/admin.service';
import { InventoryRiskTable } from './inventory-risk-table';
import { OrderStatusBadge } from '../../../shared/ui/order-status-badge';
import { BranchService } from '../../../core/services/branch.service';

const CHART_COLORS = {
  primary: '#1C8057',
  accent: '#f5a623',
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  gray: '#9ca3af',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  pink: '#ec4899',
};

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'all', label: 'Todo' },
];

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: 'hoy',
  week: 'esta semana',
  month: 'este mes',
  year: 'este año',
  all: 'todo el histórico',
};

type DashboardView = 'operations' | 'sales';

const PIPELINE_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendientes', color: 'bg-gray-400' },
  { value: 'paid', label: 'Pagados', color: 'bg-blue-500' },
  { value: 'processing', label: 'Preparación', color: 'bg-primary' },
  { value: 'shipped', label: 'Enviados', color: 'bg-amber-500' },
  { value: 'out_for_delivery', label: 'Reparto', color: 'bg-accent' },
  { value: 'delivered', label: 'Entregados', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelados', color: 'bg-red-500' },
];

interface AttentionItem {
  label: string;
  description: string;
  value: string | number;
  link: string;
  query: Record<string, string>;
  color: string;
  valueClass: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DatePipe,
    NgClass,
    RouterLink,
    BaseChartDirective,
    InventoryRiskTable,
    OrderStatusBadge,
  ],
  template: `
    <div data-testid="admin-dashboard" class="space-y-2xl">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-lg">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="dashboard-title">
            Dashboard<span class="text-accent">.</span>
          </h1>
          <p class="mt-xxs text-body-sm text-body">
            Centro de control · {{ periodLabel() }} · actualizado
            {{ lastUpdated() | date: 'HH:mm' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-md">
          <div
            class="inline-flex rounded-pill border border-surface-pressed bg-canvas p-xxs"
            data-testid="dashboard-view-toggle"
          >
            <button
              type="button"
              class="rounded-pill px-lg py-sm text-body-sm font-medium transition-colors"
              [ngClass]="
                view() === 'operations'
                  ? 'bg-ink text-on-primary'
                  : 'text-body hover:text-ink'
              "
              data-testid="view-operations"
              (click)="setView('operations')"
            >
              Operación
            </button>
            <button
              type="button"
              class="rounded-pill px-lg py-sm text-body-sm font-medium transition-colors"
              [ngClass]="
                view() === 'sales' ? 'bg-ink text-on-primary' : 'text-body hover:text-ink'
              "
              data-testid="view-sales"
              (click)="setView('sales')"
            >
              Ventas
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-md">
            <select
              class="filter-input"
              [value]="branchId()"
              (change)="changeBranch($any($event.target).value)"
              data-testid="branch-filter"
            >
              <option value="all">Todas las sucursales</option>
              @for (branch of branchService.branches(); track branch.id) {
                <option [value]="branch.id">{{ branch.name }}</option>
              }
            </select>

            <div class="flex flex-wrap items-center gap-xs" data-testid="period-selector">
            @for (option of periodOptions; track option.value) {
              <button
                type="button"
                class="rounded-pill border px-md py-sm text-body-sm font-medium transition-colors"
                [ngClass]="
                  period() === option.value
                    ? 'bg-ink text-on-primary border-ink'
                    : 'bg-canvas text-body border-surface-pressed hover:border-ink'
                "
                [attr.data-testid]="'period-' + option.value"
                (click)="changePeriod(option.value)"
              >
                {{ option.label }}
              </button>
            }
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="h-8 w-8 animate-spin rounded-full border-2 border-surface-pressed border-t-primary"
          ></div>
        </div>
      } @else if (view() === 'operations') {
        <!-- Banda de mando -->
        <section class="rounded-xl bg-primary px-xl py-xl text-on-primary" data-testid="command-bar">
          <div class="grid gap-xl lg:grid-cols-3">
            <div>
              <p class="text-body-sm text-on-primary/70">Pedidos por atender</p>
              <p class="mt-xs text-display-xl font-bold leading-none" data-testid="command-backlog">
                {{ number(data()?.ordersToPrepare) }}
              </p>
              <p class="mt-xs text-body-xs text-on-primary/70">
                Pendientes + aceptados · backlog actual
              </p>
            </div>

            <div
              class="border-t border-on-primary/15 pt-lg lg:border-l lg:border-t-0 lg:pl-xl lg:pt-0"
            >
              <p class="text-body-sm text-on-primary/70">Ingresos · {{ periodLabel() }}</p>
              <p class="mt-xs text-display-md font-bold leading-none" data-testid="command-revenue">
                {{ money(data()?.totalRevenue) }}
              </p>
              @if (data()?.comparison?.revenue !== null && data()?.comparison?.revenue !== undefined) {
                <p class="mt-xs text-body-xs" [ngClass]="darkDeltaClass(data()?.comparison?.revenue)">
                  {{ deltaArrow(data()?.comparison?.revenue) }}
                  {{ deltaText(data()?.comparison?.revenue) }} vs período anterior
                </p>
              } @else {
                <p class="mt-xs text-body-xs text-on-primary/70">Sin comparación disponible</p>
              }
            </div>

            <div
              class="border-t border-on-primary/15 pt-lg lg:border-l lg:border-t-0 lg:pl-xl lg:pt-0"
            >
              <p class="text-body-sm text-on-primary/70">Tasa de cancelación</p>
              <p class="mt-xs text-display-md font-bold leading-none" data-testid="command-cancellation">
                {{ percent(data()?.cancellationRate) }}
              </p>
              @if (
                data()?.comparison?.cancellationRatePoints !== null &&
                data()?.comparison?.cancellationRatePoints !== undefined
              ) {
                <p
                  class="mt-xs text-body-xs"
                  [ngClass]="darkDeltaClass(data()?.comparison?.cancellationRatePoints, true)"
                >
                  {{ deltaArrow(data()?.comparison?.cancellationRatePoints) }}
                  {{ deltaText(data()?.comparison?.cancellationRatePoints, 'pp') }} vs período
                  anterior
                </p>
              } @else {
                <p class="mt-xs text-body-xs text-on-primary/70">Sin comparación disponible</p>
              }
            </div>
          </div>
        </section>

        <!-- Requiere atención -->
        <section
          class="rounded-xl border border-surface-pressed bg-canvas"
          data-testid="action-center"
        >
          <div class="flex items-center justify-between border-b border-surface-pressed px-xl py-lg">
            <div class="flex items-center gap-sm">
              <span
                class="h-2 w-2 rounded-full"
                [ngClass]="attentionItems().length > 0 ? 'bg-amber-500' : 'bg-green-500'"
              ></span>
              <h2 class="text-body-lg font-bold">Requiere atención</h2>
              @if (attentionItems().length > 0) {
                <span
                  class="rounded-pill bg-ink px-sm py-xxs text-body-xs font-semibold text-on-primary"
                  >{{ attentionItems().length }}</span
                >
              }
            </div>
            <a routerLink="/admin/orders" class="text-body-sm text-link hover:underline"
              >Ir a pedidos</a
            >
          </div>

          @if (attentionItems().length > 0) {
            <div class="divide-y divide-surface-pressed">
              @for (item of attentionItems(); track item.label) {
                <a
                  [routerLink]="item.link"
                  [queryParams]="item.query"
                  class="flex items-center gap-md px-xl py-md transition-colors hover:bg-canvas-softer"
                  [attr.data-testid]="'attention-' + item.label"
                >
                  <span class="h-2 w-2 shrink-0 rounded-full" [ngClass]="item.color"></span>
                  <div class="min-w-0 flex-1">
                    <p class="text-body-sm-strong">{{ item.label }}</p>
                    <p class="text-body-xs text-body">{{ item.description }}</p>
                  </div>
                  <span class="text-body-lg font-bold" [ngClass]="item.valueClass">{{
                    item.value
                  }}</span>
                  <span class="text-body-sm font-semibold text-link">Resolver →</span>
                </a>
              }
            </div>
          } @else {
            <p class="px-xl py-2xl text-body-sm text-body">
              Sin alertas críticas. Stock, pedidos y costos están bajo control.
            </p>
          }
        </section>

        <!-- Pedidos + inventario -->
        <div class="grid grid-cols-1 gap-lg xl:grid-cols-3">
          <section
            class="rounded-xl border border-surface-pressed bg-canvas p-xl xl:col-span-2"
            data-testid="orders-panel"
          >
            <div class="flex flex-wrap items-end justify-between gap-md">
              <div>
                <h2 class="text-body-lg font-bold">Pedidos</h2>
                <p class="text-body-sm text-body">
                  {{ pipelineTotal() }} en {{ periodLabel() }}
                </p>
              </div>
              <a routerLink="/admin/orders" class="text-body-sm text-link hover:underline"
                >Ver pedidos</a
              >
            </div>

            <div class="mt-lg flex h-3 w-full overflow-hidden rounded-pill bg-canvas-soft">
              @for (item of pipeline(); track item.value) {
                @if (item.count > 0) {
                  <div
                    [ngClass]="item.color"
                    [style.width.%]="item.percent"
                    [title]="item.label + ': ' + item.count"
                  ></div>
                }
              }
            </div>

            <div class="mt-md flex flex-wrap gap-x-lg gap-y-xs">
              @for (item of pipeline(); track item.value) {
                <a
                  routerLink="/admin/orders"
                  [queryParams]="{ status: item.value }"
                  class="flex items-center gap-xs text-body-xs text-body hover:text-ink"
                >
                  <span class="h-2 w-2 rounded-full" [ngClass]="item.color"></span>
                  {{ item.label }}
                  <span class="font-semibold text-ink">{{ item.count }}</span>
                </a>
              }
            </div>

            <div class="mt-lg h-[240px]" data-testid="chart-orders-day">
              <canvas
                baseChart
                [data]="ordersByDayChartData()"
                [options]="ordersByDayOptions()"
                [type]="'bar'"
              ></canvas>
            </div>
          </section>

          <section
            class="flex h-full flex-col rounded-xl border border-surface-pressed bg-canvas p-xl"
            data-testid="inventory-summary"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-body-lg font-bold">Inventario</h2>
            </div>

            <div class="mt-lg flex items-baseline gap-sm">
              <p class="text-display-md font-bold leading-none" data-testid="inventory-units">
                {{ number(data()?.inventoryUnits) }}
              </p>
              <span class="text-body-sm text-body">unidades en catálogo</span>
            </div>

            <dl class="mt-lg grid grid-cols-2 gap-md">
              <div>
                <dt class="text-body-xs text-body">Valor a costo</dt>
                <dd class="text-body-md font-semibold">{{ money(data()?.inventoryValue) }}</dd>
              </div>
              <div>
                <dt class="text-body-xs text-body">Productos activos</dt>
                <dd class="text-body-md font-semibold">{{ number(data()?.activeProducts) }}</dd>
              </div>
            </dl>

            <div class="mt-lg flex h-2 w-full overflow-hidden rounded-pill bg-canvas-soft">
              <div class="bg-green-500" [style.width.%]="inventoryHealth().healthyPct"></div>
              <div class="bg-amber-500" [style.width.%]="inventoryHealth().lowPct"></div>
              <div class="bg-red-500" [style.width.%]="inventoryHealth().outPct"></div>
            </div>
            <div class="mt-md flex flex-wrap gap-x-lg gap-y-xs text-body-xs text-body">
              <span class="flex items-center gap-xs">
                <span class="h-2 w-2 rounded-full bg-green-500"></span>
                Saludable {{ inventoryHealth().healthy }}
              </span>
              <span class="flex items-center gap-xs">
                <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                Bajo {{ inventoryHealth().low }}
              </span>
              <span class="flex items-center gap-xs">
                <span class="h-2 w-2 rounded-full bg-red-500"></span>
                Agotado {{ inventoryHealth().out }}
              </span>
            </div>

            <a
              routerLink="/admin/products"
              class="mt-auto inline-flex items-center gap-xs pt-lg text-body-sm font-semibold text-link hover:underline"
            >
              Gestionar inventario →
            </a>
          </section>
        </div>

        <!-- Inventario en riesgo -->
        <section
          class="rounded-xl border border-surface-pressed bg-canvas"
          data-testid="inventory-risk"
        >
          <div class="flex flex-wrap items-center justify-between gap-md px-xl py-lg">
            <div>
              <h2 class="text-body-lg font-bold">Inventario en riesgo</h2>
              <p class="text-body-sm text-body">
                Priorizado por días de cobertura según ventas de los últimos 30 días
              </p>
            </div>
            <a routerLink="/admin/products" class="text-body-sm text-link hover:underline"
              >Gestionar productos</a
            >
          </div>
          <app-inventory-risk-table [items]="data()?.inventoryAtRisk ?? []" />
        </section>

        <!-- Pedidos recientes -->
        <section
          class="rounded-xl border border-surface-pressed bg-canvas"
          data-testid="recent-orders"
        >
          <div class="flex items-center justify-between border-b border-surface-pressed px-xl py-lg">
            <h2 class="text-body-lg font-bold">Pedidos recientes</h2>
            <a
              routerLink="/admin/orders"
              class="text-body-sm text-link hover:underline"
              data-testid="view-all-orders"
              >Ver todos</a
            >
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left">
              <thead>
                <tr
                  class="border-b border-surface-pressed text-body-xs uppercase tracking-wide text-body"
                >
                  <th class="px-xl py-sm font-medium">Pedido</th>
                  <th class="px-md py-sm font-medium">Fecha</th>
                  <th class="px-md py-sm font-medium">Estado</th>
                  <th class="px-xl py-sm text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-pressed">
                @for (order of data()?.recentOrders ?? []; track order.id) {
                  <tr
                    class="transition-colors hover:bg-canvas-softer"
                    [attr.data-testid]="'order-' + order.id"
                  >
                    <td class="px-xl py-md text-body-sm-strong">{{ order.orderNumber }}</td>
                    <td class="px-md py-md text-body-sm text-body">
                      {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-md py-md">
                      <app-order-status [status]="order.status" />
                    </td>
                    <td class="px-xl py-md text-right text-body-sm-strong">
                      {{ money(order.totalAmount) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-xl py-2xl text-center text-body-sm text-body">
                      No hay pedidos recientes
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <!-- Vista Ventas -->
        <div class="grid grid-cols-1 gap-lg xl:grid-cols-3">
          <section
            class="rounded-xl border border-surface-pressed bg-canvas p-xl xl:col-span-2"
            data-testid="chart-revenue-cost"
          >
            <div class="flex flex-wrap items-end justify-between gap-md">
              <div>
                <h2 class="text-body-lg font-bold">Ingresos vs costo</h2>
                <p class="text-body-sm text-body">{{ periodLabel() }}</p>
              </div>
              <a routerLink="/admin/expenses" class="text-body-sm text-link hover:underline"
                >Ver gastos</a
              >
            </div>
            <div class="mt-lg h-[300px]">
              <canvas
                baseChart
                [data]="revenueCostChartData()"
                [options]="revenueCostOptions()"
                [type]="'line'"
              ></canvas>
            </div>
          </section>

          <section
            class="rounded-xl border border-surface-pressed bg-canvas p-xl"
            data-testid="sales-summary"
          >
            <h2 class="text-body-lg font-bold">Resultado</h2>
            <p class="text-body-sm text-body">{{ periodLabel() }}</p>
            <dl class="mt-lg divide-y divide-surface-pressed">
              <div class="flex items-center justify-between py-md">
                <dt class="text-body-sm text-body">Margen bruto</dt>
                <dd class="text-body-lg font-bold">{{ percent(data()?.grossMarginPercent) }}</dd>
              </div>
              <div class="flex items-center justify-between py-md">
                <dt class="text-body-sm text-body">Utilidad bruta</dt>
                <dd class="text-body-lg font-bold">{{ money(data()?.grossProfit) }}</dd>
              </div>
              <div class="flex items-center justify-between py-md">
                <dt class="text-body-sm text-body">Utilidad neta</dt>
                <dd
                  class="text-body-lg font-bold"
                  [ngClass]="(data()?.netProfit ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'"
                >
                  {{ money(data()?.netProfit) }}
                </dd>
              </div>
              <div class="flex items-center justify-between py-md">
                <dt class="text-body-sm text-body">Ticket promedio</dt>
                <dd class="text-body-lg font-bold">{{ money(data()?.averageOrderValue) }}</dd>
              </div>
              <div class="flex items-center justify-between py-md">
                <dt class="text-body-sm text-body">Gastos operativos</dt>
                <dd class="text-body-lg font-bold">{{ money(data()?.operatingExpenses) }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div class="grid grid-cols-1 gap-lg xl:grid-cols-2">
          <section
            class="rounded-xl border border-surface-pressed bg-canvas"
            data-testid="top-products"
          >
            <div class="flex items-center justify-between border-b border-surface-pressed px-xl py-lg">
              <h2 class="text-body-lg font-bold">Top productos</h2>
              <a routerLink="/admin/products" class="text-body-sm text-link hover:underline"
                >Ver catálogo</a
              >
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[420px] text-left">
                <thead>
                  <tr
                    class="border-b border-surface-pressed text-body-xs uppercase tracking-wide text-body"
                  >
                    <th class="px-xl py-sm font-medium">Producto</th>
                    <th class="px-md py-sm text-right font-medium">Unidades</th>
                    <th class="px-xl py-sm text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-pressed">
                  @for (product of data()?.topProducts ?? []; track product.name) {
                    <tr class="hover:bg-canvas-softer">
                      <td class="px-xl py-md text-body-sm-strong">{{ product.name }}</td>
                      <td class="px-md py-md text-right text-body-sm text-body">
                        {{ product.quantity }}
                      </td>
                      <td class="px-xl py-md text-right text-body-sm-strong">
                        {{ money(product.revenue) }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="3" class="px-xl py-2xl text-center text-body-sm text-body">
                        Sin ventas en el período
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section
            class="rounded-xl border border-surface-pressed bg-canvas p-xl"
            data-testid="chart-category"
          >
            <h2 class="text-body-lg font-bold">Ventas por categoría</h2>
            <p class="text-body-sm text-body">{{ periodLabel() }}</p>
            <div class="mt-lg h-[280px]">
              <canvas
                baseChart
                [data]="salesByCategoryChartData()"
                [options]="salesByCategoryOptions()"
                [type]="'bar'"
              ></canvas>
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class AdminDashboard implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly branchService = inject(BranchService);

  protected readonly data = signal<AdminDashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly period = signal<DashboardPeriod>('month');
  protected readonly branchId = signal('all');
  protected readonly view = signal<DashboardView>('operations');
  protected readonly lastUpdated = signal(new Date());
  protected readonly periodOptions = PERIOD_OPTIONS;

  protected readonly periodLabel = computed(() => PERIOD_LABELS[this.period()]);

  protected setView(view: DashboardView): void {
    if (this.view() === view) return;
    this.view.set(view);
  }

  protected readonly pipeline = computed(() => {
    const statuses = this.data()?.ordersByStatus ?? [];
    const counts = new Map(statuses.map((s) => [s.status, s.count]));
    const total = PIPELINE_STATUSES.reduce(
      (sum, status) => sum + (counts.get(status.value) ?? 0),
      0,
    );
    return PIPELINE_STATUSES.map((status) => {
      const count = counts.get(status.value) ?? 0;
      return {
        ...status,
        count,
        percent: total > 0 ? (count / total) * 100 : 0,
      };
    });
  });

  protected readonly pipelineTotal = computed(() =>
    this.pipeline().reduce((sum, item) => sum + item.count, 0),
  );

  protected readonly inventoryHealth = computed(() => {
    const total = this.data()?.activeProducts ?? 0;
    const low = this.data()?.lowStockProducts ?? 0;
    const out = this.data()?.outOfStockProducts ?? 0;
    const healthy = Math.max(total - low - out, 0);
    const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);
    return {
      total,
      healthy,
      low,
      out,
      healthyPct: pct(healthy),
      lowPct: pct(low),
      outPct: pct(out),
    };
  });

  protected readonly attentionItems = computed<AttentionItem[]>(() => {
    const data = this.data();
    if (!data) return [];

    const items: AttentionItem[] = [];

    if (data.outOfStockProducts > 0) {
      items.push({
        label: 'Agotados',
        description: 'Sin unidades disponibles',
        value: data.outOfStockProducts,
        link: '/admin/products',
        query: { stock: 'out' },
        color: 'bg-red-500',
        valueClass: 'text-red-600',
      });
    }
    if (data.ordersToPrepare > 0) {
      items.push({
        label: 'Pedidos por atender',
        description: 'Pendientes y aceptados',
        value: data.ordersToPrepare,
        link: '/admin/orders',
        query: { status: 'pending' },
        color: 'bg-blue-500',
        valueClass: 'text-ink',
      });
    }
    if (data.lowStockProducts > 0) {
      items.push({
        label: 'Stock bajo',
        description: 'Entre 1 y 5 unidades',
        value: data.lowStockProducts,
        link: '/admin/products',
        query: { stock: 'low' },
        color: 'bg-amber-500',
        valueClass: 'text-amber-600',
      });
    }
    if (data.productsWithoutCost > 0) {
      items.push({
        label: 'Productos sin costo',
        description: 'Margen estimado',
        value: data.productsWithoutCost,
        link: '/admin/products',
        query: {},
        color: 'bg-amber-500',
        valueClass: 'text-amber-600',
      });
    }
    if (data.cancellationRate > 10) {
      items.push({
        label: 'Cancelación alta',
        description: 'Supera el 10% del período',
        value: this.percent(data.cancellationRate),
        link: '/admin/orders',
        query: { status: 'cancelled' },
        color: 'bg-red-500',
        valueClass: 'text-red-600',
      });
    }

    return items;
  });

  ngOnInit(): void {
    this.branchService.load();
    this.loadDashboard();
  }

  protected changePeriod(period: DashboardPeriod): void {
    if (this.period() === period) return;
    this.period.set(period);
    this.loadDashboard();
  }

  protected changeBranch(branchId: string): void {
    this.branchId.set(branchId);
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.adminService.getDashboard(this.period(), this.branchId()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ─── Formatters ───────────────────────────────────────────────────

  protected money(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  protected number(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString('en-US');
  }

  protected percent(value: number | null | undefined): string {
    return `${Number(value ?? 0).toFixed(1)}%`;
  }

  protected deltaArrow(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) return '•';
    return value > 0 ? '▲' : '▼';
  }

  protected deltaText(value: number | null | undefined, suffix = '%'): string {
    if (value === null || value === undefined) return '';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}${suffix}`;
  }

  protected darkDeltaClass(
    value: number | null | undefined,
    invert = false,
  ): string {
    if (value === null || value === undefined || value === 0) {
      return 'text-on-primary/70';
    }
    const isGood = invert ? value < 0 : value > 0;
    return isGood ? 'text-accent' : 'text-red-200';
  }

  private formatSalesLabel(date: string, granularity: 'hour' | 'day' | 'month'): string {
    if (granularity === 'hour') {
      const parsed = new Date(date.replace(' ', 'T') + ':00');
      return parsed.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (granularity === 'month') {
      const [year, month] = date.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      });
    }
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  }

  // ─── Orders by day ────────────────────────────────────────────────

  protected readonly ordersByDayChartData = computed<ChartData<'bar'>>(() => {
    const rows = this.data()?.salesByDay ?? [];
    const granularity = this.data()?.granularity ?? 'day';
    return {
      labels: rows.map((row) => this.formatSalesLabel(row.date, granularity)),
      datasets: [
        {
          data: rows.map((row) => row.orders),
          label: 'Pedidos',
          backgroundColor: CHART_COLORS.primary,
          borderRadius: 6,
          barThickness: 20,
        },
      ],
    };
  });

  protected readonly ordersByDayOptions = signal<ChartConfiguration<'bar'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e2e2',
        cornerRadius: 8,
        padding: 12,
        callbacks: { label: (ctx) => ` ${ctx.parsed.y} pedidos` },
      },
      legend: { display: false },
    },
  });

  // ─── Revenue vs cost ──────────────────────────────────────────────

  protected readonly revenueCostChartData = computed<ChartData<'line'>>(() => {
    const rows = this.data()?.salesByDay ?? [];
    const granularity = this.data()?.granularity ?? 'day';
    return {
      labels: rows.map((row) => this.formatSalesLabel(row.date, granularity)),
      datasets: [
        {
          data: rows.map((row) => row.revenue),
          label: 'Ingresos',
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(28, 128, 87, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          data: rows.map((row) => row.cost),
          label: 'Costo',
          borderColor: CHART_COLORS.accent,
          backgroundColor: 'rgba(245, 166, 35, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  });

  protected readonly revenueCostOptions = signal<ChartConfiguration<'line'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => '$' + Number(value).toLocaleString() },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e2e2',
        cornerRadius: 8,
        padding: 12,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: $${Number(ctx.parsed.y).toLocaleString()}` },
      },
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 16 },
      },
    },
  });

  // ─── Sales by category ────────────────────────────────────────────

  protected readonly salesByCategoryChartData = computed<ChartData<'bar'>>(() => {
    const categories = [...(this.data()?.salesByCategory ?? [])].slice(0, 8);
    const colors = [
      CHART_COLORS.primary,
      CHART_COLORS.accent,
      CHART_COLORS.blue,
      CHART_COLORS.green,
      CHART_COLORS.violet,
      CHART_COLORS.pink,
      CHART_COLORS.amber,
      CHART_COLORS.gray,
    ];
    return {
      labels: categories.map((category) => category.name),
      datasets: [
        {
          data: categories.map((category) => category.revenue),
          label: 'Ingresos',
          backgroundColor: categories.map((_, i) => colors[i % colors.length]),
          borderRadius: 6,
          barThickness: 18,
        },
      ],
    };
  });

  protected readonly salesByCategoryOptions = signal<ChartConfiguration<'bar'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (value) => '$' + Number(value).toLocaleString() },
      },
      y: { grid: { display: false } },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e2e2',
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => ` $${Number(ctx.parsed.x).toLocaleString()}`,
        },
      },
      legend: { display: false },
    },
  });
}
