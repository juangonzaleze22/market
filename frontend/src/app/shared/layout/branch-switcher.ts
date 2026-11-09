import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Branch, BranchService } from '../../core/services/branch.service';

@Component({
  selector: 'app-branch-switcher',
  template: `
    <button
      type="button"
      class="branch-fab"
      (click)="open.set(true)"
      data-testid="branch-switcher-button"
      aria-haspopup="dialog"
      aria-label="Elegir sucursal"
    >
      <span class="branch-fab-icon" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </span>
      <span class="branch-fab-text">
        <span class="branch-fab-caption">
          {{ locating() ? 'Detectando...' : 'Sucursal' }}
        </span>
        <span class="branch-fab-name">{{ branchName() }}</span>
      </span>
    </button>

    @if (open()) {
      <div class="branch-backdrop" (click)="close()">
        <div
          class="branch-modal"
          data-testid="branch-switcher"
          role="dialog"
          aria-modal="true"
          aria-label="Elegir sucursal"
          (click)="$event.stopPropagation()"
        >
          <div class="branch-modal-header">
            <div>
              <h2 class="branch-modal-title">Elegí tu sucursal</h2>
              <p class="branch-modal-subtitle">
                Precios y disponibilidad según la sucursal.
              </p>
            </div>
            <button
              type="button"
              class="branch-modal-close"
              (click)="close()"
              aria-label="Cerrar"
              data-testid="branch-switcher-close"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            class="branch-locate"
            (click)="useLocation()"
            [disabled]="locating()"
            data-testid="branch-use-location"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
              <circle cx="12" cy="12" r="8" stroke-dasharray="2 3"></circle>
            </svg>
            {{ locating() ? 'Buscando tu ubicación...' : 'Usar mi ubicación actual' }}
          </button>

          @if (locationError()) {
            <p class="branch-location-error" data-testid="branch-location-error">
              {{ locationError() }}
            </p>
          }

          <div class="branch-list" data-testid="branch-switcher-list">
            @for (branch of branches(); track branch.id) {
              <button
                type="button"
                class="branch-option"
                [class.is-active]="branch.id === selected()?.id"
                (click)="select(branch)"
                [attr.data-testid]="'branch-option-' + branch.id"
              >
                <span class="branch-option-text">
                  <span class="branch-option-name">{{ branch.name }}</span>
                  <span class="branch-option-sub">{{ branch.city }}, {{ branch.state }}</span>
                </span>
                @if (branch.id === selected()?.id) {
                  <span class="branch-option-check" aria-label="Seleccionada">✓</span>
                }
              </button>
            } @empty {
              <p class="branch-empty">No hay sucursales disponibles.</p>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      z-index: 45;
    }

    .branch-fab {
      position: fixed;
      left: var(--spacing-lg);
      bottom: 88px;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      max-width: calc(100vw - 32px);
      padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-sm) var(--spacing-sm);
      border: 1px solid var(--color-surface-pressed);
      border-radius: 999px;
      background: var(--color-canvas);
      color: var(--color-ink);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .branch-fab:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
    }

    .branch-fab-icon {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      flex-shrink: 0;
    }

    .branch-fab-icon svg {
      width: 18px;
      height: 18px;
    }

    .branch-fab-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 0;
    }

    .branch-fab-caption {
      font-size: var(--text-body-xs);
      color: var(--color-body);
      line-height: 1.1;
    }

    .branch-fab-name {
      font-size: var(--text-body-sm);
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 190px;
    }

    .branch-backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      padding: var(--spacing-lg);
      background: rgba(0, 0, 0, 0.4);
    }

    .branch-modal {
      width: 100%;
      max-width: 380px;
      background: var(--color-canvas);
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      max-height: min(70vh, 560px);
    }

    .branch-modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .branch-modal-title {
      font-size: var(--text-body-lg);
      font-weight: 700;
      color: var(--color-ink);
    }

    .branch-modal-subtitle {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      margin-top: var(--spacing-xxs);
    }

    .branch-modal-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid var(--color-surface-pressed);
      background: var(--color-canvas);
      color: var(--color-ink);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    }

    .branch-locate {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: 999px;
      border: 1px solid var(--color-surface-pressed);
      background: var(--color-canvas-soft);
      color: var(--color-ink);
      font-size: var(--text-body-sm);
      font-weight: 600;
      cursor: pointer;
    }

    .branch-locate svg {
      width: 18px;
      height: 18px;
    }

    .branch-locate:disabled {
      opacity: 0.6;
      cursor: progress;
    }

    .branch-location-error {
      font-size: var(--text-body-xs);
      color: #b91c1c;
    }

    .branch-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      overflow-y: auto;
    }

    .branch-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-surface-pressed);
      background: var(--color-canvas);
      color: var(--color-ink);
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .branch-option:hover {
      background: var(--color-canvas-soft);
    }

    .branch-option.is-active {
      border-color: var(--color-primary);
      background: var(--color-canvas-soft);
    }

    .branch-option-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .branch-option-name {
      font-size: var(--text-body-sm);
      font-weight: 600;
    }

    .branch-option-sub {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    .branch-option-check {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 12px;
      font-weight: 700;
    }

    .branch-empty {
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    @media (min-width: 768px) {
      .branch-fab {
        bottom: var(--spacing-xl);
      }

      .branch-backdrop {
        align-items: center;
        justify-content: center;
      }
    }
  `,
})
export class BranchSwitcher implements OnInit {
  protected readonly branchService = inject(BranchService);

  protected readonly open = signal(false);
  protected readonly branches = this.branchService.branches;
  protected readonly selected = this.branchService.selectedBranch;
  protected readonly locating = this.branchService.locating;
  protected readonly locationError = this.branchService.locationError;

  protected readonly branchName = computed(
    () => this.selected()?.name ?? 'Elegir sucursal',
  );

  ngOnInit(): void {
    this.branchService.load();
  }

  protected close(): void {
    this.open.set(false);
    this.branchService.locationError.set('');
  }

  protected select(branch: Branch): void {
    this.branchService.setSelected(branch);
    this.open.set(false);
  }

  protected useLocation(): void {
    void this.branchService.detectNearest(true);
  }
}
