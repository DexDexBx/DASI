import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';

/** Exige una sesión DASI válida (Firebase + usuario registrado en el backend). */
export const dasiAuthGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const session = inject(SessionService);

  await session.ready();
  return session.isLoggedIn ? true : router.createUrlTree(['/signin']);
};
