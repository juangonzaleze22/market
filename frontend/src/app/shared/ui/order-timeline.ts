import { Component, computed, input } from '@angular/core';

export interface OrderTimelineOrder {
  id: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  processingStartedAt?: string | null;
  preparedAt?: string | null;
  deliveryAcceptedAt?: string | null;
  deliveredAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

type TimestampKey =
  | 'createdAt'
  | 'paidAt'
  | 'processingStartedAt'
  | 'preparedAt'
  | 'deliveryAcceptedAt'
  | 'deliveredAt';

interface StepDefinition {
  status: string;
  title: string;
  description: string;
  timestamp: TimestampKey;
}

interface TimelineStep {
  status: string;
  title: string;
  description: string;
  date: string | null;
  time: string | null;
  completed: boolean;
  active: boolean;
}

const STEP_ORDER = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const STEPS: StepDefinition[] = [
  {
    status: 'pending',
    title: 'Pedido Realizado',
    description: 'Recibimos tu pedido',
    timestamp: 'createdAt',
  },
  {
    status: 'paid',
    title: 'Pagado',
    description: 'Confirmamos tu pago',
    timestamp: 'paidAt',
  },
  {
    status: 'processing',
    title: 'En preparación',
    description: 'Estamos alistando tus productos',
    timestamp: 'processingStartedAt',
  },
  {
    status: 'shipped',
    title: 'Listo',
    description: 'Tu pedido está listo para entregar',
    timestamp: 'preparedAt',
  },
  {
    status: 'out_for_delivery',
    title: 'En camino',
    description: 'Tu pedido va en camino',
    timestamp: 'deliveryAcceptedAt',
  },
  {
    status: 'delivered',
    title: 'Entregado',
    description: 'Tu pedido fue entregado',
    timestamp: 'deliveredAt',
  },
];

@Component({
  selector: 'app-order-timeline',
  template: `
    <div class="order-timeline" data-testid="order-timeline">
      @if (terminal()) {
        <div
          class="otl-terminal"
          [attr.data-testid]="'timeline-step-' + order().status"
        >
          <span class="otl-terminal-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </span>
          <div class="otl-terminal-copy">
            <span class="otl-terminal-title">{{ terminalTitle() }}</span>
            <span class="otl-time-row">
              @if (terminalDate(); as date) {
                <span class="otl-date">{{ date }}</span>
              }
              @if (terminalTime(); as time) {
                <span
                  class="otl-time"
                  [attr.data-testid]="'timeline-time-' + order().status"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {{ time }}
                </span>
              }
            </span>
            <span
              class="otl-desc"
              [attr.data-testid]="'timeline-desc-' + order().status"
              >{{ terminalDescription() }}</span
            >
          </div>
        </div>
      } @else {
        <ol class="otl-list" role="list">
          @for (step of steps(); track step.status; let last = $last) {
            <li
              class="otl-step"
              [class.completed]="step.completed"
              [class.active]="step.active"
              [attr.aria-current]="step.active ? 'step' : null"
              [attr.data-testid]="'timeline-step-' + step.status"
            >
              <span class="otl-node" aria-hidden="true">
                @if (step.active) {
                  <span class="otl-dot"></span>
                } @else if (step.completed) {
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                } @else {
                  <span class="otl-dot"></span>
                }
              </span>
              @if (!last) {
                <span class="otl-line" [class.completed]="step.completed"></span>
              }
              <div class="otl-copy">
                <span class="otl-title">{{ step.title }}</span>
                <span class="otl-time-row">
                  @if (step.date) {
                    <span class="otl-date">{{ step.date }}</span>
                    <span
                      class="otl-time"
                      [attr.data-testid]="'timeline-time-' + step.status"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {{ step.time }}
                    </span>
                  } @else {
                    <span
                      class="otl-time otl-time--muted"
                      [attr.data-testid]="'timeline-time-' + step.status"
                    >
                      {{ step.active ? 'En curso' : 'Pendiente' }}
                    </span>
                  }
                </span>
                <span
                  class="otl-desc"
                  [attr.data-testid]="'timeline-desc-' + step.status"
                  >{{ step.description }}</span
                >
              </div>
            </li>
          }
        </ol>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .order-timeline {
      width: 100%;
    }

    .otl-list {
      display: flex;
      align-items: flex-start;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .otl-step {
      position: relative;
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .otl-node {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-canvas);
      border: 2px solid var(--color-surface-pressed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-mute);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .otl-node svg {
      width: 14px;
      height: 14px;
    }

    .otl-step.completed .otl-node {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .otl-step.active .otl-node {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .otl-step.active .otl-node::before,
    .otl-step.active .otl-node::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
      animation: otl-ripple 2s ease-out infinite;
    }

    .otl-step.active .otl-node::after {
      animation-delay: 0.6s;
    }

    @keyframes otl-ripple {
      0% {
        opacity: 0.5;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.4);
      }
    }

    .otl-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-surface-pressed);
    }

    .otl-step.active .otl-dot {
      background-color: var(--color-primary);
    }

    .otl-line {
      position: absolute;
      top: 15px;
      left: calc(50% + 21px);
      width: calc(100% - 42px);
      height: 3px;
      border-radius: 2px;
      background-color: var(--color-surface-pressed);
      z-index: 0;
    }

    .otl-line.completed {
      background-color: var(--color-primary);
    }

    .otl-copy {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      min-width: 0;
      padding: 8px 4px 0;
    }

    .otl-title {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--color-body);
    }

    .otl-step.completed .otl-title,
    .otl-step.active .otl-title {
      color: var(--color-ink);
    }

    .otl-time-row {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .otl-date {
      font-size: 10px;
      color: var(--color-body);
      white-space: nowrap;
    }

    .otl-time {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 1px 6px;
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas-softer);
      border: 1px solid var(--color-surface-pressed);
      font-size: 10px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--color-body);
      white-space: nowrap;
    }

    .otl-time svg {
      width: 10px;
      height: 10px;
    }

    .otl-time--muted {
      color: var(--color-mute);
    }

    .otl-step.completed .otl-time,
    .otl-step.active .otl-time {
      background-color: var(--color-canvas-soft);
      color: var(--color-ink);
    }

    .otl-desc {
      font-size: 10px;
      line-height: 1.3;
      color: var(--color-mute);
      max-width: 150px;
    }

    .otl-step.completed .otl-desc,
    .otl-step.active .otl-desc {
      color: var(--color-body);
    }

    .otl-terminal {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-lg);
      background-color: #fef2f2;
      border: 1px solid #fecaca;
    }

    .otl-terminal-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #fee2e2;
      color: #b91c1c;
      flex-shrink: 0;
    }

    .otl-terminal-icon svg {
      width: 16px;
      height: 16px;
    }

    .otl-terminal-copy {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .otl-terminal-title {
      font-size: 14px;
      font-weight: 700;
      color: #991b1b;
    }

    .otl-terminal .otl-date {
      color: #b91c1c;
    }

    .otl-terminal .otl-time {
      background-color: #fee2e2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .otl-terminal .otl-desc {
      color: #7f1d1d;
      font-size: 12px;
      max-width: none;
    }

    @media (max-width: 767px) {
      .otl-list {
        flex-direction: column;
        align-items: stretch;
      }

      .otl-step,
      .otl-step:last-child {
        flex: none;
        width: 100%;
        flex-direction: row;
        align-items: flex-start;
        text-align: left;
        gap: 14px;
      }

      .otl-line {
        top: 32px;
        bottom: 0;
        left: 15px;
        width: 3px;
        height: auto;
      }

      .otl-copy {
        align-items: flex-start;
        gap: 3px;
        padding: 4px 0 20px;
      }

      .otl-title {
        font-size: 13px;
      }

      .otl-time-row {
        justify-content: flex-start;
      }

      .otl-date,
      .otl-time {
        font-size: 11px;
      }

      .otl-desc {
        font-size: 12px;
        max-width: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .otl-step.active .otl-node::before,
      .otl-step.active .otl-node::after {
        animation: none;
      }
    }
  `,
})
export class OrderTimeline {
  readonly order = input.required<OrderTimelineOrder>();

