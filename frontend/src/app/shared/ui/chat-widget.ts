import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  ChatConversation,
  ChatMessage,
  ChatMode,
  ChatService,
  OrderStatusEvent,
} from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatWidgetService } from '../../core/services/chat-widget.service';
import { OrderChat } from './order-chat';
import { OrderStatusBadge } from './order-status-badge';

@Component({
  selector: 'app-chat-widget',
  imports: [OrderChat, OrderStatusBadge],
  template: `
    @if (visible()) {
      <div
        class="chat-widget"
        [class.page]="variant() === 'page'"
        [class.low]="!raised()"
        [class.mobile-hidden]="hideOnMobile()"
        data-testid="chat-widget"
      >
        @if (panelOpen()) {
          <section
            class="chat-window"
            [class.page]="variant() === 'page'"
            data-testid="chat-widget-panel"
          >
            @if (activeConversation(); as conversation) {
              <header class="cw-header">
                <button
                  type="button"
                  class="cw-icon-btn"
                  (click)="backToList()"
                  aria-label="Volver a los chats"
                  data-testid="chat-widget-back"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div class="cw-header-text">
                  <p class="cw-title">{{ displayName(conversation) }}</p>
                  <p class="cw-subtitle">Pedido #{{ conversation.orderNumber }}</p>
                </div>
                @if (variant() !== 'page') {
                  <button
                    type="button"
                    class="cw-icon-btn"
                    (click)="close()"
                    aria-label="Cerrar chat"
                    data-testid="chat-widget-close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                }
              </header>

              <div class="cw-order-bubble" data-testid="chat-widget-order">
                <span class="cw-order-number">#{{ conversation.orderNumber }}</span>
                <app-order-status [status]="conversation.orderStatus" />
                <span class="cw-order-total">
                  {{ '$' + conversation.totalAmount.toFixed(2) }}
                </span>
              </div>

              <app-order-chat
                class="cw-chat"
                [orderId]="conversation.orderId"
                [orderStatus]="conversation.orderStatus"
                [mode]="mode()"
                [compact]="true"
              />
            } @else if (activeOrderId()) {
              <header class="cw-header">
                <button
                  type="button"
                  class="cw-icon-btn"
                  (click)="backToList()"
                  aria-label="Volver a los chats"
                  data-testid="chat-widget-back"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div class="cw-header-text">
                  <p class="cw-title">Conversación</p>
                </div>
              </header>
              <p class="cw-empty" data-testid="chat-widget-loading">
                {{
                  loading()
                    ? 'Cargando conversación...'
                    : 'No se encontró la conversación de este pedido.'
                }}
              </p>
            } @else {
              <header class="cw-header">
                <div class="cw-header-text">
                  <p class="cw-title">Mensajes y consultas</p>
                  <p class="cw-subtitle">{{ unreadLabel() }}</p>
                </div>
                @if (variant() !== 'page') {
                  <button
                    type="button"
                    class="cw-icon-btn"
                    (click)="close()"
                    aria-label="Cerrar mensajes"
                    data-testid="chat-widget-close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                }
              </header>

              <div class="cw-search">
                <svg
                  class="cw-search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="search"
                  placeholder="Buscar pedido o cliente..."
                  [value]="query()"
                  (input)="onSearch($event)"
                  aria-label="Buscar conversaciones"
                  data-testid="chat-widget-search"
                />
              </div>

              <div class="cw-list">
                @if (loading()) {
                  <p class="cw-empty">Cargando chats...</p>
                } @else {
                  @for (conversation of filteredConversations(); track conversation.orderId) {
                    <button
                      type="button"
                      class="cw-item"
                      (click)="openConversation(conversation)"
                      data-testid="chat-widget-conversation"
                    >
                      <span class="cw-avatar" aria-hidden="true">
                        {{ initials(conversation) }}
                      </span>
                      <span class="cw-item-body">
                        <span class="cw-item-top">
                          <span class="cw-item-name">{{ displayName(conversation) }}</span>
                          <span class="cw-item-time">{{ lastActivity(conversation) }}</span>
                        </span>
                        <span class="cw-item-meta">
                          <span class="cw-item-order">#{{ conversation.orderNumber }}</span>
                          <app-order-status [status]="conversation.orderStatus" />
                        </span>
                        <span class="cw-item-preview">{{ preview(conversation) }}</span>
                      </span>
                      @if (conversation.unreadCount > 0) {
                        <span class="cw-unread" data-testid="chat-widget-unread">
                          {{ conversation.unreadCount }}
                        </span>
                      }
                    </button>
                  } @empty {
                    <p class="cw-empty" data-testid="chat-widget-empty">
                      No tenés conversaciones disponibles. El chat se habilita cuando un pedido
                      es aceptado.
                    </p>
                  }
                }
              </div>
            }
          </section>
        }

        @if (variant() !== 'page') {
          <button
            type="button"
            class="cw-launcher"
            (click)="toggle()"
            [attr.aria-expanded]="open()"
            aria-label="Abrir mensajes y consultas"
            data-testid="chat-widget-toggle"
          >
            @if (open()) {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"></path>
              </svg>
            }
            @if (totalUnread() > 0 && !open()) {
              <span class="cw-launcher-badge" data-testid="chat-widget-badge">
                {{ totalUnread() > 9 ? '9+' : totalUnread() }}
              </span>
            }
          </button>
        }
      </div>
    }
  `,
  styles: `
    .chat-widget {
      position: fixed;
      right: var(--spacing-lg);
      bottom: 144px;
      z-index: 60;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-md);
    }

    .chat-widget.low {
      bottom: var(--spacing-lg);
    }

    .chat-widget.page {
      position: static;
      width: 100%;
      height: 100%;
      display: block;
    }

    .chat-widget.page .chat-window {
      width: 100%;
      height: 100%;
      min-height: 420px;
      max-height: none;
      box-shadow: none;
    }

    @media (max-width: 767px) {
      .chat-widget.mobile-hidden {
        display: none;
      }
    }

    .chat-window {
      display: flex;
      flex-direction: column;
      width: min(380px, calc(100vw - 32px));
      height: min(560px, calc(100dvh - 190px));
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: cw-in 0.18s ease-out;
    }

    .cw-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
      border-bottom: 1px solid var(--color-surface-pressed);
      flex-shrink: 0;
    }

    .cw-header-text {
      flex: 1;
      min-width: 0;
    }

    .cw-title {
      margin: 0;
      font-size: var(--text-body-md-strong);
      line-height: var(--text-body-md-strong--line-height);
      font-weight: 600;
      color: var(--color-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cw-subtitle {
      margin: 0;
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
      color: var(--color-body);
    }

    .cw-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border: none;
      border-radius: var(--radius-pill);
      background-color: transparent;
      color: var(--color-ink);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .cw-icon-btn:hover {
      background-color: var(--color-canvas-soft);
    }

    .cw-icon-btn svg {
      width: 18px;
      height: 18px;
    }

    .cw-order-bubble {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: var(--spacing-sm) var(--spacing-md) 0;
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas-softer);
      border: 1px solid var(--color-surface-pressed);
      flex-shrink: 0;
    }

    .cw-order-number {
      font-size: var(--text-body-xs);
      font-weight: 600;
      color: var(--color-ink);
    }

    .cw-order-total {
      margin-left: auto;
      font-size: var(--text-body-xs);
      font-weight: 600;
      color: var(--color-ink);
      white-space: nowrap;
    }

    .cw-chat {
      flex: 1;
      min-height: 0;
    }

    .cw-search {
      position: relative;
      display: flex;
      align-items: center;
      margin: var(--spacing-sm) var(--spacing-md) 0;
      flex-shrink: 0;
    }

    .cw-search-icon {
      position: absolute;
      left: 12px;
      width: 16px;
      height: 16px;
      color: var(--color-mute);
      pointer-events: none;
    }

    .cw-search input {
      width: 100%;
      height: 36px;
      padding: 0 var(--spacing-md) 0 34px;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas-soft);
      color: var(--color-ink);
      font-size: var(--text-body-sm);
      font-family: inherit;
      outline: none;
    }

    .cw-search input:focus {
      border-color: var(--color-primary);
      background-color: var(--color-canvas);
    }

    .cw-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
    }

    .cw-item {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      width: 100%;
      padding: var(--spacing-sm);
      border: none;
      border-radius: var(--radius-lg);
      background-color: transparent;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .cw-item:hover {
      background-color: var(--color-canvas-softer);
    }

    .cw-avatar {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: var(--radius-full);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: var(--text-body-xs);
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .cw-item-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .cw-item-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }

    .cw-item-name {
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: var(--color-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cw-item-time {
      font-size: var(--text-caption);
      color: var(--color-mute);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .cw-item-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 0;
    }

    .cw-item-order {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    .cw-item-preview {
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
      color: var(--color-body);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cw-unread {
      display: grid;
      place-items: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      flex-shrink: 0;
      border-radius: var(--radius-pill);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 11px;
      font-weight: 700;
    }

    .cw-empty {
      margin: 0;
      padding: var(--spacing-2xl) var(--spacing-lg);
      text-align: center;
      font-size: var(--text-body-sm);
      line-height: var(--text-body-sm--line-height);
      color: var(--color-body);
    }

    .cw-launcher {
      position: relative;
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border: none;
      border-radius: var(--radius-full);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
      cursor: pointer;
      transition: transform 0.18s ease;
    }

    .cw-launcher:hover {
      transform: translateY(-2px);
    }

    .cw-launcher:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    .cw-launcher svg {
      width: 24px;
      height: 24px;
    }

    .cw-launcher-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      display: grid;
      place-items: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: var(--radius-pill);
      border: 2px solid var(--color-canvas);
      background-color: var(--color-accent);
      color: var(--color-ink);
      font-size: 11px;
      font-weight: 700;
    }

    @keyframes cw-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 768px) {
      .chat-widget {
        right: var(--spacing-3xl);
        bottom: var(--spacing-3xl);
      }

      .chat-widget.low {
        bottom: var(--spacing-3xl);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .chat-window {
        animation: none;
      }

      .cw-launcher {
        transition: none;
      }
    }
  `,
})
export class ChatWidget {
  readonly raised = input(true);
  readonly variant = input<'floating' | 'page'>('floating');
  readonly hideOnMobile = input(false);

