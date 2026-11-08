import { Injectable, signal } from '@angular/core';

export type AuthModalView = 'login' | 'register';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  readonly open = signal(false);
  readonly view = signal<AuthModalView>('login');
  readonly redirect = signal<string | null>(null);

  openLogin(redirect?: string | null): void {
    this.view.set('login');
    this.redirect.set(redirect ?? null);
    this.open.set(true);
  }

  openRegister(redirect?: string | null): void {
    this.view.set('register');
    this.redirect.set(redirect ?? null);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.redirect.set(null);
  }

  switchView(): void {
    this.view.set(this.view() === 'login' ? 'register' : 'login');
  }
}
