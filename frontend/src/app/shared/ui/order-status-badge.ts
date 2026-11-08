import { Component, computed, input } from '@angular/core';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Listo',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  pending: 'bg-body',
  confirmed: 'bg-sky-600',
  paid: 'bg-blue-600',
  processing: 'bg-purple-600',
  shipped: 'bg-amber-500',
  out_for_delivery: 'bg-cyan-600',
  delivered: 'bg-green-600',
  rejected: 'bg-red-600',
  cancelled: 'bg-red-600',
  refunded: 'bg-gray-500',
};

@Component({
  selector: 'app-order-status',
  template: `
    <span
      class="status"
      [class.status-md]="size() === 'md'"
      [attr.data-testid]="resolvedTestId()"
    >
      <span class="status-dot" [class]="dotClass()" aria-hidden="true"></span>
      <span class="status-label">{{ label() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .status-label {
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
      font-weight: 500;
      color: var(--color-ink);
      white-space: nowrap;
    }

    .status-md .status-label {
      font-size: var(--text-body-sm);
      line-height: var(--text-body-sm--line-height);
    }
  `,
})
export class OrderStatusBadge {
  readonly status = input.required<string>();
  readonly size = input<'sm' | 'md'>('sm');
  readonly testId = input('');

  protected readonly label = computed(() => {
    const status = this.status().toLowerCase();
    return STATUS_LABELS[status] ?? this.status();
  });

  protected readonly dotClass = computed(() => {
    const status = this.status().toLowerCase();
    return STATUS_DOT_CLASSES[status] ?? 'bg-mute';
  });

  protected readonly resolvedTestId = computed(
    () => this.testId() || `status-${this.status().toLowerCase()}`,
  );
}
