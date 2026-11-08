import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { CartService } from '../../core/services/cart.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { ModalComponent } from './modal';

@Component({
  selector: 'app-auth-modal',
  imports: [FormsModule, RouterLink, ModalComponent],
  template: `
    <app-modal
      [open]="modal.open()"
      [title]="modal.view() === 'login' ? 'Ingresar' : 'Crear cuenta'"
      size="form"
      testId="auth-modal"
      (closed)="closeModal()"
    >
      @if (modal.view() === 'login') {
        <!-- LOGIN -->
        <div class="auth-modal-content">
          <a routerLink="/" class="auth-logo" data-testid="auth-logo" aria-label="Ir al inicio" (click)="modal.close()">
            <span class="auth-logo-mark">
              <img src="/assets/icons/logo.png" alt="" class="w-6 h-6 object-contain" />
            </span>
            <span class="auth-logo-text">Market<span class="auth-logo-dot">.</span></span>
          </a>
          <h2 class="text-display-md font-bold mt-2xl">Bienvenido de nuevo</h2>
          <p class="text-body-md text-body mt-sm">
            Ingresa tus datos para acceder a tu cuenta.
          </p>
          <form class="auth-fields" (ngSubmit)="login()">
            <div class="form-field">
              <label for="auth-login-email" class="field-label">
                Correo electrónico <span class="required">*</span>
              </label>
              <input
                id="auth-login-email"
                type="email"
                required
                [(ngModel)]="email"
                name="email"
                class="auth-input"
                placeholder="tucorreo@ejemplo.com"
                data-testid="auth-login-email"
              />
            </div>
            <div class="form-field">
              <label for="auth-login-password" class="field-label">
                Contraseña <span class="required">*</span>
              </label>
              <div class="auth-input-group">
                <input
                  id="auth-login-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  required
                  [(ngModel)]="password"
                  name="password"
                  class="auth-input"
                  placeholder="Tu contraseña"
                  data-testid="auth-login-password"
                />
                <button
                  type="button"
                  class="auth-input-toggle"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  (click)="showPassword.set(!showPassword())"
                  data-testid="auth-login-password-toggle"
                >
                  @if (showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </div>
            </div>
            <div class="auth-remember-row">
              <label class="auth-remember" for="auth-login-remember">
                <input
                  id="auth-login-remember"
                  type="checkbox"
                  [(ngModel)]="remember"
                  name="remember"
                  class="auth-checkbox"
                  data-testid="auth-login-remember"
                />
                Recordarme
              </label>
              <a
                routerLink="/forgot-password"
                class="link-blue text-body-sm font-medium"
                data-testid="auth-login-forgot"
                (click)="closeModal()"
                >¿Olvidaste tu contraseña?</a
              >
            </div>
            @if (error()) {
              <p class="auth-error" data-testid="auth-login-error">{{ error() }}</p>
            }
            @if (unverifiedEmail()) {
              <button
                type="button"
                class="btn-secondary w-full"
                [disabled]="resending()"
                (click)="resendVerification()"
                data-testid="auth-login-resend"
              >
                {{ resending() ? 'Enviando...' : 'Reenviar verificación' }}
              </button>
            }
            @if (resendInfo()) {
              <p class="text-body-sm text-body" data-testid="auth-resend-info">{{ resendInfo() }}</p>
            }
            <button type="submit" class="btn-primary w-full" data-testid="auth-login-submit">
              Ingresar
            </button>
          </form>
          <p class="auth-footnote text-body-md">
            ¿No tienes cuenta?
            <button type="button" class="link-blue font-medium" (click)="goToRegister()">Regístrate</button>
          </p>
        </div>
      } @else {
        <!-- REGISTER -->
        <div class="auth-modal-content">
          <a routerLink="/" class="auth-logo" data-testid="auth-logo" aria-label="Ir al inicio" (click)="modal.close()">
            <span class="auth-logo-mark">
              <img src="/assets/icons/logo.png" alt="" class="w-6 h-6 object-contain" />
            </span>
            <span class="auth-logo-text">Market<span class="auth-logo-dot">.</span></span>
          </a>
          @if (registerSuccess()) {
            <h2 class="text-display-md font-bold mt-2xl" data-testid="auth-register-success">
              Revisa tu correo
            </h2>
            <p class="text-body-md text-body mt-sm">
              Enviamos un enlace de verificación a
              <strong class="text-ink">{{ successEmail() }}</strong>. Ábrelo para
              activar tu cuenta.
            </p>
            <p class="form-hint mt-md">
              El enlace vence en 24 horas. Si no lo ves, revisa tu carpeta de
              spam.
            </p>
            @if (resendInfo()) {
              <p class="text-body-sm text-body mt-md" data-testid="auth-resend-info">
                {{ resendInfo() }}
              </p>
            }
            @if (error()) {
              <p class="auth-error mt-md" data-testid="auth-register-error">
                {{ error() }}
              </p>
            }
            <button
              type="button"
              class="btn-secondary w-full mt-xl"
              [disabled]="resending()"
              (click)="resendVerification()"
              data-testid="auth-resend-verification"
            >
              {{ resending() ? 'Enviando...' : 'Reenviar correo' }}
            </button>
            <button
              type="button"
              class="btn-primary w-full mt-md"
              (click)="goToLogin()"
              data-testid="auth-register-back-login"
            >
              Volver a ingresar
            </button>
          } @else {
          <h2 class="text-display-md font-bold mt-2xl">Crear cuenta</h2>
          <p class="text-body-md text-body mt-sm">
            Completa tus datos para empezar a comprar en Market.
          </p>
          <form class="auth-fields" (ngSubmit)="register()">
            <div class="form-row-2">
              <div class="form-field">
                <label for="auth-register-firstName" class="field-label">
                  Nombre <span class="required">*</span>
                </label>
                <input
                  id="auth-register-firstName"
                  type="text"
                  required
                  [(ngModel)]="firstName"
                  name="firstName"
                  class="auth-input"
                  placeholder="Tu nombre"
                  data-testid="auth-register-firstName"
                />
              </div>
              <div class="form-field">
                <label for="auth-register-lastName" class="field-label">
                  Apellido <span class="required">*</span>
                </label>
                <input
                  id="auth-register-lastName"
                  type="text"
                  required
                  [(ngModel)]="lastName"
                  name="lastName"
                  class="auth-input"
                  placeholder="Tu apellido"
                  data-testid="auth-register-lastName"
                />
              </div>
            </div>
            <div class="form-field">
              <label for="auth-register-email" class="field-label">
                Correo electrónico <span class="required">*</span>
              </label>
              <input
                id="auth-register-email"
                type="email"
                required
                [(ngModel)]="regEmail"
                name="email"
                class="auth-input"
                placeholder="tucorreo@ejemplo.com"
                data-testid="auth-register-email"
              />
            </div>
            <div class="form-field">
              <label for="auth-register-phone" class="field-label">
                Teléfono
              </label>
              <input
                id="auth-register-phone"
                type="tel"
                [value]="phone"
                (input)="onPhoneInput($event)"
                name="phone"
                class="auth-input"
                placeholder="0412-1234567"
                maxlength="14"
                data-testid="auth-register-phone"
              />
              <p class="text-caption text-body mt-xxs">Formato: 0412-1234567 o 0212-1234567</p>
            </div>
            <div class="form-field">
              <label for="auth-register-password" class="field-label">
                Contraseña <span class="required">*</span>
              </label>
              <div class="auth-input-group">
                <input
                  id="auth-register-password"
                  [type]="showRegPassword() ? 'text' : 'password'"
                  required
                  minlength="6"
                  [(ngModel)]="regPassword"
                  name="password"
                  class="auth-input"
                  placeholder="Mínimo 6 caracteres"
                  data-testid="auth-register-password"
                />
                <button
                  type="button"
                  class="auth-input-toggle"
                  [attr.aria-label]="showRegPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  (click)="showRegPassword.set(!showRegPassword())"
                  data-testid="auth-register-password-toggle"
                >
                  @if (showRegPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </div>
              <p class="form-hint mt-xxs">
                Mínimo 8 caracteres, con al menos una letra y un número.
              </p>
            </div>
            <div class="form-field">
              <label for="auth-register-confirmPassword" class="field-label">
                Confirmar contraseña <span class="required">*</span>
              </label>
              <div class="auth-input-group">
                <input
                  id="auth-register-confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  required
                  minlength="6"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  class="auth-input"
                  [class.input-error]="confirmPassword && confirmPassword !== regPassword"
                  placeholder="Repite tu contraseña"
                  data-testid="auth-register-confirmPassword"
                />
                <button
                  type="button"
                  class="auth-input-toggle"
                  [attr.aria-label]="showConfirmPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  data-testid="auth-register-confirmPassword-toggle"
                >
                  @if (showConfirmPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </div>
              @if (confirmPassword && confirmPassword !== regPassword) {
                <p class="form-error mt-xs">Las contraseñas no coinciden</p>
              }
            </div>
            @if (error()) {
              <p class="auth-error" data-testid="auth-register-error">{{ error() }}</p>
            }
            <button
              type="submit"
              class="btn-primary w-full"
              [disabled]="confirmPassword !== regPassword || !isPasswordValid()"
              data-testid="auth-register-submit"
            >
              Registrarme
            </button>
          </form>
          }
          <p class="auth-footnote text-body-md">
            ¿Ya tienes cuenta?
            <button type="button" class="link-blue font-medium" (click)="goToLogin()">Ingresa</button>
          </p>
        </div>
      }
    </app-modal>
  `,
  styles: `
    .auth-modal-content {
      max-width: 24rem;
      margin: 0 auto;
    }
  `,
})
export class AuthModalComponent {
  protected readonly modal = inject(AuthModalService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoriteService);
  private readonly router = inject(Router);

