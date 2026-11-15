import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-scroll-to-top',
  template: `
    @if (visible()) {
      <button
        type="button"
        class="scroll-top-btn"
        (click)="scrollToTop()"
        aria-label="Volver arriba"
        title="Volver arriba"
        data-testid="scroll-to-top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="scroll-top-icon">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    }
  `,
  styles: `
    .scroll-top-btn {
      position: fixed;
      right: var(--spacing-lg);
      bottom: 88px;
      z-index: 40;
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      animation: scroll-top-in 0.18s ease-out;
      transition:
        transform 0.2s ease,
        opacity 0.2s ease;
    }

    .scroll-top-btn:hover {
      transform: translateY(-2px);
    }

    .scroll-top-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    .scroll-top-icon {
      width: 20px;
      height: 20px;
    }

    @keyframes scroll-top-in {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 768px) {
      .scroll-top-btn {
        right: var(--spacing-3xl);
        bottom: 100px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .scroll-top-btn {
        animation: none;
        transition: none;
      }
    }
  `,
})
export class ScrollToTop {
  protected readonly visible = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.visible.set(window.scrollY > 480);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
