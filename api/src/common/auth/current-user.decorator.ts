import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DasiUser } from './dasi-user.js';

/**
 * Inyecta el usuario autenticado en el handler.
 * Uso: @CurrentUser() user | @CurrentUser('sub') usuarioId
 */
export const CurrentUser = createParamDecorator(
  (data: keyof DasiUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: DasiUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