  protected readonly terminal = computed(() => {
    const status = this.order().status.toLowerCase();
    return status === 'rejected' || status === 'cancelled';
  });

  protected readonly terminalTitle = computed(() => {
    const status = this.order().status.toLowerCase();
    return status === 'cancelled' ? 'Pedido cancelado' : 'Pago rechazado';
  });

  protected readonly terminalDescription = computed(() => {
    const order = this.order();
    if (order.status.toLowerCase() === 'cancelled') {
      return 'El pedido fue cancelado.';
    }
    return order.rejectionReason?.trim() || 'Sin motivo especificado';
  });

  private readonly terminalParts = computed(() => this.splitDateTime(this.order().rejectedAt));
  protected readonly terminalDate = computed(() => this.terminalParts()?.date ?? null);
  protected readonly terminalTime = computed(() => this.terminalParts()?.time ?? null);

  protected readonly steps = computed<TimelineStep[]>(() => {
    const order = this.order();
    const status = order.status.toLowerCase();
    const currentIndex = STEP_ORDER.indexOf(status);
    const isTerminal = currentIndex === -1;

    return STEPS.map((definition, index) => {
      const timestamp = order[definition.timestamp];
      const parts = this.splitDateTime(timestamp);
      const isLast = index === STEPS.length - 1;
      const completed = isTerminal
        ? !!parts
        : currentIndex > index || (currentIndex === index && isLast);
      const active = !isTerminal && currentIndex === index && !isLast;

      return {
        status: definition.status,
        title: definition.title,
        description: definition.description,
        date: parts?.date ?? null,
        time: parts?.time ?? null,
        completed,
        active,
      };
    });
  });

  private splitDateTime(
    value: string | null | undefined,
  ): { date: string; time: string } | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`,
    };
  }
}
