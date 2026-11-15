import { Injectable, OnDestroy, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, catchError, of } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface ChatAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export type ChatSenderRole = 'customer' | 'admin' | 'delivery' | 'system';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string | null;
  senderRole: ChatSenderRole;
  body: string | null;
  attachments: ChatAttachment[];
  createdAt: string;
}

export type ChatMode = 'customer' | 'admin' | 'delivery';

export interface ChatConversationCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChatConversationMessage {
  body: string | null;
  senderRole: ChatSenderRole;
  createdAt: string;
  hasAttachments: boolean;
}

export interface ChatConversation {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  customer: ChatConversationCustomer | null;
  lastMessage: ChatConversationMessage | null;
  unreadCount: number;
}

export interface NewOrderEvent {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderStatusEvent {
  orderId: string;
  orderNumber?: string;
  status: string;
  rejectionReason?: string | null;
}

export interface DeliveryLocationEvent {
  orderId: string;
  latitude: number;
  longitude: number;
  at: string;
}

export interface DeliveryAssignedEvent {
  orderId: string;
  deliveryId: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private socket: Socket | null = null;
  private readonly joinedOrderCounts = new Map<string, number>();
  private readonly newOrderSubject = new Subject<NewOrderEvent>();
  private readonly orderStatusSubject = new Subject<OrderStatusEvent>();
  private readonly deliveryLocationSubject = new Subject<DeliveryLocationEvent>();
  private readonly deliveryAssignedSubject = new Subject<DeliveryAssignedEvent>();
  private readonly newReadyOrderSubject = new Subject<NewOrderEvent>();
  private readonly messageSubject = new Subject<ChatMessage>();

  readonly newOrder$ = this.newOrderSubject.asObservable();
  readonly orderStatus$ = this.orderStatusSubject.asObservable();
  readonly deliveryLocation$ = this.deliveryLocationSubject.asObservable();
  readonly deliveryAssigned$ = this.deliveryAssignedSubject.asObservable();
  readonly newReadyOrder$ = this.newReadyOrderSubject.asObservable();
  readonly message$ = this.messageSubject.asObservable();
  readonly connected = signal(false);
  readonly messages = signal<Record<string, ChatMessage[]>>({});
  readonly error = signal('');

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
  }

  joinOrder(orderId: string): void {
    const count = this.joinedOrderCounts.get(orderId) ?? 0;
    this.joinedOrderCounts.set(orderId, count + 1);
    if (count === 0) {
      this.socket?.emit('joinOrder', { orderId });
    }
  }

  leaveOrder(orderId: string): void {
    const count = this.joinedOrderCounts.get(orderId) ?? 0;
    if (count <= 1) {
      this.joinedOrderCounts.delete(orderId);
      this.socket?.emit('leaveOrder', { orderId });
      return;
    }
    this.joinedOrderCounts.set(orderId, count - 1);
  }

  getMessages(orderId: string): Observable<ChatMessage[]> {
    return this.http
      .get<ChatMessage[]>(this.api.url(`orders/${orderId}/messages`))
      .pipe(catchError(() => of([])));
  }

  getConversations(mode: ChatMode): Observable<ChatConversation[]> {
    const path =
      mode === 'admin'
        ? 'admin/chat/conversations'
        : mode === 'delivery'
          ? 'delivery/chat/conversations'
          : 'orders/conversations';
    return this.http
      .get<ChatConversation[]>(this.api.url(path))
      .pipe(catchError(() => of([])));
  }

  markConversationRead(
    orderId: string,
    mode: ChatMode,
  ): Observable<{ read: number }> {
    const path =
      mode === 'admin'
        ? `admin/chat/orders/${orderId}/read`
        : mode === 'delivery'
          ? `delivery/chat/orders/${orderId}/read`
          : `orders/${orderId}/messages/read`;
    return this.http
      .post<{ read: number }>(this.api.url(path), {})
      .pipe(catchError(() => of({ read: 0 })));
  }

  getAdminMessages(orderId: string): Observable<ChatMessage[]> {
    return this.http
      .get<ChatMessage[]>(this.api.url(`admin/orders/${orderId}/messages`))
      .pipe(catchError(() => of([])));
  }

  sendMessage(
    orderId: string,
    body: string,
    attachments: ChatAttachment[] = [],
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      this.api.url(`orders/${orderId}/messages`),
      { body, attachments },
    );
  }

  sendAdminMessage(
    orderId: string,
    body: string,
    attachments: ChatAttachment[] = [],
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      this.api.url(`admin/orders/${orderId}/messages`),
      { body, attachments },
    );
  }

  getDeliveryMessages(orderId: string): Observable<ChatMessage[]> {
    return this.http
      .get<ChatMessage[]>(this.api.url(`delivery/orders/${orderId}/messages`))
      .pipe(catchError(() => of([])));
  }

  sendDeliveryMessage(
    orderId: string,
    body: string,
    attachments: ChatAttachment[] = [],
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      this.api.url(`delivery/orders/${orderId}/messages`),
      { body, attachments },
    );
  }

  messagesFor(orderId: string): ChatMessage[] {
    return this.messages()[orderId] ?? [];
  }

  setMessages(orderId: string, messages: ChatMessage[]): void {
    this.messages.update((current) => ({ ...current, [orderId]: messages }));
  }

  upsertMessage(message: ChatMessage): void {
    let added = false;
    this.messages.update((current) => {
      const list = current[message.orderId] ?? [];
      if (list.some((item) => item.id === message.id)) return current;
      added = true;
      return { ...current, [message.orderId]: [...list, message] };
    });
    if (added) this.messageSubject.next(message);
  }

  private connect(token: string): void {
    if (this.socket) return;
    const base = environment.socketUrl || window.location.origin;
    this.socket = io(`${base}/chat`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      this.joinedOrderCounts.forEach((_count, orderId) =>
        this.socket?.emit('joinOrder', { orderId }),
      );
    });
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on(
      'history',
      (payload: { orderId: string; messages: ChatMessage[] }) => {
        this.setMessages(payload.orderId, payload.messages ?? []);
      },
    );
    this.socket.on('message', (message: ChatMessage) =>
      this.upsertMessage(message),
    );
    this.socket.on('chatError', (payload: { message: string }) =>
      this.error.set(payload.message),
    );
    this.socket.on('newOrder', (event: NewOrderEvent) =>
      this.newOrderSubject.next(event),
    );
    this.socket.on('orderStatus', (event: OrderStatusEvent) =>
      this.orderStatusSubject.next(event),
    );
    this.socket.on('deliveryLocation', (event: DeliveryLocationEvent) =>
      this.deliveryLocationSubject.next(event),
    );
    this.socket.on('deliveryAssigned', (event: DeliveryAssignedEvent) =>
      this.deliveryAssignedSubject.next(event),
    );
    this.socket.on('newReadyOrder', (event: NewOrderEvent) =>
      this.newReadyOrderSubject.next(event),
    );
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
