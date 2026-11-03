import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';

/**
 * Todas las rutas requieren un Firebase ID Token válido (FirebaseAuthGuard global).
 * El inicio de sesión lo realiza Firebase en el frontend con Google.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Registra el inicio de sesión tras autenticarse con Google. */
  @Post('session')
  @HttpCode(200)
  iniciarSesion(@CurrentUser('sub') usuarioId: string) {
    return this.authService.iniciarSesion(usuarioId);
  }

  @Get('me')
  me(@CurrentUser('sub') usuarioId: string) {
    return this.authService.me(usuarioId);
  }
}
