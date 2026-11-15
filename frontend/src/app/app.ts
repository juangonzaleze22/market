import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TopBanner } from './shared/layout/top-banner';
import { Header } from './shared/layout/header';
import { Navbar } from './shared/layout/navbar';
import { Footer } from './shared/layout/footer';
import { BottomNav } from './shared/layout/bottom-nav';
import { BranchSwitcher } from './shared/layout/branch-switcher';
import { CartDrawer } from './shared/ui/cart-drawer';
import { AuthModalComponent } from './shared/ui/auth-modal';
import { ToastComponent } from './shared/ui/toast';
import { ScrollToTop } from './shared/ui/scroll-to-top';
import { ChatWidget } from './shared/ui/chat-widget';
import { ChatService } from './core/services/chat.service';
import { NotificationsService } from './core/services/notifications.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBanner, Header, Navbar, Footer, BottomNav, BranchSwitcher, CartDrawer, AuthModalComponent, ToastComponent, ScrollToTop, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('headerRef', { read: ElementRef })
  private headerRef?: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly chat = inject(ChatService);
  private readonly notifications = inject(NotificationsService);
  private navSub?: ReturnType<typeof this.router.events.subscribe>;

  protected readonly headerHeight = signal(0);
  protected readonly currentUrl = signal(App.initialPath(this.router.url));
  private readonly mobileQuery = App.mobileMediaQuery();
  protected readonly isMobileViewport = signal(this.mobileQuery?.matches ?? false);

  protected readonly hideShell = computed(() => {
    const url = this.currentUrl();
    if (App.isAlwaysHidden(url)) return true;
    return this.isMobileViewport() && App.isCheckout(url);
  });

  protected readonly hideBottomNav = computed(
    () => this.hideShell() || App.isCheckout(this.currentUrl()),
  );

  private readonly onMobileChange = (event: MediaQueryListEvent) => {
    this.isMobileViewport.set(event.matches);
  };

  private lastPath = App.initialPath(this.router.url).split('?')[0];

  private static initialPath(fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    return `${window.location.pathname}${window.location.search}`;
  }

  private static mobileMediaQuery(): MediaQueryList | null {
    if (typeof window === 'undefined') return null;
    return window.matchMedia('(max-width: 767px)');
  }

  private static pathOf(url: string): string {
    return url.split('?')[0];
  }

  private static isAlwaysHidden(url: string): boolean {
    const path = App.pathOf(url);
    return (
      path.startsWith('/admin') ||
      path.startsWith('/warehouse') ||
      path.startsWith('/delivery')
    );
  }

  private static isCheckout(url: string): boolean {
    const path = App.pathOf(url);
    return path === '/checkout' || path.startsWith('/checkout/');
  }

  constructor() {
    this.mobileQuery?.addEventListener('change', this.onMobileChange);

    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        const pathChanged = path !== this.lastPath;
        this.lastPath = path;

        this.currentUrl.set(e.urlAfterRedirects);
        setTimeout(() => this.syncHeaderHeight());

        // Solo volver al inicio cuando cambia de página; los cambios de
        // filtros (query params) conservan la posición del scroll.
        if (pathChanged) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }

  ngAfterViewInit(): void {
    this.syncHeaderHeight();
  }

  private syncHeaderHeight(): void {
    const height = this.headerRef?.nativeElement?.offsetHeight ?? 0;
    if (height !== this.headerHeight()) {
      this.headerHeight.set(height);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.syncHeaderHeight();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    this.mobileQuery?.removeEventListener('change', this.onMobileChange);
  }
}
