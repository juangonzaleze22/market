import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthModalService } from '../../core/services/auth-modal.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="bg-primary text-on-dark mt-3xl" data-testid="footer">
      <div class="container-max py-3xl">
        <div class="flex flex-col md:flex-row gap-3xl">
          <!-- Brand column — wider and takes remaining space -->
          <div class="flex-1 flex flex-col gap-md min-w-0">
            <p class="text-display-sm font-bold">Tu Mercadito</p>
            <p class="text-body-sm opacity-80 leading-relaxed" style="max-width: 420px;">
              Tu tienda en línea con lo esencial para cada día. Calidad, simplicidad y buen precio.
            </p>
            <!-- Social media links -->
            <div class="flex items-center gap-md mt-sm">
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="5"/>
                  <circle cx="17.5" cy="6.5" r="1.5"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener" aria-label="TikTok" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.65a8.17 8.17 0 0 0 3.76.92V6.12a4.82 4.82 0 0 1-.01.57z"/>
                </svg>
              </a>
            </div>
          </div>
          <!-- Navigation -->
          <div class="flex flex-col gap-md min-w-[140px]">
            <p class="text-body-md-strong">Navegación</p>
            <div class="flex flex-col gap-sm">
              <a routerLink="/" class="text-body-sm opacity-80 hover:opacity-100 w-fit">Home</a>
              <a routerLink="/shop" class="text-body-sm opacity-80 hover:opacity-100 w-fit">Tienda</a>
              <a routerLink="/about" class="text-body-sm opacity-80 hover:opacity-100 w-fit">Quiénes somos</a>
              <a routerLink="/cart" class="text-body-sm opacity-80 hover:opacity-100 w-fit">Carrito</a>
              <a routerLink="/orders" class="text-body-sm opacity-80 hover:opacity-100 w-fit">Mis Pedidos</a>
            </div>
          </div>
          <!-- Help -->
          <div class="flex flex-col gap-md min-w-[140px]">
            <p class="text-body-md-strong">Ayuda</p>
            <div class="flex flex-col gap-sm">
              <button type="button" class="text-body-sm opacity-80 hover:opacity-100 w-fit text-left" (click)="authModal.openLogin()">Iniciar sesión</button>
              <button type="button" class="text-body-sm opacity-80 hover:opacity-100 w-fit text-left" (click)="authModal.openRegister()">Crear cuenta</button>
            </div>
          </div>
        </div>
      </div>
      <div class="border-t border-white/20">
        <div class="container-max py-lg flex items-center justify-between text-caption opacity-80">
          <p>© 2026 Tu Mercadito. Todos los derechos reservados.</p>
          <p>Hecho con Angular y NestJS</p>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  readonly authModal = inject(AuthModalService);
}
