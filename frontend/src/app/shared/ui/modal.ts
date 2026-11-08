import {
  Component,
  HostListener,
  OnDestroy,
  effect,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  styles: [
    `
      /* ── Backdrop (always rendered, toggled via .open) ── */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 200;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .modal-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Shell / click-away area (always rendered, toggled via .open) ── */
      .modal-shell {
        position: fixed;
        inset: 0;
        z-index: 201;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-2xl) var(--spacing-lg);
        pointer-events: none;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s;
        opacity: 0;
      }
      .modal-shell.open {
        pointer-events: auto;
        visibility: visible;
        opacity: 1;
      }

      /* ── Panel (the actual card) ── */
      .modal-panel {
        background: var(--color-canvas);
        border: 1px solid var(--color-surface-pressed);
        border-radius: var(--radius-xl);
        width: 100%;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - var(--spacing-3xl) * 2);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s ease;
        transform: translateY(8px) scale(0.98);
        opacity: 0;
      }
      .modal-shell.open .modal-panel {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      .modal-panel.modal-sm { max-width: 420px; }
      .modal-panel.modal-md { max-width: 640px; }
      .modal-panel.modal-lg { max-width: 860px; }
      .modal-panel.modal-xl { max-width: 1040px; }
      .modal-panel.modal-form { max-width: 580px; }

      /* ── Scrollable body inside panel ── */
      .modal-body {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
    `,
  ],
  template: `
    <!-- Backdrop — always rendered, toggled via .open class -->
    <div
      class="modal-backdrop"
      [class.open]="open()"
      (click)="onBackdropClick()"
      [attr.data-testid]="testId() + '-backdrop'"
    ></div>

    <!-- Shell — always rendered, toggled via .open class -->
    <div
      class="modal-shell"
      [class.open]="open()"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
      [attr.data-testid]="testId()"
    >
      <div
        class="modal-panel"
        [class.modal-sm]="size() === 'sm'"
        [class.modal-md]="size() === 'md'"
        [class.modal-lg]="size() === 'lg'"
        [class.modal-xl]="size() === 'xl'"
        [class.modal-form]="size() === 'form'"
      >
        <div class="flex items-center justify-between px-xl py-lg border-b border-surface-pressed shrink-0">
          <h2 class="text-body-lg font-bold" [attr.data-testid]="testId() + '-title'">{{ title() }}</h2>
          <button
            type="button"
            (click)="close()"
            class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-canvas-soft transition text-body"
            [attr.aria-label]="'Cerrar ' + title()"
            [attr.data-testid]="testId() + '-close'"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div class="modal-body px-xl py-lg">
          <ng-content />
        </div>

        <div class="flex items-center justify-end gap-md px-xl py-lg border-t border-surface-pressed shrink-0">
          <ng-content select="[modalFooter]" />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent implements OnDestroy {
  readonly open = input(false);
  readonly title = input('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'form'>('md');
  readonly testId = input('modal');
  readonly closeOnBackdrop = input(true);
  readonly closed = output<void>();

  private readonly lockBodyScroll = effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = this.open() ? 'hidden' : '';
  });

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdrop()) this.close();
  }
}
