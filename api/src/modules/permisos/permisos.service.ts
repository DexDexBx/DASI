import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePermisoDto } from './dto/create-permiso.dto.js';
import { UpdatePermisoDto } from './dto/update-permiso.dto.js';
import { QueryPermisosDto } from './dto/query-permisos.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  modulo: true,
  _count: { select: { rol_permisos: true } },
} satisfies Prisma.PermisoInclude;

type PermisoPayload = Prisma.PermisoGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryPermisosDto,
  ): Promise<{ data: PermisoPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, modulo_id, accion } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PermisoWhereInput = {};

    if (search) {
      where.OR = [{ modulo: { nombre: { contains: search, mode: 'insensitive' } } }];
    }

    if (modulo_id) where.modulo_id = modulo_id;
    if (accion) where.accion = accion;

    const [data, total] = await Promise.all([
      this.prisma.permiso.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.permiso.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<PermisoPayload> {
    const permiso = await this.prisma.permiso.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!permiso) {
      throw new NotFoundException(`Permiso con id ${id} no encontrado`);
    }

    return permiso;
  }

  async create(dto: CreatePermisoDto): Promise<PermisoPayload> {
    await this.validateModulo(dto.modulo_id);
    await this.validateUnique(dto.modulo_id, dto.accion);

    return this.prisma.permiso.create({
      data: dto,
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdatePermisoDto): Promise<PermisoPayload> {
    const permiso = await this.findOne(id);

    const moduloId = dto.modulo_id ?? permiso.modulo_id;
    const accion = dto.accion ?? permiso.accion;

    if (dto.modulo_id) {
      await this.validateModulo(dto.modulo_id);
    }

    if (dto.modulo_id || dto.accion) {
      await this.validateUnique(moduloId, accion, id);
    }

    return this.prisma.permiso.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.permiso.delete({
      where: { id },
    });

    return { message: 'Permiso eliminado correctamente' };
  }

  private async validateModulo(moduloId: string): Promise<void> {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id: moduloId },
      select: { id: true },
    });

    if (!modulo) {
      throw new BadRequestException(`Módulo con id ${moduloId} no encontrado`);
    }
  }

  private async validateUnique(
    moduloId: string,
    accion: string,
    excludeId?: string,
  ): Promise<void> {
    const where: Prisma.PermisoWhereInput = {
      modulo_id: moduloId,
      accion: accion as Prisma.PermisoWhereInput['accion'],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    };

    const existing = await this.prisma.permiso.findFirst({ where });

    if (existing) {
      throw new ConflictException(
        `Ya existe un permiso de "${accion}" para ese módulo`,
      );
    }
  }
}