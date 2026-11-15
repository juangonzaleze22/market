import { Component } from '@angular/core';
import { ChatWidget } from '../../shared/ui/chat-widget';

@Component({
  selector: 'app-messages',
  imports: [ChatWidget],
  template: `
    <section class="messages-page" data-testid="messages-page">
      <header class="messages-head">
        <h1 class="text-display-md font-bold">Mensajes</h1>
        <p class="text-body-sm text-body">Consultas y conversaciones por pedido</p>
      </header>
      <app-chat-widget class="messages-panel" [variant]="'page'" />
    </section>
  `,
  styles: `
    .messages-page {
      max-width: 720px;
      margin: 0 auto;
      padding: var(--spacing-2xl) var(--spacing-lg);
    }

    .messages-head {
      margin-bottom: var(--spacing-lg);
    }

    .messages-panel {
      display: block;
      height: calc(100dvh - 320px);
      min-height: 400px;
    }

    @media (min-width: 768px) {
      .messages-page {
        padding: var(--spacing-3xl) var(--spacing-lg);
      }

      .messages-panel {
        height: calc(100dvh - 280px);
      }
    }
  `,
})
export class Messages {}
