import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed bottom-0 left-0 right-0 bg-canvas border-t border-surface-pressed z-50 md:hidden"
      data-testid="bottom-nav"
    >
      <div class="flex items-center justify-around py-sm">
        <a
          routerLink="/"
          routerLinkActive="text-primary"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center gap-xs p-sm text-mute"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="text-caption">Inicio</span>
        </a>
        <a
          routerLink="/shop"
          routerLinkActive="text-primary"
          class="flex flex-col items-center gap-xs p-sm text-mute"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <span class="text-caption">Buscar</span>
        </a>
        <button
          type="button"
          (click)="cart.openDrawer()"
          class="flex flex-col items-center gap-xs p-sm text-mute"
          data-testid="bottom-cart-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
            <circle cx="8" cy="21" r="1"/>
            <circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          <span class="text-caption">Carrito</span>
        </button>
        <a
          routerLink="/orders"
          routerLinkActive="text-primary"
          class="flex flex-col items-center gap-xs p-sm text-mute"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="text-caption">Perfil</span>
        </a>
      </div>
    </nav>
  `,
})
export class BottomNav {
  readonly cart = inject(CartService);
}
