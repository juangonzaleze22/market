import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Category, CategoryService } from '../../core/services/category.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" data-testid="navbar">
      <div class="navbar-inner container-max">
        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="nav-toggle"
          (click)="mobileMenuOpen.set(!mobileMenuOpen())"
          [attr.aria-expanded]="mobileMenuOpen()"
          aria-label="Abrir menú"
          data-testid="mobile-menu-toggle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <!-- Categories dropdown -->
        <div class="categories-dropdown-wrap">
          <button
            type="button"
            class="categories-btn"
            (click)="categoriesMenuOpen.set(!categoriesMenuOpen())"
            [attr.aria-expanded]="categoriesMenuOpen()"
            data-testid="browse-categories-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span class="categories-btn-label">Explorar categorías</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          @if (categoriesMenuOpen()) {
            <div class="dropdown categories-dropdown" data-testid="categories-dropdown">
              @for (category of categories(); track category.id) {
                <a
                  [routerLink]="['/shop']"
                  [queryParams]="{ category: category.slug }"
                  class="dropdown-item"
                  (click)="categoriesMenuOpen.set(false)"
                >{{ category.name }}</a>
              } @empty {
                <span class="dropdown-empty">Sin categorías</span>
              }
            </div>
          }
        </div>

        <!-- Navigation links -->
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="nav-link-active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Inicio</a>
          <a routerLink="/shop" routerLinkActive="nav-link-active" class="nav-link">Tienda</a>
          <a routerLink="/shop" [queryParams]="{ bestDeals: 'true' }" class="nav-link nav-link-deals">Ofertas</a>
          @for (category of topCategories(); track category.id) {
            <a
              [routerLink]="['/shop']"
              [queryParams]="{ category: category.slug }"
              class="nav-link"
            >{{ category.name }}</a>
          }
          <a routerLink="/about" routerLinkActive="nav-link-active" class="nav-link">Quiénes somos</a>
          <a routerLink="/blog" routerLinkActive="nav-link-active" class="nav-link">Blog</a>
        </div>

        <!-- Delivery hours -->
        @if (settings().deliveryHours) {
          <div class="delivery-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{{ settings().deliveryHours }}</span>
          </div>
        }
      </div>

      <!-- Mobile menu -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu" data-testid="mobile-menu">
          <div class="mobile-menu-inner">
            <a routerLink="/" class="mobile-link" (click)="mobileMenuOpen.set(false)">Inicio</a>
            <a routerLink="/shop" class="mobile-link" (click)="mobileMenuOpen.set(false)">Tienda</a>
            <a routerLink="/shop" [queryParams]="{ bestDeals: 'true' }" class="mobile-link" (click)="mobileMenuOpen.set(false)">Ofertas</a>
            <div class="mobile-divider"></div>
            @for (category of categories(); track category.id) {
              <a
                [routerLink]="['/shop']"
                [queryParams]="{ category: category.slug }"
                class="mobile-link"
                (click)="mobileMenuOpen.set(false)"
              >{{ category.name }}</a>
            }
            <div class="mobile-divider"></div>
            <a routerLink="/about" class="mobile-link" (click)="mobileMenuOpen.set(false)">Quiénes somos</a>
            <a routerLink="/blog" class="mobile-link" (click)="mobileMenuOpen.set(false)">Blog</a>
          </div>
        </div>
      }
    </nav>
  `,
  styles: `
    .navbar {
      background-color: var(--color-primary);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      position: relative;
      z-index: 40;
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      height: 56px;
    }

    /* ─── Mobile toggle ─────────────────────────── */
    .nav-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-on-primary);
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.15s ease;
    }

    .nav-toggle:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    /* ─── Categories Dropdown ──────────────────── */
    .categories-dropdown-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .categories-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      border: none;
      border-radius: var(--radius-pill);
      font-size: var(--text-body-md);
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s ease;
      white-space: nowrap;
      line-height: 1;
    }

    .categories-btn:hover {
      opacity: 0.9;
    }

    .categories-btn svg {
      flex-shrink: 0;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      overflow: hidden;
      z-index: 50;
    }

    .categories-dropdown {
      left: 0;
      right: auto;
      min-width: 220px;
      max-height: 360px;
      overflow-y: auto;
    }

    .dropdown-item {
      display: block;
      padding: var(--spacing-sm) var(--spacing-lg);
      color: var(--color-ink);
      text-decoration: none;
      font-size: var(--text-body-md);
      white-space: nowrap;
      transition: background-color 0.15s ease;
    }

    .dropdown-item:hover {
      background-color: var(--color-canvas-soft);
    }

    .dropdown-empty {
      display: block;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--text-body-sm);
      color: var(--color-mute);
    }

    /* ─── Nav Links ────────────────────────────── */
    .nav-links {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .nav-links::-webkit-scrollbar {
      display: none;
    }

    .nav-link {
      color: var(--color-on-primary);
      text-decoration: none;
      font-size: var(--text-body-md);
      font-weight: 500;
      transition: color 0.2s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .nav-link:hover {
      color: var(--color-accent);
    }

    .nav-link-active {
      color: var(--color-accent);
    }

    .nav-link-deals {
      color: var(--color-accent);
    }

    /* ─── Delivery Info ────────────────────────── */
    .delivery-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: rgba(255, 255, 255, 0.75);
      font-size: var(--text-body-xs);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .delivery-info svg {
      flex-shrink: 0;
    }

    /* ─── Mobile Menu ──────────────────────────── */
    .mobile-menu {
      background-color: var(--color-primary);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }

    .mobile-menu-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
      display: flex;
      flex-direction: column;
    }

    .mobile-link {
      color: var(--color-on-primary);
      text-decoration: none;
      font-size: var(--text-body-md);
      font-weight: 500;
      padding: var(--spacing-sm) 0;
      transition: color 0.2s ease;
    }

    .mobile-link:hover {
      color: var(--color-accent);
    }

    .mobile-divider {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.12);
      margin: var(--spacing-xxs) 0;
    }

    /* ─── Responsive ───────────────────────────── */
    @media (max-width: 767px) {
      .navbar-inner {
        gap: var(--spacing-sm);
        height: 52px;
      }

      .nav-toggle {
        display: inline-flex;
      }

      .nav-links {
        display: none;
      }

      .delivery-info {
        display: none;
      }

      .categories-dropdown-wrap {
        display: none;
      }

      .categories-btn {
        padding: var(--spacing-xs) var(--spacing-md);
        font-size: var(--text-body-sm);
      }
    }

    @media (max-width: 380px) {
      .categories-btn-label {
        display: none;
      }
    }
  `,
})
export class Navbar implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly settingsService = inject(SiteSettingsService);
  private readonly elementRef = inject(ElementRef);

  protected readonly categories = signal<Category[]>([]);
  protected readonly topCategories = computed(() => this.categories().slice(0, 4));
  protected readonly mobileMenuOpen = signal(false);
  protected readonly categoriesMenuOpen = signal(false);
  protected readonly settings = this.settingsService.settings;

  ngOnInit(): void {
    this.settingsService.load();
    this.categoryService.getAll().subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.mobileMenuOpen.set(false);
      this.categoriesMenuOpen.set(false);
    }
  }
}
