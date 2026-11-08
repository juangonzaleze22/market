import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  styles: `
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .confirm-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .confirm-modal {
      background-color: var(--color-canvas);
      border-radius: var(--radius-xl);
      padding: var(--spacing-2xl);
      max-width: 380px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
      transform: translateY(8px) scale(0.98);
      opacity: 0;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .confirm-overlay.open .confirm-modal {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .confirm-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-icon--warning {
      background-color: #fef3c7;
      color: #d97706;
    }

    .confirm-icon--danger {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .confirm-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-ink);
      margin: 0;
      text-align: center;
    }

    .confirm-message {
      font-size: 14px;
      color: var(--color-body);
      margin: 0;
      text-align: center;
      line-height: 1.5;
    }

    .confirm-message strong {
      color: var(--color-ink);
      font-weight: 600;
    }

    .confirm-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 4px;
    }

    .confirm-actions button {
      flex: 1;
      justify-content: center;
    }
  `,
  template: `
    <div
      class="confirm-overlay"
      [class.open]="open()"
      (click)="onBackdropClick()"
      [attr.data-testid]="testId()"
    >
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon" [class]="variant() === 'danger' ? 'confirm-icon--danger' : 'confirm-icon--warning'">
          @if (variant() === 'danger') {
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          } @else {
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          }
        </div>
        <h3 class="confirm-title">{{ title() }}</h3>
        <p class="confirm-message" [innerHTML]="message()"></p>
        <div class="confirm-actions">
          <button type="button" class="btn-secondary" (click)="onCancel()" data-testid="confirm-cancel">
            {{ cancelLabel() }}
          </button>
          <button type="button" [class]="confirmBtnClass" (click)="onConfirm()" [disabled]="loading()" data-testid="confirm-ok">
            @if (loading()) {
              <span class="btn-spinner"></span>
            } @else {
              {{ confirmLabel() }}
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirmar acción');
  readonly message = input('¿Estás seguro de que deseas continuar?');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly variant = input<'warning' | 'danger'>('warning');
  readonly loading = input(false);
  readonly testId = input('confirm-dialog');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  get confirmBtnClass(): string {
    return this.variant() === 'danger'
      ? 'bg-red-600 text-white font-semibold px-lg py-md rounded-full hover:bg-red-700 transition text-body-sm'
      : 'btn-primary';
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(): void {
    this.onCancel();
  }
}
