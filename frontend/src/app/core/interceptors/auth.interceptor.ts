import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthModalService } from '../services/auth-modal.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const authModal = inject(AuthModalService);

  const token =
    localStorage.getItem('market_token') ?? sessionStorage.getItem('market_token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const auth = injector.get(AuthService);
        if (auth.isAuthed()) {
          auth.clearSession();
          authModal.openLogin(
            typeof window !== 'undefined' ? window.location.pathname : null,
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
