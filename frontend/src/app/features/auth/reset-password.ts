import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="py-3xl max-w-[28rem] mx-auto px-lg" data-testid="reset-password-page">
      <div class="card-content border border-surface-pressed">
        <h1 class="text-display-md font-bold mb-sm">Nueva contraseña</h1>

        @if (!token) {
          <p class="form-error mb-xl" data-testid="reset-password-error">
            El enlace no incluye un token válido. Solicita uno nuevo.
          </p>
          <a routerLink="/forgot-password" class="btn-secondary inline-flex">
            Solicitar enlace
          </a>
        } @else if (done()) {
          <p class="text-body-md text-body mb-xl" data-testid="reset-password-status">
            Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.
          </p>
          <a routerLink="/" class="btn-primary inline-flex">Iniciar sesión</a>
        } @else {
          <p class="text-body-md text-body mb-xl">
            Elige una contraseña nueva para tu cuenta.
          </p>
          <form (ngSubmit)="submit()" class="flex flex-col gap-lg">
            <div class="form-field">
              <label for="reset-password" class="form-label">Contraseña</label>
              <input
                id="reset-password"
                type="password"
                required
                minlength="8"
                [(ngModel)]="password"
                name="password"
                class="form-input"
                autocomplete="new-password"
                data-testid="reset-password-password"
              />
              <p class="form-hint mt-xxs">
                Mínimo 8 caracteres, con al menos una letra y un número.
              </p>
            </div>
            <div class="form-field">
              <label for="reset-confirm-password" class="form-label">
                Confirmar contraseña
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                required
                minlength="8"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                class="form-input"
                autocomplete="new-password"
                data-testid="reset-password-confirm"
              />
              @if (confirmPassword && confirmPassword !== password) {
                <p class="form-error mt-xs">Las contraseñas no coinciden</p>
              }
            </div>
            @if (error()) {
              <p class="form-error" data-testid="reset-password-error">{{ error() }}</p>
            }
            <button
              type="submit"
              class="btn-primary w-full"
              [disabled]="submitting() || !isValid()"
              data-testid="reset-password-submit"
            >
              {{ submitting() ? 'Guardando...' : 'Guardar contraseña' }}
            </button>
          </form>
        }
      </div>
    </section>
  `,
})
export class ResetPassword implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected token = '';
  protected password = '';
  protected confirmPassword = '';
  protected readonly submitting = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  protected isValid(): boolean {
    return (
      this.password === this.confirmPassword &&
      /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(this.password)
    );
  }

  protected submit(): void {
    if (!this.isValid() || this.submitting()) return;

    this.submitting.set(true);
    this.error.set('');
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'No se pudo restablecer la contraseña. Intenta de nuevo.',
        );
      },
    });
  }
}
