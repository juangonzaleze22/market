import { Component, input } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminInventoryRisk } from '../../../core/services/admin.service';

@Component({
  selector: 'app-inventory-risk-table',
  imports: [DecimalPipe, NgClass, RouterLink],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full min-w-[720px] text-left">
        <thead>
          <tr class="border-b border-surface-pressed text-body-xs uppercase tracking-wide text-body">
            <th class="py-sm pl-xl pr-lg font-medium">Producto</th>
            <th class="px-md py-sm text-right font-medium">Stock</th>
            <th class="px-md py-sm text-right font-medium">Velocidad</th>
            <th class="px-md py-sm text-right font-medium">Cobertura</th>
            <th class="px-md py-sm font-medium">Estado</th>
            <th class="py-sm pl-md pr-xl"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-pressed">
          @for (item of items(); track item.id) {
            <tr class="transition-colors hover:bg-canvas-softer" [attr.data-testid]="'risk-' + item.id">
              <td class="py-md pl-xl pr-lg">
                <div class="flex items-center gap-md">
                  @if (item.image) {
                    <img
                      [src]="item.image"
                      [alt]="item.name"
                      class="h-9 w-9 shrink-0 rounded-lg bg-canvas-soft object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  } @else {
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-pressed bg-canvas-soft text-body-xs text-mute"
                      >—</span
                    >
                  }
                  <div class="min-w-0">
                    <p class="truncate text-body-sm-strong">{{ item.name }}</p>
                    <p class="font-mono text-body-xs text-body">{{ item.sku }}</p>
                  </div>
                </div>
              </td>
              <td class="px-md py-md text-right">
                <span
                  class="text-body-sm font-bold"
                  [ngClass]="item.stock <= 0 ? 'text-red-600' : 'text-amber-600'"
                  >{{ item.stock }}</span
                >
              </td>
              <td class="px-md py-md text-right text-body-sm text-body">
                {{ item.velocityPerDay | number: '1.0-2' }} u/d
              </td>
              <td class="px-md py-md text-right">
                <span class="text-body-sm font-semibold" [ngClass]="coverClass(item)">
                  {{ cover(item) }}
                </span>
              </td>
              <td class="px-md py-md">
                <span
                  class="inline-flex items-center rounded-pill px-sm py-xxs text-body-xs font-medium"
                  [ngClass]="
                    item.status === 'out'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  "
                >
                  {{ item.status === 'out' ? 'Agotado' : 'Stock bajo' }}
                </span>
              </td>
              <td class="py-md pl-md pr-xl text-right">
                <a
                  routerLink="/admin/products"
                  [queryParams]="{ stock: item.status === 'out' ? 'out' : 'low' }"
                  class="text-body-sm font-semibold text-link hover:underline"
                  >Reponer</a
                >
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="py-2xl text-center text-body-sm text-body">
                Sin productos en riesgo. El inventario está saludable.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InventoryRiskTable {
  readonly items = input<AdminInventoryRisk[]>([]);

  protected cover(item: AdminInventoryRisk): string {
    if (item.daysOfCover === null) return '—';
    return `${item.daysOfCover} d`;
  }

  protected coverClass(item: AdminInventoryRisk): string {
    if (item.daysOfCover === null) return 'text-mute';
    if (item.daysOfCover <= 3) return 'text-red-600';
    if (item.daysOfCover <= 7) return 'text-amber-600';
    return 'text-body';
  }
}
