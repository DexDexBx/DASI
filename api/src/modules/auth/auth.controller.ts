import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CrearSesionDto } from './dto/crear-sesion.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: CrearSesionDto) {
    return this.authService.login(dto);
  }
}