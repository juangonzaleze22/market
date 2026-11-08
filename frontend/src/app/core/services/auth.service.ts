import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  devVerificationToken?: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly path = 'auth';
  private readonly tokenKey = 'market_token';
  private readonly userKey = 'market_user';

  readonly user = signal<AuthUser | null>(this.readUser());
  readonly isAuthed = computed(() => this.user() !== null && this.token() !== null);

  constructor(private http: HttpClient, private api: ApiService) {}

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      this.api.url(`${this.path}/register`),
      payload,
    );
  }

  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.api.url(`${this.path}/verify-email`), { token })
      .pipe(tap((res) => this.persist(res, true)));
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      this.api.url(`${this.path}/resend-verification`),
      { email },
    );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      this.api.url(`${this.path}/forgot-password`),
      { email },
    );
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(this.api.url(`${this.path}/reset-password`), {
      token,
      password,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(this.api.url(`${this.path}/change-password`), {
      currentPassword,
      newPassword,
    });
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>(this.api.url(`${this.path}/logout-all`), {});
  }

  login(payload: LoginPayload, remember = true): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.api.url(`${this.path}/login`), payload)
      .pipe(tap((res) => this.persist(res, remember)));
  }

  logout(): void {
    this.clearSession();
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.user.set(null);
  }

  token(): string | null {
    return localStorage.getItem(this.tokenKey) ?? sessionStorage.getItem(this.tokenKey);
  }

  homeRoute(): string {
    const role = this.user()?.role;
    if (role === 'admin') return '/admin';
    if (role === 'warehouse') return '/warehouse';
    if (role === 'delivery') return '/delivery';
    return '/';
  }

  private persist(res: AuthResponse, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    storage.setItem(this.tokenKey, res.token);
    storage.setItem(this.userKey, JSON.stringify(res.user));
    other.removeItem(this.tokenKey);
    other.removeItem(this.userKey);
    this.user.set(res.user);
  }

  private readUser(): AuthUser | null {
    const token = this.token();
    const raw = localStorage.getItem(this.userKey) ?? sessionStorage.getItem(this.userKey);
    if (!raw || !token) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
