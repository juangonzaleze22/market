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
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ChatAttachment, ChatMessage, ChatService } from '../../core/services/chat.service';
import { UploadService } from '../../core/services/upload.service';

@Component({
  selector: 'app-order-chat',
  imports: [DatePipe],
  template: `
    <div class="order-chat" data-testid="chat-panel">
      <div class="order-chat-header">
        <h3 class="text-body-sm-strong" data-testid="chat-title">
          {{ mode() === 'customer' ? 'Chat con la tienda' : 'Chat con el cliente' }}
        </h3>
        <span class="order-chat-status" [class.online]="chat.connected() && !closed()">
          {{ closed() ? 'Chat cerrado' : chat.connected() ? 'En línea' : 'Sin conexión' }}
        </span>
      </div>

      <div class="order-chat-messages" data-testid="chat-messages">
        @if (messages().length === 0) {
          <p class="order-chat-empty" data-testid="chat-empty">
            Todavía no hay mensajes. Escribí tu primera consulta.
          </p>
        } @else {
          @for (message of messages(); track message.id) {
            @if (message.senderRole === 'system') {
              <div class="order-chat-system" data-testid="chat-message-system">
                {{ message.body }}
              </div>
            } @else {
              <div
                class="order-chat-row"
                [class.own]="isOwn(message)"
                data-testid="chat-message"
                [attr.data-role]="message.senderRole"
              >
                <div class="order-chat-bubble" data-testid="chat-bubble">
                  @if (message.body) {
                    <p class="order-chat-text">{{ message.body }}</p>
                  }
                  @for (file of message.attachments; track file.url) {
                    <a
                      class="order-chat-attachment"
                      [href]="file.url"
                      target="_blank"
                      rel="noopener"
                      data-testid="chat-attachment"
                    >
                      @if (isImage(file)) {
                        <img
                          [src]="file.url"
                          [alt]="file.name"
                          class="order-chat-image"
                          loading="lazy"
                          decoding="async"
                        />
                      } @else {
                        <span class="order-chat-file">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                            ></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          {{ file.name }}
                        </span>
                      }
                    </a>
                  }
                  <span class="order-chat-time">{{ message.createdAt | date: 'dd/MM HH:mm' }}</span>
                </div>
              </div>
            }
          }
        }
      </div>

      @if (pending().length > 0) {
        <div class="order-chat-pending" data-testid="chat-pending">
          @for (file of pending(); track file.url; let i = $index) {
            <span class="order-chat-chip">
              {{ file.name }}
              <button
                type="button"
                (click)="removePending(i)"
                aria-label="Quitar adjunto"
                data-testid="chat-remove-attachment"
              >
                ×
              </button>
            </span>
          }
        </div>
      }

      @if (localError() || chat.error()) {
        <p class="form-error" data-testid="chat-error">
          {{ localError() || chat.error() }}
        </p>
      }

      @if (closed()) {
        <p class="order-chat-closed" data-testid="chat-closed">
          {{ closedMessage() }}
        </p>
      } @else {
        <div class="order-chat-composer">
          <button
            type="button"
            class="order-chat-attach-btn"
            [disabled]="uploading() || sending()"
            (click)="fileInput.click()"
            aria-label="Adjuntar archivo"
            data-testid="chat-attach"
          >
            @if (uploading()) {
              <span class="btn-spinner"></span>
            } @else {
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                ></path>
              </svg>
            }
          </button>
          <input
            #fileInput
            type="file"
            class="hidden"
            multiple
            accept="image/*,application/pdf"
            (change)="onFilesSelected($event)"
            data-testid="chat-file-input"
          />
          <input
            type="text"
            class="order-chat-input"
            placeholder="Escribí un mensaje..."
            [value]="draft()"
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
            [disabled]="sending()"
            data-testid="chat-input"
          />
          <button
            type="button"
            class="order-chat-send"
            [disabled]="sending() || (!draft().trim() && pending().length === 0)"
            (click)="send()"
            data-testid="chat-send"
          >
            @if (sending()) {
              <span class="btn-spinner"></span>
            } @else {
              Enviar
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .order-chat {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border: 1px solid var(--color-surface-pressed);
      border-radius: 12px;
      padding: 16px;
      background-color: var(--color-canvas);
    }

    .order-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .order-chat-status {
      font-size: 11px;
      color: var(--color-mute);
    }

    .order-chat-status.online {
      color: var(--color-accent);
    }

    .order-chat-messages {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .order-chat-empty {
      font-size: 13px;
      color: var(--color-body);
      text-align: center;
      padding: 16px 0;
    }

    .order-chat-closed {
      margin: 0;
      padding: 10px 14px;
      border-radius: 12px;
      background-color: var(--color-canvas-softer);
      font-size: 12px;
      line-height: 18px;
      color: var(--color-body);
      text-align: center;
    }

    .order-chat-system {
      align-self: center;
      max-width: 90%;
      text-align: center;
      font-size: 12px;
      line-height: 18px;
      color: var(--color-body);
      background-color: var(--color-canvas-softer);
      border-radius: 12px;
      padding: 8px 12px;
    }

    .order-chat-row {
      display: flex;
      justify-content: flex-start;
    }

    .order-chat-row.own {
      justify-content: flex-end;
    }

    .order-chat-bubble {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 78%;
      padding: 8px 12px;
      border-radius: 14px;
      background-color: var(--color-canvas-soft);
      color: var(--color-ink);
    }

    .order-chat-row.own .order-chat-bubble {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .order-chat-text {
      font-size: 13px;
      line-height: 19px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .order-chat-attachment {
      display: block;
      text-decoration: none;
      color: inherit;
    }

    .order-chat-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 10px;
      object-fit: cover;
    }

    .order-chat-file {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      text-decoration: underline;
    }

    .order-chat-time {
      align-self: flex-end;
      font-size: 10px;
      opacity: 0.6;
    }

    .order-chat-pending {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .order-chat-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      background-color: var(--color-canvas-soft);
      border: 1px solid var(--color-surface-pressed);
    }

    .order-chat-chip button {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      color: var(--color-body);
    }

    .order-chat-composer {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .order-chat-attach-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      border-radius: 999px;
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      color: var(--color-body);
      cursor: pointer;
    }

    .order-chat-attach-btn:hover:not(:disabled) {
      background-color: var(--color-canvas-soft);
    }

    .order-chat-input {
      flex: 1;
      min-width: 0;
      height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas-soft);
      font-size: 13px;
      color: var(--color-ink);
      outline: none;
    }

    .order-chat-input:focus {
      border-color: var(--color-primary);
    }

    .order-chat-send {
      height: 38px;
      padding: 0 18px;
      flex-shrink: 0;
      border-radius: 999px;
      border: none;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .order-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class OrderChat {
  readonly orderId = input.required<string>();
  readonly orderStatus = input<string>('');
  readonly mode = input<'customer' | 'admin' | 'delivery'>('customer');

  private readonly upload = inject(UploadService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly chat = inject(ChatService);

  protected readonly draft = signal('');
  protected readonly pending = signal<ChatAttachment[]>([]);
  protected readonly sending = signal(false);
  protected readonly uploading = signal(false);
  protected readonly localError = signal('');

  private readonly liveStatus = signal<string | null>(null);

  protected readonly messages = computed(() => this.chat.messages()[this.orderId()] ?? []);
  protected readonly effectiveStatus = computed(
    () => this.liveStatus() ?? this.orderStatus(),
  );
  protected readonly closed = computed(() =>
    ['delivered', 'cancelled', 'rejected'].includes(
      this.effectiveStatus().toLowerCase(),
    ),
  );
  protected readonly closedMessage = computed(() => {
    const status = this.effectiveStatus().toLowerCase();
    if (status === 'cancelled' || status === 'rejected') {
      return 'Este pedido fue cancelado. El chat está cerrado.';
    }
    return 'El pedido fue entregado. El chat está cerrado.';
  });

  constructor() {
    this.chat.orderStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.orderId === this.orderId()) {
          this.liveStatus.set(event.status);
        }
      });

    effect((onCleanup) => {
      const id = this.orderId();
      if (!id) return;
      this.load(id);
      this.chat.joinOrder(id);
      onCleanup(() => this.chat.leaveOrder(id));
    });
  }

  protected isOwn(message: ChatMessage): boolean {
    return message.senderRole === this.mode();
  }

  protected isImage(file: ChatAttachment): boolean {
    return file.type?.startsWith('image/');
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    this.uploading.set(true);
    this.localError.set('');
    try {
      for (const file of files) {
        const res = await firstValueFrom(this.upload.uploadImage('chat', file));
        this.pending.update((list) => [
          ...list,
          {
            url: res.url,
            name: res.filename ?? file.name,
            type: res.mimeType,
            size: res.size,
          },
        ]);
      }
    } catch {
      this.localError.set('No se pudo subir el archivo');
    } finally {
      this.uploading.set(false);
    }
  }

  protected removePending(index: number): void {
    this.pending.update((list) => list.filter((_, i) => i !== index));
  }

  protected send(): void {
    if (this.closed()) return;
    const body = this.draft().trim();
    const attachments = this.pending();
    if (!body && attachments.length === 0) return;

    const id = this.orderId();
    const mode = this.mode();
    const request$ =
      mode === 'admin'
        ? this.chat.sendAdminMessage(id, body, attachments)
        : mode === 'delivery'
          ? this.chat.sendDeliveryMessage(id, body, attachments)
          : this.chat.sendMessage(id, body, attachments);

    this.sending.set(true);
    this.localError.set('');
    request$.subscribe({
      next: (message) => {
        this.chat.upsertMessage(message);
        this.draft.set('');
        this.pending.set([]);
        this.sending.set(false);
      },
      error: (err) => {
        const raw = err?.error?.message;
        this.localError.set(
          Array.isArray(raw) ? raw.join(', ') : (raw ?? 'No se pudo enviar el mensaje'),
        );
        this.sending.set(false);
      },
    });
  }

  private load(id: string): void {
    const mode = this.mode();
    const request$ =
      mode === 'admin'
        ? this.chat.getAdminMessages(id)
        : mode === 'delivery'
          ? this.chat.getDeliveryMessages(id)
          : this.chat.getMessages(id);
    request$.subscribe((messages) => this.chat.setMessages(id, messages));
  }
}
