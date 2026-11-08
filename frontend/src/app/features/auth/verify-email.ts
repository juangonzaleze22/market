import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type VerifyState = 'loading' | 'success' | 'error' | 'missing';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  template: `
    <section class="py-3xl max-w-[28rem] mx-auto px-lg">
      <div class="card-content border border-surface-pressed text-center">
        @switch (state()) {
          @case ('loading') {
            <p class="text-body-md text-body" data-testid="verify-email-status">
              Verificando tu correo...
            </p>
          }
          @case ('success') {
            <h1 class="text-display-md font-bold mb-md" data-testid="verify-email-status">
              Correo verificado
            </h1>
            <p class="text-body-md text-body mb-xl">
              Tu cuenta ya está activa. Te estamos redirigiendo a tu cuenta.
            </p>
            <a routerLink="/account" class="btn-primary inline-flex">Ir a mi cuenta</a>
          }
          @case ('missing') {
            <h1 class="text-display-md font-bold mb-md" data-testid="verify-email-status">
              Enlace inválido
            </h1>
            <p class="text-body-md text-body mb-xl">
              El enlace no incluye un token de verificación. Solicita uno nuevo
              iniciando sesión.
            </p>
            <a routerLink="/" class="btn-secondary inline-flex">Volver al inicio</a>
          }
          @default {
            <h1 class="text-display-md font-bold mb-md" data-testid="verify-email-status">
              No pudimos verificar tu correo
            </h1>
            <p class="form-error mb-xl" data-testid="verify-email-error">{{ message() }}</p>
            <a routerLink="/" class="btn-secondary inline-flex">Volver al inicio</a>
          }
        }
      </div>
    </section>
  `,
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly state = signal<VerifyState>('loading');
  readonly message = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('missing');
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.state.set('success');
      },
      error: (error: HttpErrorResponse) => {
        this.state.set('error');
        this.message.set(
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'El enlace es inválido o expiró. Solicita uno nuevo.',
        );
      },
    });
  }
}
