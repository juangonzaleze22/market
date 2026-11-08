import { Component, computed, input } from '@angular/core';

const FLOW_STATUS_ORDER = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const FLOW_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Listo',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

interface MiniStep {
  status: string;
  label: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-order-flow-steps',
  template: `
    @if (terminal()) {
      <div class="flow-terminal" [attr.data-testid]="testId()">
        <span class="flow-terminal-icon" [attr.aria-label]="statusLabel()">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </span>
        <span class="flow-tip">{{ statusLabel() }}</span>
      </div>
    } @else {
      <div class="flow-steps" [attr.data-testid]="testId()">
        @for (step of steps(); track step.status; let last = $last) {
          <div class="flow-step" [class.completed]="step.completed" [class.active]="step.active">
            <span
              class="flow-icon"
              [attr.aria-label]="step.label"
              [attr.data-testid]="'flow-step-' + orderId() + variantSuffix() + '-' + step.status"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                @switch (step.status) {
                  @case ('pending') {
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  }
                  @case ('paid') {
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  }
                  @case ('processing') {
                    <path
                      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  }
                  @case ('shipped') {
                    <path
                      d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="m9 14 2 2 4-4" />
                  }
                  @case ('out_for_delivery') {
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  }
                  @case ('delivered') {
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8.5 12 2.5 2.5 5-5" />
                  }
                }
              </svg>
            </span>
            <span class="flow-tip">{{ step.label }}</span>
          </div>
          @if (!last) {
            <span class="flow-connector" [class.completed]="step.completed"></span>
          }
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .flow-steps {
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 230px;
    }

    .flow-step,
    .flow-terminal {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .flow-icon,
    .flow-terminal-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-canvas);
      border: 1.5px solid var(--color-surface-pressed);
      color: var(--color-mute);
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;
      flex-shrink: 0;
    }

    .flow-icon svg,
    .flow-terminal-icon svg {
      width: 12px;
      height: 12px;
    }

    .flow-step.completed .flow-icon {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .flow-step.active .flow-icon {
      box-shadow: 0 0 0 3px rgba(28, 128, 87, 0.18);
    }

    .flow-step:hover .flow-icon {
      transform: scale(1.15);
    }

    .flow-terminal-icon {
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }

    .flow-connector {
      flex: 1;
      height: 2px;
      min-width: 6px;
      margin: 0 2px;
      border-radius: 2px;
      background-color: var(--color-surface-pressed);
    }

    .flow-connector.completed {
      background-color: var(--color-primary);
    }

    .flow-tip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      z-index: 30;
      padding: 4px 8px;
      border-radius: 6px;
      background-color: var(--color-black-elevated);
      color: var(--color-on-dark);
      font-size: 11px;
      line-height: 1.2;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition:
        opacity 0.15s ease,
        transform 0.15s ease;
    }

    .flow-tip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: var(--color-black-elevated);
    }

    .flow-step:hover .flow-tip,
    .flow-terminal:hover .flow-tip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
  `,
})
export class OrderFlowSteps {
  readonly status = input.required<string>();
  readonly orderId = input('');
  readonly variant = input('');

  protected readonly steps = computed<MiniStep[]>(() => {
    const currentIdx = FLOW_STATUS_ORDER.indexOf(this.status());
    return FLOW_STATUS_ORDER.map((status, index) => ({
      status,
      label: FLOW_LABELS[status],
      completed: currentIdx >= index,
      active: currentIdx === index,
    }));
  });

  protected readonly terminal = computed(
    () => this.status() === 'rejected' || this.status() === 'cancelled',
  );

  protected readonly statusLabel = computed(() => FLOW_LABELS[this.status()] ?? this.status());

  protected readonly variantSuffix = computed(() => (this.variant() ? `-${this.variant()}` : ''));

  protected readonly testId = computed(() => `order-flow-${this.orderId()}${this.variantSuffix()}`);
}