  // Login fields
  protected email = '';
  protected password = '';
  protected remember = true;
  protected readonly showPassword = signal(false);

  // Register fields
  protected firstName = '';
  protected lastName = '';
  protected regEmail = '';
  protected phone = '';
  protected regPassword = '';
  protected confirmPassword = '';
  protected readonly showRegPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly error = signal('');
  protected readonly registerSuccess = signal(false);
  protected readonly successEmail = signal('');
  protected readonly unverifiedEmail = signal<string | null>(null);
  protected readonly resendInfo = signal('');
  protected readonly resending = signal(false);

  protected goToRegister(): void {
    this.error.set('');
    this.registerSuccess.set(false);
    this.unverifiedEmail.set(null);
    this.resendInfo.set('');
    this.modal.switchView();
  }

  protected goToLogin(): void {
    this.error.set('');
    this.registerSuccess.set(false);
    this.unverifiedEmail.set(null);
    this.resendInfo.set('');
    this.modal.switchView();
  }

  protected closeModal(): void {
    this.registerSuccess.set(false);
    this.successEmail.set('');
    this.unverifiedEmail.set(null);
    this.resendInfo.set('');
    this.error.set('');
    this.modal.close();
  }

  protected isPasswordValid(): boolean {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(this.regPassword);
  }

