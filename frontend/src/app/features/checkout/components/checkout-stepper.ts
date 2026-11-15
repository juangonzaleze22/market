import { Component, inject } from '@angular/core';
import { CheckoutStore } from '../checkout-store';

@Component({
  selector: 'app-checkout-stepper',
  template: `
    <div class="checkout-progress" data-testid="checkout-progress">
      <div class="checkout-progress-head">
        <span>Paso {{ store.stepIndex() + 1 }} de {{ store.steps().length }}</span>
      </div>

      <div
        class="checkout-progress-track"
        role="progressbar"
        aria-valuemin="1"
        [attr.aria-valuemax]="store.steps().length"
        [attr.aria-valuenow]="store.stepIndex() + 1"
        [attr.aria-label]="'Paso ' + (store.stepIndex() + 1) + ' de ' + store.steps().length"
      >
        <span [style.width.%]="store.progress()"></span>
      </div>
    </div>

    <ol class="checkout-rail" aria-label="Pasos del checkout" data-testid="checkout-stepper">
      @for (item of store.steps(); track item.id; let last = $last) {
        <li
          class="checkout-rail-item"
          [class.is-active]="item.active"
          [class.is-complete]="item.completed"
        >
          <button
            type="button"
            class="checkout-rail-btn"
            [disabled]="!item.completed"
            [attr.aria-current]="item.active ? 'step' : null"
            [attr.data-testid]="'checkout-rail-' + item.id"
            (click)="store.goTo(item.id)"
          >
            <span class="checkout-rail-marker" aria-hidden="true">
              @if (item.completed) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
                {{ item.index + 1 }}
              }
            </span>
            <span class="checkout-rail-text">
              <span class="checkout-rail-label">{{ item.label }}</span>
              <span class="checkout-rail-hint">
                {{ item.completed || item.active ? item.summary : item.hint }}
              </span>
            </span>
          </button>

          @if (!last) {
            <span
              class="checkout-rail-line"
              [class.is-filled]="item.completed"
              aria-hidden="true"
            ></span>
          }
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .checkout-rail {
      display: none;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    @media (min-width: 1024px) {
      .checkout-rail {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 96px;
      }
    }

    .checkout-rail-item {
      display: flex;
      flex-direction: column;
    }

    .checkout-rail-btn {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-sm) 0;
      border: 0;
      background: none;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .checkout-rail-btn:disabled {
      cursor: default;
    }

    .checkout-rail-marker {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid var(--color-surface-pressed);
      background-color: var(--color-canvas-soft);
      color: var(--color-mute);
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      transition:
        background-color 0.25s ease,
        border-color 0.25s ease,
        color 0.25s ease,
        box-shadow 0.25s ease;
    }

    .checkout-rail-marker svg {
      width: 14px;
      height: 14px;
    }

    .checkout-rail-item.is-active .checkout-rail-marker {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 14%, transparent);
    }

    .checkout-rail-item.is-complete .checkout-rail-marker {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .checkout-rail-text {
      min-width: 0;
      padding-top: 4px;
    }

    .checkout-rail-label {
      display: block;
      font-size: var(--text-body-sm-strong);
      line-height: 1.3;
      font-weight: 600;
      color: var(--color-mute);
      transition: color 0.2s ease;
    }

    .checkout-rail-hint {
      display: block;
      max-width: 150px;
      margin-top: 2px;
      overflow: hidden;
      font-size: var(--text-caption);
      line-height: 1.35;
      color: var(--color-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .checkout-rail-item.is-active .checkout-rail-label,
    .checkout-rail-item.is-complete .checkout-rail-label {
      color: var(--color-ink);
    }

    .checkout-rail-line {
      width: 2px;
      height: 26px;
      margin-left: 14px;
      border-radius: 2px;
      background-color: var(--color-surface-pressed);
      transition: background-color 0.3s ease;
    }

    .checkout-rail-line.is-filled {
      background-color: var(--color-primary);
    }

    .checkout-progress {
      display: block;
    }

    @media (min-width: 1024px) {
      .checkout-progress {
        display: none;
      }
    }

    .checkout-progress-head {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-size: var(--text-caption);
      color: var(--color-body);
    }

    .checkout-progress-track {
      height: 4px;
      margin-top: var(--spacing-xs);
      overflow: hidden;
      border-radius: 999px;
      background-color: var(--color-surface-pressed);
    }

    .checkout-progress-track span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background-color: var(--color-primary);
      transition: width 0.3s ease;
    }

    @media (prefers-reduced-motion: reduce) {
      .checkout-rail-marker,
      .checkout-rail-line,
      .checkout-progress-track span {
        transition: none;
      }
    }
  `,
})
export class CheckoutStepper {
  protected readonly store = inject(CheckoutStore);
}
