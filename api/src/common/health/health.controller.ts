import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Public } from '../auth/public.decorator.js';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check(): { status: string; service: string } {
    return { status: 'ok', service: 'DASI API' };
  }

  @Get('db')
  async checkDb(): Promise<{ status: string; database: string; message: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'PostgreSQL', message: 'Conexion exitosa' };
    } catch (error) {
      return { status: 'error', database: 'PostgreSQL', message: String(error) };
    }
  }
}
