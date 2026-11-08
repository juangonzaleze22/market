import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  OrderService,
  Order,
  UserProfile,
  UserStats,
} from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { OrderStatusBadge } from '../../shared/ui/order-status-badge';

@Component({
  selector: 'app-user-dashboard',
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule, OrderStatusBadge],
  template: `
    <section class="py-3xl max-w-[72rem] mx-auto px-lg" data-testid="user-dashboard">
      @if (!auth.isAuthed()) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Iniciá sesión para ver tu perfil</p>
          <button type="button" class="btn-primary" (click)="authModal.openLogin()">Iniciar sesión</button>
        </div>
      } @else if (loading()) {
        <div class="space-y-xl">
          <div class="h-32 bg-canvas-softer rounded-xl animate-pulse"></div>
          <div class="grid grid-cols-4 gap-lg">
            <div class="h-24 bg-canvas-softer rounded-xl animate-pulse"></div>
            <div class="h-24 bg-canvas-softer rounded-xl animate-pulse"></div>
            <div class="h-24 bg-canvas-softer rounded-xl animate-pulse"></div>
            <div class="h-24 bg-canvas-softer rounded-xl animate-pulse"></div>
          </div>
          <div class="h-64 bg-canvas-softer rounded-xl animate-pulse"></div>
        </div>
      } @else {
        @if (auth.user()?.emailVerified === false) {
          <div
            class="bg-canvas-soft rounded-xl border border-surface-pressed p-xl mb-xl flex items-center justify-between gap-lg flex-wrap"
            data-testid="account-verify-banner"
          >
            <div>
              <p class="text-body-md text-body">
                Tu correo aún no está verificado. Revisa tu bandeja o reenvía el
                enlace.
              </p>
              @if (resendMessage()) {
                <p class="text-body-sm text-body mt-xxs" data-testid="account-verify-message">
                  {{ resendMessage() }}
                </p>
              }
            </div>
            <button
              type="button"
              class="btn-secondary"
              [disabled]="resending()"
              (click)="resendVerification()"
              data-testid="account-verify-resend"
            >
              {{ resending() ? 'Enviando...' : 'Reenviar verificación' }}
            </button>
          </div>
        }

        <!-- Profile Header -->
        <div class="bg-canvas rounded-xl border border-surface-pressed p-2xl mb-xl" data-testid="profile-header">
          <div class="flex items-center justify-between gap-xl flex-wrap">
            <div class="flex items-center gap-xl">
              <div class="w-16 h-16 rounded-full bg-canvas-softer flex items-center justify-center flex-shrink-0">
                <span class="text-display-md font-bold text-primary">
                  {{ profile()?.firstName?.charAt(0) }}{{ profile()?.lastName?.charAt(0) }}
                </span>
              </div>
              <div>
                <h1 class="text-display-md font-bold">
                  {{ profile()?.firstName }} {{ profile()?.lastName }}
                </h1>
                <p class="text-body text-body">{{ profile()?.email }}</p>
                @if (profile()?.phone) {
                  <p class="text-caption text-mute">{{ profile()?.phone }}</p>
                }
              </div>
            </div>
            <a routerLink="/account/addresses" class="btn-secondary inline-flex items-center gap-sm" data-testid="dashboard-addresses-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Gestionar direcciones
            </a>
          </div>
        </div>

        <!-- Security -->
        <div class="bg-canvas rounded-xl border border-surface-pressed p-2xl mb-xl" data-testid="account-security">
          <div class="flex items-center justify-between gap-lg flex-wrap">
            <div>
              <h2 class="text-body-lg font-bold">Seguridad</h2>
              <p class="text-body-sm text-body mt-xxs">
                Actualiza tu contraseña periódicamente.
              </p>
            </div>
            <button
              type="button"
              class="btn-secondary"
              (click)="togglePasswordForm()"
              data-testid="account-change-password-toggle"
            >
              {{ showPasswordForm() ? 'Cancelar' : 'Cambiar contraseña' }}
            </button>
          </div>

          @if (showPasswordForm()) {
            <form
              class="mt-xl grid gap-lg sm:grid-cols-3"
              (ngSubmit)="changePassword()"
            >
              <div class="form-field">
                <label for="account-current-password" class="form-label">
                  Contraseña actual
                </label>
                <input
                  id="account-current-password"
                  type="password"
                  required
                  [(ngModel)]="currentPassword"
                  name="currentPassword"
                  class="form-input"
                  autocomplete="current-password"
                  data-testid="account-current-password"
                />
              </div>
              <div class="form-field">
                <label for="account-new-password" class="form-label">
                  Contraseña nueva
                </label>
                <input
                  id="account-new-password"
                  type="password"
                  required
                  minlength="8"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  class="form-input"
                  autocomplete="new-password"
                  data-testid="account-new-password"
                />
              </div>
              <div class="form-field">
                <label for="account-confirm-password" class="form-label">
                  Confirmar contraseña
                </label>
                <input
                  id="account-confirm-password"
                  type="password"
                  required
                  minlength="8"
                  [(ngModel)]="confirmNewPassword"
                  name="confirmNewPassword"
                  class="form-input"
                  autocomplete="new-password"
                  data-testid="account-confirm-password"
                />
              </div>
              <p class="form-hint sm:col-span-3 -mt-sm">
                Mínimo 8 caracteres, con al menos una letra y un número.
              </p>
              @if (passwordError()) {
                <p
                  class="form-error sm:col-span-3"
                  data-testid="account-password-error"
                >
                  {{ passwordError() }}
                </p>
              }
              <div class="sm:col-span-3">
                <button
                  type="submit"
                  class="btn-primary"
                  [disabled]="passwordSubmitting() || !isNewPasswordValid()"
                  data-testid="account-change-password-submit"
                >
                  {{ passwordSubmitting() ? 'Guardando...' : 'Guardar contraseña' }}
                </button>
              </div>
            </form>
          }
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-lg mb-xl" data-testid="stats-grid">
          <div class="bg-canvas rounded-xl border border-surface-pressed p-xl text-center">
            <p class="text-body-2xl font-bold text-ink" data-testid="stat-total-orders">
              {{ stats()?.totalOrders }}
            </p>
            <p class="text-caption text-body">Total Pedidos</p>
          </div>
          <div class="bg-canvas rounded-xl border border-surface-pressed p-xl text-center">
            <p class="text-body-2xl font-bold text-primary" data-testid="stat-total-spent">
              {{ '$' + (stats()?.totalSpent || 0 | number:'1.2-2') }}
            </p>
            <p class="text-caption text-body">Total Gastado</p>
          </div>
          <div class="bg-canvas rounded-xl border border-surface-pressed p-xl text-center">
            <p class="text-body-2xl font-bold text-accent" data-testid="stat-pending">
              {{ stats()?.pendingOrders }}
            </p>
            <p class="text-caption text-body">Pendientes</p>
          </div>
          <div class="bg-canvas rounded-xl border border-surface-pressed p-xl text-center">
            <p class="text-body-2xl font-bold" style="color: #22c55e" data-testid="stat-delivered">
              {{ stats()?.deliveredOrders }}
            </p>
            <p class="text-caption text-body">Entregados</p>
          </div>
        </div>

        <!-- Orders List -->
        <div class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden" data-testid="orders-section">
          <div class="px-2xl py-xl border-b border-surface-pressed flex justify-between items-center">
            <h2 class="text-body-lg font-bold">Mis Pedidos</h2>
            <a routerLink="/orders" class="text-body-sm text-primary font-medium hover:underline">
              Ver todos →
            </a>
          </div>

          @if (orders().length === 0) {
            <div class="p-3xl text-center">
              <p class="text-body text-body mb-lg">Aún no tenés pedidos</p>
              <a routerLink="/shop" class="btn-primary">Ir a la tienda</a>
            </div>
          } @else {
            <div>
              @for (order of orders(); track order.id; let i = $index) {
                <a
                  [routerLink]="['/account/order', order.id]"
                  class="flex items-center justify-between px-2xl py-xl hover:bg-canvas-softer transition-colors cursor-pointer"
                  [class.border-b]="i < orders().length - 1"
                  [style.border-bottom]="i < orders().length - 1 ? '1px solid var(--color-surface-pressed)' : 'none'"
                  data-testid="order-row"
                >
                  <div class="flex items-center gap-lg">
                    <div class="w-10 h-10 rounded-lg bg-canvas-softer flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-mute">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 01-8 0"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="text-body-sm-strong">{{ order.orderNumber }}</p>
                      <p class="text-caption text-mute">{{ order.createdAt | date:'dd/MM/yyyy' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-lg">
                    <app-order-status [status]="order.status" size="md" />
                    <p class="text-body-sm-strong" data-testid="order-total">
                      {{ '$' + (order.totalAmount | number:'1.2-2') }}
                    </p>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-mute">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .text-primary {
      color: var(--color-primary);
    }
  `,
})
export class UserDashboard implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);

  readonly profile = signal<UserProfile | null>(null);
  readonly stats = signal<UserStats | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);

  readonly resending = signal(false);
  readonly resendMessage = signal('');
  readonly showPasswordForm = signal(false);
  readonly passwordSubmitting = signal(false);
  readonly passwordError = signal('');
  protected currentPassword = '';
  protected newPassword = '';
  protected confirmNewPassword = '';

  protected togglePasswordForm(): void {
    this.showPasswordForm.set(!this.showPasswordForm());
    this.passwordError.set('');
    this.clearPasswordForm();
  }

  protected isNewPasswordValid(): boolean {
    return (
      this.newPassword === this.confirmNewPassword &&
      /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(this.newPassword)
    );
  }

  protected resendVerification(): void {
    const email = this.auth.user()?.email;
    if (!email || this.resending()) return;

    this.resending.set(true);
    this.resendMessage.set('');
    this.auth.resendVerification(email).subscribe({
      next: (res) => {
        this.resending.set(false);
        this.resendMessage.set(res.message);
      },
      error: (error: HttpErrorResponse) => {
        this.resending.set(false);
        this.resendMessage.set(
          error.status === 429
            ? 'Demasiadas solicitudes. Espera unos minutos.'
            : 'No se pudo reenviar el correo. Intenta de nuevo.',
        );
      },
    });
  }

  protected changePassword(): void {
    this.passwordError.set('');
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set('Las contraseñas no coinciden.');
      return;
    }
    if (!this.isNewPasswordValid()) {
      this.passwordError.set(
        'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
      );
      return;
    }

    this.passwordSubmitting.set(true);
    this.auth
      .changePassword(this.currentPassword, this.newPassword)
      .subscribe({
        next: () => {
          this.passwordSubmitting.set(false);
          this.showPasswordForm.set(false);
          this.clearPasswordForm();
          this.auth.clearSession();
          this.router.navigate(['/']);
          this.authModal.openLogin();
        },
        error: (error: HttpErrorResponse) => {
          this.passwordSubmitting.set(false);
          const message = error.error?.message;
          this.passwordError.set(
            error.status === 429
              ? 'Demasiadas solicitudes. Espera unos minutos.'
              : typeof message === 'string'
                ? message
                : 'No se pudo cambiar la contraseña. Intenta de nuevo.',
          );
        },
      });
  }

  private clearPasswordForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
  }

  ngOnInit(): void {
    if (!this.auth.isAuthed()) {
      this.loading.set(false);
      return;
    }

    this.loadData();
  }

  private loadData(): void {
    this.orderService.getProfile().subscribe({
      next: (profile) => this.profile.set(profile),
    });

    this.orderService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
    });

    this.orderService.getMine().subscribe({
      next: (orders) => {
        this.orders.set(orders.slice(0, 5));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
