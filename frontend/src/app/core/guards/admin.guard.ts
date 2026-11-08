import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthModalService } from '../services/auth-modal.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authModal = inject(AuthModalService);
  if (auth.isAuthed() && auth.user()?.role === 'admin') return true;
  if (!auth.isAuthed()) {
    authModal.openLogin('admin');
    return false;
  }
  return router.createUrlTree(['/']);
};
