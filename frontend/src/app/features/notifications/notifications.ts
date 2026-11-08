import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import {
  AppNotification,
  NotificationsService,
} from '../../core/services/notifications.service';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe],
  template: `
    <section class="py-3xl max-w-[52rem] mx-auto px-lg" data-testid="notifications-page">
      <div class="flex items-center justify-between mb-2xl">
        <h1 class="text-display-md font-bold">Notificaciones</h1>
        @if (auth.isAuthed() && notifications.unreadCount() > 0) {
          <button
            type="button"
            class="btn-secondary"
            (click)="notifications.markAllRead()"
            data-testid="notifications-mark-all"
          >
            Marcar todas como leídas
          </button>
        }
      </div>

      @if (!auth.isAuthed()) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Iniciá sesión para ver tus notificaciones</p>
          <button type="button" class="btn-primary" (click)="authModal.openLogin()">Iniciar sesión</button>
        </div>
      } @else if (notifications.items().length === 0) {
        <div
          class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed"
          data-testid="notifications-empty"
        >
          <p class="text-body text-body">No tenés notificaciones</p>
        </div>
      } @else {
        <div class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden">
          @for (notification of notifications.items(); track notification.id) {
            <button
              type="button"
              class="w-full text-left px-2xl py-xl hover:bg-canvas-softer transition-colors border-b border-surface-pressed last:border-b-0 flex items-start gap-lg"
              [class.bg-canvas-softer]="!notification.read"
              (click)="openNotification(notification)"
              data-testid="notification-item"
            >
              <span
                class="mt-xs w-2 h-2 rounded-full shrink-0"
                [class.bg-accent]="!notification.read"
                [class.bg-surface-pressed]="notification.read"
              ></span>
              <span class="flex-1 min-w-0">
                <span class="block text-body-sm-strong text-ink">{{ notification.title }}</span>
                @if (notification.body) {
                  <span class="block text-caption text-body">{{ notification.body }}</span>
                }
                <span class="block text-caption text-mute mt-xxs">
                  {{ notification.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </span>
            </button>
          }
        </div>
      }
    </section>
  `,
})
export class Notifications implements OnInit {
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  readonly notifications = inject(NotificationsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.auth.isAuthed()) {
      this.notifications.load();
    }
  }

  openNotification(notification: AppNotification): void {
    if (!notification.read) {
      this.notifications.markRead(notification.id).subscribe();
    }
    if (notification.orderId) {
      this.router.navigate(['/orders'], {
        queryParams: { order: notification.orderId },
      });
    }
  }
}
