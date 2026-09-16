import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';

export const dasiAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const session = inject(SessionService);
  return session.isLoggedIn ? true : router.createUrlTree(['/signin']);
};