import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="py-3xl max-w-[28rem] mx-auto px-lg" data-testid="forgot-password-page">
      <div class="card-content border border-surface-pressed">
        <h1 class="text-display-md font-bold mb-sm">Recuperar contraseña</h1>
        <p class="text-body-md text-body mb-xl">
          Escribe tu correo y te enviaremos un enlace para restablecer tu
          contraseña.
        </p>

        @if (sent()) {
          <p class="text-body-md text-body mb-xl" data-testid="forgot-password-status">
            Si el correo está registrado, recibirás instrucciones en unos
            minutos. Revisa también tu carpeta de spam.
          </p>
          <a routerLink="/" class="btn-secondary inline-flex">Volver al inicio</a>
        } @else {
          <form (ngSubmit)="submit()" class="flex flex-col gap-lg">
            <div class="form-field">
              <label for="forgot-email" class="form-label">Correo electrónico</label>
              <input
                id="forgot-email"
                type="email"
                required
                [(ngModel)]="email"
                name="email"
                class="form-input"
                placeholder="tucorreo@ejemplo.com"
                autocomplete="email"
                data-testid="forgot-password-email"
              />
            </div>
            @if (error()) {
              <p class="form-error" data-testid="forgot-password-error">{{ error() }}</p>
            }
            <button
              type="submit"
              class="btn-primary w-full"
              [disabled]="submitting()"
              data-testid="forgot-password-submit"
            >
              {{ submitting() ? 'Enviando...' : 'Enviar enlace' }}
            </button>
          </form>
          <p class="text-body-sm text-body mt-lg text-center">
            <a routerLink="/" class="link-blue font-medium">Volver al inicio</a>
          </p>
        }
      </div>
    </section>
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);

  protected email = '';
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    if (!this.email.trim() || this.submitting()) return;

    this.submitting.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email.trim().toLowerCase()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(
          error.status === 429
            ? 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.'
            : 'No se pudo procesar la solicitud. Intenta de nuevo.',
        );
      },
    });
  }
}
