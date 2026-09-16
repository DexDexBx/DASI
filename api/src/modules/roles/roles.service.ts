import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { QueryRolesDto } from './dto/query-roles.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  rol_permisos: {
    include: {
      permiso: {
        include: { modulo: true },
      },
    },
  },
  _count: { select: { usuario_roles: true } },
} satisfies Prisma.RolInclude;

type RolPayload = Prisma.RolGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryRolesDto,
  ): Promise<{ data: RolPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, scope } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RolWhereInput = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (scope) where.scope = scope;

    const [data, total] = await Promise.all([
      this.prisma.rol.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.rol.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<RolPayload> {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${id} no encontrado`);
    }

    return rol;
  }

  async create(dto: CreateRolDto): Promise<RolPayload> {
    const existing = await this.prisma.rol.findUnique({
      where: { nombre: dto.nombre },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un rol con el nombre "${dto.nombre}"`);
    }

    return this.prisma.rol.create({
      data: dto,
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateRolDto): Promise<RolPayload> {
    await this.findOne(id);

    if (dto.nombre) {
      const existing = await this.prisma.rol.findFirst({
        where: { NOT: { id }, nombre: dto.nombre },
      });

      if (existing) {
        throw new ConflictException(`Ya existe otro rol con el nombre "${dto.nombre}"`);
      }
    }

    return this.prisma.rol.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.rol.delete({
      where: { id },
    });

    return { message: 'Rol eliminado correctamente' };
  }

  async setPermisos(id: string, permisoIds: string[]): Promise<RolPayload> {
    await this.findOne(id);

    const uniqueIds = [...new Set(permisoIds)];

    const found = await this.prisma.permiso.count({
      where: { id: { in: uniqueIds } },
    });

    if (found !== uniqueIds.length) {
      throw new BadRequestException('Uno o más permisos no existen');
    }

    await this.prisma.$transaction([
      this.prisma.rolPermiso.deleteMany({ where: { rol_id: id } }),
      this.prisma.rolPermiso.createMany({
        data: uniqueIds.map((permiso_id) => ({ rol_id: id, permiso_id })),
      }),
    ]);

    return this.findOne(id);
  }
}
