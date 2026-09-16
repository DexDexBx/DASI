import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto.js';
import { QueryAuditoriaDto } from './dto/query-auditoria.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  usuario: { select: { id: true, nombre: true, email: true, account: true, initials: true, avatar_url: true } },
} satisfies Prisma.AuditoriaInclude;

type AuditoriaPayload = Prisma.AuditoriaGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryAuditoriaDto,
  ): Promise<{ data: AuditoriaPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, modulo, entidad, usuario_id, entidad_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditoriaWhereInput = {};

    if (search) {
      where.OR = [
        { accion: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { modulo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (modulo) where.modulo = modulo;
    if (entidad) where.entidad = entidad;
    if (usuario_id) where.usuario_id = usuario_id;
    if (entidad_id) where.entidad_id = entidad_id;

    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<AuditoriaPayload> {
    const registro = await this.prisma.auditoria.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!registro) {
      throw new NotFoundException(`Registro de auditoría con id ${id} no encontrado`);
    }

    return registro;
  }

  async registrar(dto: CreateAuditoriaDto): Promise<AuditoriaPayload> {
    return this.prisma.auditoria.create({
      data: {
        usuario_id: dto.usuario_id,
        accion: dto.accion,
        modulo: dto.modulo,
        entidad: dto.entidad,
        entidad_id: dto.entidad_id,
        descripcion: dto.descripcion,
        ip_address: dto.ip_address,
        user_agent: dto.user_agent,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.auditoria.delete({ where: { id } });

    return { message: 'Registro de auditoría eliminado' };
  }
}