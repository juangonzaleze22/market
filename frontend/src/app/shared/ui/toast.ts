import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  styles: `
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background-color: var(--color-canvas);
      border-radius: var(--radius-xl);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06);
      font-size: var(--text-body-sm);
      line-height: 1.4;
      color: var(--color-ink);
      min-width: 280px;
      max-width: 420px;
      animation: toast-in 0.25s ease-out;
      border-left: 3px solid transparent;
    }

    .toast--success {
      border-left-color: #16a34a;
    }

    .toast--error {
      border-left-color: #dc2626;
    }

    .toast--info {
      border-left-color: var(--color-primary);
    }

    .toast-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-icon--success {
      color: #16a34a;
    }

    .toast-icon--error {
      color: #dc2626;
    }

    .toast-icon--info {
      color: var(--color-primary);
    }

    .toast-message {
      flex: 1;
      min-width: 0;
    }

    .toast-close {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
      border: none;
      background: none;
      color: var(--color-mute);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .toast-close:hover {
      color: var(--color-body);
      background-color: var(--color-canvas-soft);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(16px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  template: `
    <div class="toast-container" data-testid="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type" [attr.data-testid]="'toast-' + toast.type">
          <div class="toast-icon" [class]="'toast-icon--' + toast.type">
            @if (toast.type === 'success') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            } @else if (toast.type === 'error') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar" data-testid="toast-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
