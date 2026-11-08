import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  AppNotification,
  NotificationsService,
} from '../../core/services/notifications.service';

export interface DashboardNavItem {
  path: string;
  label: string;
  testId: string;
  exact: boolean;
}

@Component({
  selector: 'app-dashboard-shell',
  imports: [NgClass, RouterLink, RouterLinkActive, DatePipe],
  template: `
    <div
      class="flex h-screen bg-canvas"
      [attr.data-testid]="testIdPrefix() + '-layout'"
    >
      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div
          (click)="sidebarOpen.set(false)"
          class="fixed inset-0 bg-black/50 z-30 lg:hidden"
          [attr.data-testid]="testIdPrefix() + '-sidebar-overlay'"
        ></div>
      }

      <!-- Sidebar -->
      <aside
        class="w-64 bg-primary flex flex-col shrink-0 transition-transform duration-200 ease-in-out
               fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0"
        [ngClass]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full'"
        [attr.data-testid]="testIdPrefix() + '-sidebar'"
      >
        <!-- Logo -->
        <div class="px-xl py-2xl border-b border-white/10">
          <div class="flex items-center justify-between">
            <a [routerLink]="homePath()" class="flex items-center gap-md" (click)="closeSidebar()">
              <div class="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-on-accent font-bold text-body-md">M</div>
              <div class="flex flex-col">
                <span class="text-body-lg font-bold text-white leading-tight">Market<span class="text-accent">.</span></span>
                <span class="text-body-xs text-white/50">{{ brandSubtitle() }}</span>
              </div>
            </a>
            <button
              type="button"
              (click)="sidebarOpen.set(false)"
              class="lg:hidden text-white/70 hover:text-white p-sm"
              [attr.data-testid]="testIdPrefix() + '-sidebar-close'"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <nav
          class="flex-1 px-lg py-xl flex flex-col gap-xs overflow-y-auto"
          [attr.data-testid]="testIdPrefix() + '-nav'"
        >
          @for (item of navItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-white/15 text-white"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="flex items-center gap-md px-lg py-md rounded-lg text-body-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              [attr.data-testid]="'nav-' + item.testId"
              (click)="closeSidebar()"
            >
              <span class="w-5 h-5 flex items-center justify-center">
                @switch (item.testId) {
                  @case ('dashboard') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                  }
                  @case ('users') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10 9a3 3 0 100-6 3 3 0 000 6Zm-7 9a7 7 0 1114 0H3Z"/></svg>
                  }
                  @case ('products') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 5h-2V5a3 3 0 00-3-3Zm0 2a1 1 0 011 1v1H9V5a1 1 0 011-1Z" clip-rule="evenodd"/></svg>
                  }
                  @case ('categories') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5Zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5Zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5Zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5Z" clip-rule="evenodd"/></svg>
                  }
                  @case ('orders') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.24l-8.5 6.5-8.5-6.5Zm.5 5.12V16.5A2.25 2.25 0 003.25 19h13.5A2.25 2.25 0 0019 16.75V10.36l-8.5 6.5-8.5-6.5Z" clip-rule="evenodd"/></svg>
                  }
                  @case ('expenses') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M2 4.75A2.75 2.75 0 014.75 2h10.5A2.75 2.75 0 0118 4.75v10.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25V4.75ZM5.75 6a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5Zm0 3.25a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5Zm0 3.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5Z" clip-rule="evenodd"/></svg>
                  }
                  @case ('warehouse-orders') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.24l-8.5 6.5-8.5-6.5Zm.5 5.12V16.5A2.25 2.25 0 003.25 19h13.5A2.25 2.25 0 0019 16.75V10.36l-8.5 6.5-8.5-6.5Z" clip-rule="evenodd"/></svg>
                  }
                  @case ('banners') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5Zm3.94 4.28a.75.75 0 00-1.06 1.06L8.94 12l-4.06 4.06a.75.75 0 101.06 1.06L10 13.06l4.06 4.06a.75.75 0 101.06-1.06L11.06 12l4.06-4.06a.75.75 0 00-1.06-1.06L10 10.94 5.94 6.89Z" clip-rule="evenodd"/></svg>
                  }
                  @case ('flash-sales') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
                  }
                  @case ('settings') {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.95 6.95 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.95 6.95 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.95 6.95 0 01-.587-1.416l-1.473-.294A1 1 0 011 11.36V10a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.71l1.25.834a6.95 6.95 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z" clip-rule="evenodd"/></svg>
                  }
                }
              </span>
              {{ item.label }}
              @if (isOrderItem(item.testId) && notifications.unreadCount() > 0) {
                <span
                  class="ml-auto min-w-[20px] h-5 px-xs inline-flex items-center justify-center rounded-full bg-accent text-on-accent text-body-xs font-bold"
                  data-testid="nav-orders-badge"
                >
                  {{ notifications.unreadCount() }}
                </span>
              }
            </a>
          }
        </nav>

        <!-- User -->
        <div class="px-xl py-xl border-t border-white/10">
          <div class="flex items-center gap-md mb-lg">
            <div class="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-on-accent text-body-sm font-bold">
              {{ userInitials() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-body-sm text-white font-medium truncate">{{ userName() }}</p>
              <p class="text-body-xs text-white/50 truncate">{{ userEmail() }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-xs">
            <a
              routerLink="/"
              class="flex items-center gap-md px-lg py-md rounded-lg text-body-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              [attr.data-testid]="testIdPrefix() + '-view-store'"
              (click)="closeSidebar()"
            >
              <span class="w-5 h-5 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clip-rule="evenodd"/></svg>
              </span>
              Ver tienda
            </a>
            <button
              type="button"
              (click)="logout()"
              class="flex items-center gap-md px-lg py-md rounded-lg text-body-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              [attr.data-testid]="testIdPrefix() + '-logout'"
            >
              <span class="w-5 h-5 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1Zm10.293 9.293a1 1 0 0 0 1.414 1.414l3-3a1 1 0 0 0 0-1.414l-3-3a1 1 0 1 0-1.414 1.414L14.586 9H7a1 1 0 1 0 0 2h7.586l-1.293 1.293Z" clip-rule="evenodd"/></svg>
              </span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <!-- Main -->
      <main class="flex-1 overflow-y-auto bg-canvas">
        <!-- Top bar -->
        <div class="flex items-center gap-md px-lg py-md border-b border-surface-pressed bg-canvas sticky top-0 z-20">
          <button
            type="button"
            (click)="sidebarOpen.set(true)"
            class="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-canvas-soft transition-colors"
            [attr.data-testid]="testIdPrefix() + '-sidebar-toggle'"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75Zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75ZM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10Z" clip-rule="evenodd" />
            </svg>
          </button>
          <span class="text-body-sm font-semibold text-ink hidden lg:block">{{ brandSubtitle() }}</span>

          <!-- Notifications bell -->
          <div class="relative ml-auto">
            <button
              type="button"
              (click)="notifOpen.set(!notifOpen())"
              class="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-canvas-soft transition-colors"
              aria-label="Notificaciones"
              [attr.data-testid]="testIdPrefix() + '-notifications-button'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              @if (notifications.unreadCount() > 0) {
                <span
                  class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-accent text-on-accent text-body-xs font-bold"
                  [attr.data-testid]="testIdPrefix() + '-notifications-badge'"
                >
                  {{ notifications.unreadCount() }}
                </span>
              }
            </button>

            @if (notifOpen()) {
              <div class="fixed inset-0 z-20" (click)="notifOpen.set(false)"></div>
              <div
                class="absolute right-0 top-full mt-xs w-80 max-w-[90vw] bg-canvas rounded-xl border border-surface-pressed shadow-lg z-30 overflow-hidden"
                [attr.data-testid]="testIdPrefix() + '-notifications-dropdown'"
              >
                <div class="flex items-center justify-between px-lg py-md border-b border-surface-pressed">
                  <span class="text-body-sm font-semibold">Notificaciones</span>
                  @if (notifications.unreadCount() > 0) {
                    <button
                      type="button"
                      class="text-caption text-primary hover:underline"
                      (click)="notifications.markAllRead()"
                      [attr.data-testid]="testIdPrefix() + '-notifications-mark-all'"
                    >
                      Marcar leídas
                    </button>
                  }
                </div>
                <div class="max-h-80 overflow-y-auto">
                  @for (n of notifications.items(); track n.id) {
                    <button
                      type="button"
                      class="w-full text-left px-lg py-md hover:bg-canvas-softer transition-colors border-b border-surface-pressed last:border-b-0"
                      [class.bg-canvas-softer]="!n.read"
                      (click)="openNotification(n)"
                      [attr.data-testid]="testIdPrefix() + '-notification-' + n.id"
                    >
                      <p class="text-body-sm font-medium text-ink">{{ n.title }}</p>
                      @if (n.body) {
                        <p class="text-caption text-body truncate">{{ n.body }}</p>
                      }
                      <p class="text-caption text-mute mt-xxs">{{ n.createdAt | date:'dd/MM HH:mm' }}</p>
                    </button>
                  } @empty {
                    <p class="px-lg py-xl text-center text-body-sm text-mute">Sin notificaciones</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
        <div class="max-w-[1200px] mx-auto px-lg py-2xl lg:px-2xl">
          <ng-content />
        </div>
      </main>
    </div>
  `,
})
export class DashboardShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly notifications = inject(NotificationsService);

  readonly testIdPrefix = input.required<string>();
  readonly brandSubtitle = input('Admin Panel');
  readonly homePath = input('/');
  readonly navItems = input.required<DashboardNavItem[]>();

  protected readonly sidebarOpen = signal(false);
  protected readonly notifOpen = signal(false);

  constructor() {
    this.notifications.load();
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected openNotification(notification: AppNotification): void {
    this.notifOpen.set(false);
    if (!notification.read) {
      this.notifications.markRead(notification.id).subscribe();
    }
    if (!notification.orderId) return;
    const path =
      this.testIdPrefix() === 'admin' ? '/admin/orders' : this.homePath();
    this.router.navigate([path], {
      queryParams: { order: notification.orderId },
    });
  }

  protected isOrderItem(testId: string): boolean {
    return testId === 'orders' || testId === 'warehouse-orders';
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  protected readonly userName = computed(() => {
    const u = this.auth.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });
  protected readonly userEmail = computed(() => this.auth.user()?.email ?? '');
  protected readonly userInitials = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  });
}
