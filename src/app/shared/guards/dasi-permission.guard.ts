import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';

/**
 * Comprueba el módulo declarado en `route.data.modulo`.
 * Si no se declara módulo, la ruta solo exige estar autenticado.
 */
export const dasiPermissionGuard: CanActivateChildFn = (route) => {
  const modulo = route.data?.['modulo'] as string | undefined;
  if (!modulo) return true;

  const session = inject(SessionService);
  const router = inject(Router);

  return session.can(modulo, 'Ver')
    ? true
    : router.createUrlTree(['/acceso-no-autorizado']);
};
