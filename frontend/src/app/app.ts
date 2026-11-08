import { AfterViewInit, Component, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TopBanner } from './shared/layout/top-banner';
import { Header } from './shared/layout/header';
import { Navbar } from './shared/layout/navbar';
import { Footer } from './shared/layout/footer';
import { BottomNav } from './shared/layout/bottom-nav';
import { CartDrawer } from './shared/ui/cart-drawer';
import { AuthModalComponent } from './shared/ui/auth-modal';
import { ToastComponent } from './shared/ui/toast';
import { ChatService } from './core/services/chat.service';
import { NotificationsService } from './core/services/notifications.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBanner, Header, Navbar, Footer, BottomNav, CartDrawer, AuthModalComponent, ToastComponent],
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
  protected readonly hideShell = signal(App.isShellHidden(this.router.url));

  private static isShellHidden(url: string): boolean {
    return (
      url.startsWith('/admin') ||
      url.startsWith('/warehouse') ||
      url.startsWith('/delivery')
    );
  }

  constructor() {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.hideShell.set(App.isShellHidden(e.urlAfterRedirects));
        setTimeout(() => this.syncHeaderHeight());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  }

  ngAfterViewInit(): void {
    this.syncHeaderHeight();
  }

  private syncHeaderHeight(): void {
    this.headerHeight.set(this.headerRef?.nativeElement?.offsetHeight ?? 0);
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }
}
