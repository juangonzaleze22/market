import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatWidgetService {
  private readonly requestedOrder = signal<string | null>(null);

  readonly requestedOrderId = this.requestedOrder.asReadonly();

  openConversation(orderId: string): void {
    this.requestedOrder.set(orderId);
  }

  clear(orderId?: string): void {
    if (orderId && this.requestedOrder() !== orderId) return;
    this.requestedOrder.set(null);
  }
}
