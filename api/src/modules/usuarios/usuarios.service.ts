import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  dependencia: true,
  cargo: true,
  usuario_roles: { include: { rol: true } },
  usuario_dependencias: true,
  usuario_cargos: true,
} satisfies Prisma.UsuarioInclude;

const OMIT = {
  password_hash: true,
  google_sub: true,
  firebase_uid: true,
} satisfies Prisma.UsuarioOmit;

type UsuarioPayload = Prisma.UsuarioGetPayload<{
  include: typeof INCLUDE;
  omit: typeof OMIT;
}>;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryUsuariosDto,
  ): Promise<{ data: UsuarioPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, estado, dependencia_id, cargo_id, rol_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UsuarioWhereInput = { deleted_at: null };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { account: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) where.estado = estado;
    if (dependencia_id) where.dependencia_id = dependencia_id;
    if (cargo_id) where.cargo_id = cargo_id;

    if (rol_id) {
      where.usuario_roles = { some: { rol_id } };
    }

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        include: INCLUDE,
        omit: OMIT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<UsuarioPayload> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: INCLUDE,
      omit: OMIT,
    });

    if (!usuario || usuario.deleted_at) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioPayload> {
    const { dependencias, cargos, roles, ...data } = dto;

    await this.validateUniqueness(data.email, data.account);
    await this.validateRelations(dependencias, cargos, roles);

    return this.prisma.usuario.create({
      data: {
        ...data,
        initials: data.initials ?? this.generateInitials(data.nombre),
        ...(dependencias?.length && {
          usuario_dependencias: {
            create: dependencias.map((depId, i) => ({
              dependencia_id: depId,
              es_principal: i === 0,
            })),
          },
        }),
        ...(cargos?.length && {
          usuario_cargos: {
            create: cargos.map((carId) => ({ cargo_id: carId })),
          },
        }),
        ...(roles?.length && {
          usuario_roles: {
            create: roles.map((rolId) => ({ rol_id: rolId })),
          },
        }),
      },
      include: INCLUDE,
      omit: OMIT,
    });
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<UsuarioPayload> {
    await this.findOne(id);

    const { dependencias, cargos, roles, ...data } = dto;

    if (data.email || data.account) {
      await this.validateUniqueness(data.email, data.account, id);
    }

    if (dependencias || cargos || roles) {
      await this.validateRelations(dependencias, cargos, roles);
    }

    if (data.nombre && !data.initials) {
      data.initials = this.generateInitials(data.nombre);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        ...(dependencias && {
          usuario_dependencias: {
            deleteMany: {},
            create: dependencias.map((depId, i) => ({
              dependencia_id: depId,
              es_principal: i === 0,
            })),
          },
        }),
        ...(cargos && {
          usuario_cargos: {
            deleteMany: {},
            create: cargos.map((carId) => ({ cargo_id: carId })),
          },
        }),
        ...(roles && {
          usuario_roles: {
            deleteMany: {},
            create: roles.map((rolId) => ({ rol_id: rolId })),
          },
        }),
      },
      include: INCLUDE,
      omit: OMIT,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.usuario.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Usuario eliminado correctamente' };
  }

  async toggleEstado(id: string): Promise<UsuarioPayload> {
    const usuario = await this.findOne(id);

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: usuario.estado === 'Activo' ? 'Inactivo' : 'Activo',
      },
      include: INCLUDE,
      omit: OMIT,
    });
  }

  private async validateUniqueness(
    email?: string,
    account?: string,
    excludeId?: string,
  ): Promise<void> {
    if (!email && !account) return;

    const andFilters: Prisma.UsuarioWhereInput[] = [{ deleted_at: null }];

    if (excludeId) {
      andFilters.push({ NOT: { id: excludeId } });
    }

    const orFilters: Prisma.UsuarioWhereInput[] = [];
    if (email) orFilters.push({ email });
    if (account) orFilters.push({ account });

    if (orFilters.length > 0) {
      const existing = await this.prisma.usuario.findFirst({
        where: { AND: andFilters, OR: orFilters },
      });

      if (existing) {
        const field = existing.email === email ? 'email' : 'account';
        throw new ConflictException(`Ya existe un usuario con ese ${field}`);
      }
    }
  }

  private async validateRelations(
    dependencias?: string[],
    cargos?: string[],
    roles?: string[],
  ): Promise<void> {
    if (dependencias?.length) {
      const found = await this.prisma.dependencia.findMany({
        where: { id: { in: dependencias }, deleted_at: null },
        select: { id: true },
      });
      if (found.length !== dependencias.length) {
        const missing = dependencias.filter((id) => !found.some((f) => f.id === id));
        throw new BadRequestException(
          `Dependencia(s) no encontrada(s): ${missing.join(', ')}`,
        );
      }
    }

    if (cargos?.length) {
      const found = await this.prisma.cargo.findMany({
        where: { id: { in: cargos } },
        select: { id: true },
      });
      if (found.length !== cargos.length) {
        const missing = cargos.filter((id) => !found.some((f) => f.id === id));
        throw new BadRequestException(
          `Cargo(s) no encontrado(s): ${missing.join(', ')}`,
        );
      }
    }

    if (roles?.length) {
      const found = await this.prisma.rol.findMany({
        where: { id: { in: roles } },
        select: { id: true },
      });
      if (found.length !== roles.length) {
        const missing = roles.filter((id) => !found.some((f) => f.id === id));
        throw new BadRequestException(
          `Rol(es) no encontrado(s): ${missing.join(', ')}`,
        );
      }
    }
  }

  private generateInitials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  }
}
