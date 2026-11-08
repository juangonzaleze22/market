import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthModalService } from '../services/auth-modal.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authModal = inject(AuthModalService);
  if (auth.isAuthed()) return true;
  authModal.openLogin(route.routeConfig?.path ?? '/');
  return false;
};
