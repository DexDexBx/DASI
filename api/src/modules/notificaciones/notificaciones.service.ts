import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateNotificacionDto } from './dto/create-notificacion.dto.js';
import { QueryNotificacionesDto } from './dto/query-notificaciones.dto.js';
import { MarcarLeidaDto } from './dto/marcar-leida.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  proyecto: { select: { id: true, code: true, nombre: true } },
  actividad: { select: { id: true, titulo: true } },
} satisfies Prisma.NotificacionInclude;

type NotificacionPayload = Prisma.NotificacionGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryNotificacionesDto,
  ): Promise<{ data: NotificacionPayload[]; meta: { page: number; limit: number; total: number; totalPages: number; noLeidas: number } }> {
    const { page = 1, limit = 20, usuario_id, leida, no_leidas } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificacionWhereInput = { usuario_id };

    if (leida !== undefined) where.leida = leida === 'true';
    if (no_leidas === 'true') where.leida = false;

    const [data, total, noLeidas] = await Promise.all([
      this.prisma.notificacion.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.notificacion.count({ where }),
      this.prisma.notificacion.count({ where: { usuario_id, leida: false } }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), noLeidas },
    };
  }

  async findOne(id: string): Promise<NotificacionPayload> {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!notificacion) {
      throw new NotFoundException(`Notificación con id ${id} no encontrada`);
    }

    return notificacion;
  }

  async create(dto: CreateNotificacionDto): Promise<NotificacionPayload> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuario_id },
      select: { id: true },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuario con id ${dto.usuario_id} no encontrado`);
    }

    return this.prisma.notificacion.create({
      data: {
        usuario_id: dto.usuario_id,
        titulo: dto.titulo,
        mensaje: dto.mensaje,
        tipo: dto.tipo as Prisma.NotificacionCreateInput['tipo'],
        leida: dto.leida ?? false,
        proyecto_id: dto.proyecto_id,
        actividad_id: dto.actividad_id,
      },
      include: INCLUDE,
    });
  }

  async marcarLeida(id: string, dto: MarcarLeidaDto): Promise<NotificacionPayload> {
    await this.findOne(id);

    return this.prisma.notificacion.update({
      where: { id },
      data: { leida: dto.leida },
      include: INCLUDE,
    });
  }

  async marcarTodasLeidas(usuarioId: string): Promise<{ message: string; count: number }> {
    const result = await this.prisma.notificacion.updateMany({
      where: { usuario_id: usuarioId, leida: false },
      data: { leida: true },
    });

    return { message: 'Notificaciones marcadas como leídas', count: result.count };
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.notificacion.delete({ where: { id } });

    return { message: 'Notificación eliminada correctamente' };
  }
}