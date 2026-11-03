import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { DasiUser } from './dasi-user.js';
import { AuthService } from '../../modules/auth/auth.service.js';

/**
 * Valida el Firebase ID Token del encabezado Authorization en cada petición,
 * comprueba que el usuario esté registrado y activo en PostgreSQL y adjunta
 * su identidad, roles y permisos a request.user.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: DasiUser }>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Debe iniciar sesión para continuar.');
    }

    const token = header.slice('Bearer '.length).trim();
    const usuario = await this.auth.autenticarFirebase(token);
    request.user = this.auth.toDasiUser(usuario);

    return true;
  }
}
