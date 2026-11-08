import { Injectable, OnDestroy, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export type NotificationType =
  | 'order_created'
  | 'order_status'
  | 'order_chat';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  orderId: string | null;
  orderNumber: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationListResponse {
  data: AppNotification[];
  unread: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private socket: Socket | null = null;
  private audio: HTMLAudioElement | null = null;

  readonly items = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly connected = signal(false);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const token = this.auth.token();
      if (user && token) {
        this.connect(token);
      } else {
        this.disconnect();
      }
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('click', () => this.unlockAudio(), {
        once: true,
      });
    }
  }

  // ─── Data ─────────────────────────────────────────────────────────

  load(limit = 30, unreadOnly = false): void {
    let params = new HttpParams().set('limit', limit.toString());
    if (unreadOnly) params = params.set('unreadOnly', 'true');
    this.http
      .get<NotificationListResponse>(this.api.url('notifications'), { params })
      .subscribe({
        next: (res) => {
          this.items.set(res.data ?? []);
          this.unreadCount.set(res.unread ?? 0);
        },
        error: () => undefined,
      });
  }

  refreshUnreadCount(): void {
    this.http
      .get<{ count: number }>(this.api.url('notifications/unread-count'))
      .subscribe({
        next: (res) => this.unreadCount.set(res.count ?? 0),
        error: () => undefined,
      });
  }

  markRead(id: string): Observable<AppNotification> {
    return this.http
      .patch<AppNotification>(this.api.url(`notifications/${id}/read`), {})
      .pipe(
        tap(() => {
          let wasUnread = false;
          this.items.update((list) =>
            list.map((item) => {
              if (item.id !== id) return item;
              if (!item.read) wasUnread = true;
              return { ...item, read: true };
            }),
          );
          if (wasUnread) {
            this.unreadCount.update((count) => Math.max(0, count - 1));
          }
        }),
      );
  }

  markAllRead(): void {
    if (this.unreadCount() === 0) return;
    this.http
      .patch<{ updated: number }>(this.api.url('notifications/read-all'), {})
      .subscribe({
        next: () => {
          this.items.update((list) =>
            list.map((item) => ({ ...item, read: true })),
          );
          this.unreadCount.set(0);
        },
        error: () => undefined,
      });
  }

  // ─── Socket ───────────────────────────────────────────────────────

  private connect(token: string): void {
    if (this.socket) return;
    const base = environment.socketUrl || window.location.origin;
    this.socket = io(`${base}/notifications`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      this.load();
    });
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('notification', (payload: AppNotification) =>
      this.onNotification(payload),
    );
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
    this.items.set([]);
    this.unreadCount.set(0);
  }

  private onNotification(notification: AppNotification): void {
    this.items.update((list) => {
      if (list.some((item) => item.id === notification.id)) return list;
      return [notification, ...list];
    });
    if (!notification.read) {
      this.unreadCount.update((count) => count + 1);
    }
    this.toast.info(notification.title);
    this.playSound();
  }

  // ─── Sound ────────────────────────────────────────────────────────

  private getAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio('/audio/notify.mp3');
      this.audio.preload = 'auto';
    }
    return this.audio;
  }

  private unlockAudio(): void {
    const audio = this.getAudio();
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  }

  private playSound(): void {
    const audio = this.getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
