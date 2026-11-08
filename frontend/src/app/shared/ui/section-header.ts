import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section-header',
  imports: [RouterLink],
  template: `
    <div class="section-header">
      <div class="section-header-text">
        @if (subtitle()) {
          <p class="section-subtitle">{{ subtitle() }}</p>
        }
        <h2 class="section-title" [attr.data-testid]="titleTestId()">
          <span class="title-bold">{{ titleBold() }}</span>
          @if (titleAccent()) {
            <span class="title-accent"> {{ titleAccent() }}</span>
          }
        </h2>
      </div>
      <ng-content select="[section-extra]" />
      @if (link()) {
        <a [routerLink]="link()" class="btn-view-all" data-testid="view-all-link">
          {{ linkText() }}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      }
    </div>
    @if (tabs().length > 0) {
      <div class="flex gap-sm flex-wrap mt-lg" role="tablist" data-testid="section-tabs">
        @for (tab of tabs(); track tab) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="tab === activeTab()"
            class="tab-pill"
            [class.tab-active]="tab === activeTab()"
            (click)="tabChange.emit(tab)"
          >
            {{ tab }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    .section-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .section-header-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-body);
      letter-spacing: 0.02em;
    }

    .section-title {
      font-size: 28px;
      line-height: 36px;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .title-bold {
      color: var(--color-ink);
    }

    .title-accent {
      color: var(--color-primary);
    }

    .btn-view-all {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 13px;
      font-weight: 600;
      line-height: 16px;
      border-radius: var(--radius-pill);
      padding: 10px 20px;
      text-decoration: none;
      white-space: nowrap;
      transition: opacity 0.2s ease;
      border: none;
      cursor: pointer;
    }

    .btn-view-all:hover {
      opacity: 0.85;
    }

    .tab-pill {
      border-radius: var(--radius-pill);
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      line-height: 16px;
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      color: var(--color-ink);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-pill:hover {
      background-color: var(--color-canvas-soft);
    }

    .tab-active {
      background-color: var(--color-primary) !important;
      color: var(--color-on-primary) !important;
      border-color: var(--color-primary) !important;
    }
  `,
})
export class SectionHeader {
  readonly titleTestId = input('section-title');
  readonly titleBold = input.required<string>();
  readonly titleAccent = input('');
  readonly subtitle = input('');
  readonly tabs = input<string[]>([]);
  readonly activeTab = input<string>('');
  readonly link = input('');
  readonly linkText = input('Ver todo');
  readonly tabChange = output<string>();
}
