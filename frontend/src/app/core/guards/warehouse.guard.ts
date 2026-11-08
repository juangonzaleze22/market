import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthModalService } from '../services/auth-modal.service';

export const warehouseGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authModal = inject(AuthModalService);
  const role = auth.user()?.role;
  if (auth.isAuthed() && (role === 'warehouse' || role === 'admin')) return true;
  if (!auth.isAuthed()) {
    authModal.openLogin('warehouse');
    return false;
  }
  return router.createUrlTree(['/']);
};
