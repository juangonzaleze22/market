import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  ConnectedPosition,
  OverlayModule,
} from '@angular/cdk/overlay';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  imports: [OverlayModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="select-wrap" [class.select-form]="variant() === 'form'">
      <button
        #trigger
        type="button"
        class="select-trigger"
        [id]="controlId() || null"
        [attr.data-testid]="testId() ? testId() + '-trigger' : null"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span class="select-label" [class.is-placeholder]="!selectedLabel()">
          {{ selectedLabel() || placeholder() }}
        </span>
        <svg
          class="select-chevron"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="open()"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayWidth]="triggerWidth()"
        [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        (backdropClick)="close()"
        (detach)="close()"
      >
        <div class="select-panel" role="listbox" [attr.data-testid]="testId() || null">
          @for (option of options(); track option.value; let i = $index) {
            <button
              type="button"
              role="option"
              class="select-option"
              [class.is-selected]="option.value === value()"
              [class.is-active]="i === activeIndex()"
              [disabled]="option.disabled"
              [attr.aria-selected]="option.value === value()"
              [attr.data-testid]="testId() ? testId() + '-option-' + option.value : null"
              (click)="choose(option)"
            >
              <span class="select-option-text">
                <span class="select-option-label">{{ option.label }}</span>
                @if (option.hint) {
                  <span class="select-option-hint">{{ option.hint }}</span>
                }
              </span>
              @if (option.value === value()) {
                <span class="select-check" aria-hidden="true">✓</span>
              }
            </button>
          } @empty {
            <p class="select-empty">Sin opciones</p>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      max-width: 100%;
    }

    .select-wrap {
      display: inline-block;
      max-width: 100%;
    }

    .select-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      max-width: 100%;
      background-color: var(--color-canvas);
      color: var(--color-ink);
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      border: 1px solid var(--color-surface-pressed);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-pill);
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .select-trigger:hover {
      border-color: var(--color-mute);
    }

    .select-trigger:focus-visible {
      border-color: var(--color-primary);
    }

    .select-trigger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .select-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .select-label.is-placeholder {
      color: var(--color-mute);
    }

    .select-chevron {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--color-body);
      transition: transform 0.15s ease;
    }

    .select-trigger[aria-expanded='true'] .select-chevron {
      transform: rotate(180deg);
    }

    /* Variante para formularios */
    .select-form,
    .select-form .select-trigger {
      width: 100%;
    }

    .select-form .select-trigger {
      border-radius: var(--radius-lg);
      padding: var(--spacing-sm) var(--spacing-md);
    }

    /* Panel del overlay */
    .select-panel {
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-sizing: border-box;
      min-width: 200px;
      max-height: 320px;
      overflow-y: auto;
      padding: var(--spacing-xxs);
      background: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    }

    .select-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-ink);
      font-size: var(--text-body-md);
      text-align: left;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }

    .select-option:hover,
    .select-option.is-active {
      background-color: var(--color-canvas-soft);
    }

    .select-option.is-selected {
      font-weight: 600;
    }

    .select-option:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .select-option-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .select-option-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .select-option-hint {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    .select-check {
      flex-shrink: 0;
      color: var(--color-primary);
      font-weight: 700;
    }

    .select-empty {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--text-body-sm);
      color: var(--color-mute);
    }
  `,
})
export class SelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input('Seleccionar...');
  readonly testId = input('');
  readonly controlId = input('');
  readonly variant = input<'filter' | 'form'>('filter');
  readonly resetAfterSelect = input(false);

  protected readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly open = signal(false);
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly triggerWidth = signal<number>(0);

  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? '',
  );

  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected choose(option: SelectOption): void {
    if (option.disabled) return;
    if (this.resetAfterSelect()) {
      this.onChange(option.value);
      this.onTouched();
      this.value.set('');
      this.close();
      return;
    }
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.close();
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        const option = this.options()[this.activeIndex()];
        if (option) this.choose(option);
        return;
      }
      case 'Escape': {
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        return;
      }
    }
  }

  @HostListener('document:keydown.escape')
  protected onDocumentEscape(): void {
    if (this.open()) this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.open()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      const target = event.target as HTMLElement;
      if (!target.closest('.cdk-overlay-container')) {
        this.close();
      }
    }
  }

  private openPanel(): void {
    this.triggerWidth.set(this.trigger().nativeElement.offsetWidth);
    const selectedIndex = this.options().findIndex(
      (option) => option.value === this.value(),
    );
    this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : this.firstEnabledIndex());
    this.open.set(true);
  }

  private moveActive(direction: 1 | -1): void {
    const options = this.options();
    if (options.length === 0) return;

    let index = this.activeIndex();
    for (let step = 0; step < options.length; step += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index].disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private firstEnabledIndex(): number {
    const index = this.options().findIndex((option) => !option.disabled);
    return index >= 0 ? index : -1;
  }
}