  private readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly chatWidget = inject(ChatWidgetService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly query = signal('');
  protected readonly conversations = signal<ChatConversation[]>([]);
  protected readonly activeOrderId = signal<string | null>(null);
  private readonly currentUrl = signal(this.router.url);

  protected readonly mode = computed<ChatMode>(() => {
    const role = this.auth.user()?.role;
    if (role === 'admin') return 'admin';
    if (role === 'delivery') return 'delivery';
    return 'customer';
  });

  protected readonly panelOpen = computed(
    () => this.variant() === 'page' || this.open(),
  );

  protected readonly visible = computed(() => {
    const role = this.auth.user()?.role;
    if (!this.auth.isAuthed()) return false;
    if (role !== 'admin' && role !== 'delivery' && role !== 'customer') {
      return false;
    }
    if (
      this.variant() === 'floating' &&
      this.currentUrl().split('?')[0] === '/messages'
    ) {
      return false;
    }
    return true;
  });

  protected readonly activeConversation = computed(() => {
    const orderId = this.activeOrderId();
    if (!orderId) return null;
    return this.conversations().find((item) => item.orderId === orderId) ?? null;
  });

  protected readonly totalUnread = computed(() =>
    this.conversations().reduce((total, item) => total + item.unreadCount, 0),
  );

  protected readonly filteredConversations = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) return this.conversations();
    return this.conversations().filter((conversation) => {
      const name = this.displayName(conversation).toLowerCase();
      const email = conversation.customer?.email?.toLowerCase() ?? '';
      const body = conversation.lastMessage?.body?.toLowerCase() ?? '';
      return (
        conversation.orderNumber.toLowerCase().includes(query) ||
        name.includes(query) ||
        email.includes(query) ||
        body.includes(query)
      );
    });
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        this.conversations.set([]);
        this.activeOrderId.set(null);
        this.open.set(false);
        return;
      }
      this.loadConversations();
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    effect(() => {
      const orderId = this.chatWidget.requestedOrderId();
      if (!orderId || this.variant() !== 'floating') return;
      this.open.set(true);
      this.activeOrderId.set(orderId);
      this.query.set('');
      this.loadConversations();
      this.markRead(orderId);
      this.chatWidget.clear(orderId);
    });

    this.chat.message$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.onIncomingMessage(message));

    this.chat.orderStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.applyOrderStatus(event));
  }

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.activeOrderId.set(null);
      this.query.set('');
      this.loadConversations();
    }
  }

  protected close(): void {
    this.open.set(false);
    this.activeOrderId.set(null);
  }

  protected backToList(): void {
    this.activeOrderId.set(null);
  }

  protected openConversation(conversation: ChatConversation): void {
    this.activeOrderId.set(conversation.orderId);
    this.markRead(conversation.orderId);
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected displayName(conversation: ChatConversation): string {
    const customer = conversation.customer;
    const name = customer
      ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
      : '';
    if (this.mode() === 'admin' || this.mode() === 'delivery') {
      return name || 'Cliente';
    }
    return 'Tienda Market';
  }

  protected initials(conversation: ChatConversation): string {
    if (this.mode() === 'customer') return 'TM';
    const customer = conversation.customer;
    if (!customer) return 'CL';
    const initials = `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`;
    return initials.toUpperCase() || 'CL';
  }

  protected preview(conversation: ChatConversation): string {
    const last = conversation.lastMessage;
    if (!last) return 'Sin mensajes todavía';
    const body = last.body?.trim() || (last.hasAttachments ? 'Adjunto' : '');
    if (!body) return 'Sin mensajes todavía';
    return last.senderRole === this.mode() ? `Vos: ${body}` : body;
  }

  protected lastActivity(conversation: ChatConversation): string {
    const iso = conversation.lastMessage?.createdAt ?? conversation.createdAt;
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
  }

  protected unreadLabel(): string {
    const total = this.totalUnread();
    if (total === 0) return 'Todo al día';
    return `${total} mensaje${total === 1 ? '' : 's'} sin leer`;
  }

  private loadConversations(): void {
    if (!this.auth.isAuthed()) return;
    this.loading.set(true);
    this.chat.getConversations(this.mode()).subscribe((conversations) => {
      this.conversations.set(conversations);
      this.loading.set(false);
    });
  }

  private markRead(orderId: string): void {
    this.conversations.update((list) =>
      list.map((conversation) =>
        conversation.orderId === orderId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
    this.chat.markConversationRead(orderId, this.mode()).subscribe();
  }

  private onIncomingMessage(message: ChatMessage): void {
    const orderId = message.orderId;
    const isActive = this.panelOpen() && this.activeOrderId() === orderId;
    const fromOwnSide = message.senderRole === this.mode();
    let found = false;

    this.conversations.update((list) => {
      const index = list.findIndex((item) => item.orderId === orderId);
      if (index === -1) return list;
      found = true;
      const conversation = list[index];
      const nextConversation: ChatConversation = {
        ...conversation,
        lastMessage: {
          body: message.body,
          senderRole: message.senderRole,
          createdAt: message.createdAt,
          hasAttachments: message.attachments.length > 0,
        },
        unreadCount: isActive
          ? 0
          : fromOwnSide
            ? conversation.unreadCount
            : conversation.unreadCount + 1,
      };
      return [
        nextConversation,
        ...list.filter((item) => item.orderId !== orderId),
      ];
    });

    if (!found) {
      this.loadConversations();
      return;
    }

    if (isActive && !fromOwnSide) {
      this.markRead(orderId);
    }
  }

  private applyOrderStatus(event: OrderStatusEvent): void {
    this.conversations.update((list) =>
      list.map((conversation) =>
        conversation.orderId === event.orderId
          ? { ...conversation, orderStatus: event.status }
          : conversation,
      ),
    );
  }
}