  protected login(): void {
    this.error.set('');
    this.unverifiedEmail.set(null);
    this.resendInfo.set('');
    this.auth
      .login(
        { email: this.email.trim().toLowerCase(), password: this.password },
        this.remember,
      )
      .subscribe({
        next: () => {
          this.cart.mergeGuest();
          this.favorites.load();
          const redirect = this.modal.redirect();
          this.modal.close();
          this.router.navigate([redirect || this.auth.homeRoute()]);
          this.resetLogin();
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 403 && err.error?.code === 'EMAIL_NOT_VERIFIED') {
            this.unverifiedEmail.set(this.email.trim().toLowerCase());
            this.error.set(
              'Debes verificar tu correo antes de ingresar. Revisa tu bandeja o reenvía el enlace.',
            );
            return;
          }
          this.error.set(
            this.errorMessage(err, 'Correo o contraseña incorrectos.'),
          );
        },
      });
  }

  protected register(): void {
    this.error.set('');
    if (this.regPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    if (!this.isPasswordValid()) {
      this.error.set(
        'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
      );
      return;
    }

    const email = this.regEmail.trim().toLowerCase();
    this.auth
      .register({
        email,
        password: this.regPassword,
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        phone: this.phone || undefined,
      })
      .subscribe({
        next: (res) => {
          this.successEmail.set(email);
          this.registerSuccess.set(true);
          this.resendInfo.set(
            res.devVerificationToken
              ? 'Modo desarrollo: el enlace de verificación también aparece en la consola del backend.'
              : '',
          );
          this.error.set('');
          this.clearRegisterFields();
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(
            this.errorMessage(err, 'No se pudo crear la cuenta. Intenta de nuevo.'),
          ),
      });
  }

  protected resendVerification(): void {
    const email = this.unverifiedEmail() ?? this.successEmail();
    if (!email || this.resending()) return;

    this.resending.set(true);
    this.error.set('');
    this.resendInfo.set('');
    this.auth.resendVerification(email).subscribe({
      next: (res) => {
        this.resending.set(false);
        this.resendInfo.set(res.message);
      },
      error: (err: HttpErrorResponse) => {
        this.resending.set(false);
        this.error.set(
          this.errorMessage(err, 'No se pudo reenviar el correo. Intenta de nuevo.'),
        );
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    const httpError = error as HttpErrorResponse;
    if (httpError?.status === 429) {
      const message = httpError.error?.message;
      return typeof message === 'string'
        ? message
        : 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.';
    }
    if (httpError?.status === 0) {
      return 'No se pudo conectar con el servidor. Intenta de nuevo.';
    }
    const message = httpError?.error?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string' && message.trim()) return message;
    return fallback;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 0 && !value.startsWith('0')) {
      value = '0' + value;
    }
    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4, 11);
    }
    this.phone = value;
    input.value = value;
  }

  private resetLogin(): void {
    this.email = '';
    this.password = '';
    this.remember = true;
    this.showPassword.set(false);
    this.error.set('');
    this.unverifiedEmail.set(null);
    this.resendInfo.set('');
  }

  private clearRegisterFields(): void {
    this.firstName = '';
    this.lastName = '';
    this.regEmail = '';
    this.phone = '';
    this.regPassword = '';
    this.confirmPassword = '';
    this.showRegPassword.set(false);
    this.showConfirmPassword.set(false);
  }
}
