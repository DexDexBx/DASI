import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateDependenciaDto } from './dto/create-dependencia.dto.js';
import { UpdateDependenciaDto } from './dto/update-dependencia.dto.js';
import { QueryDependenciasDto } from './dto/query-dependencias.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  parent: { select: { id: true, code: true, nombre: true } },
  _count: { select: { hijos: true, usuarios: true } },
} satisfies Prisma.DependenciaInclude;

type DependenciaPayload = Prisma.DependenciaGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class DependenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryDependenciasDto,
  ): Promise<{ data: DependenciaPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, tipo, activa, parent_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DependenciaWhereInput = { deleted_at: null };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { director: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipo) where.tipo = tipo;
    if (activa !== undefined) where.activa = activa;
    if (parent_id) where.parent_id = parent_id;

    const [data, total] = await Promise.all([
      this.prisma.dependencia.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.dependencia.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<DependenciaPayload> {
    const dependencia = await this.prisma.dependencia.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!dependencia || dependencia.deleted_at) {
      throw new NotFoundException(`Dependencia con id ${id} no encontrada`);
    }

    return dependencia;
  }

  async create(dto: CreateDependenciaDto): Promise<DependenciaPayload> {
    await this.validateCodeUnique(dto.code);

    if (dto.parent_id) {
      await this.validateParent(dto.parent_id);
    }

    return this.prisma.dependencia.create({
      data: dto,
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateDependenciaDto): Promise<DependenciaPayload> {
    await this.findOne(id);

    if (dto.code) {
      await this.validateCodeUnique(dto.code, id);
    }

    if (dto.parent_id) {
      if (dto.parent_id === id) {
        throw new BadRequestException('Una dependencia no puede ser su propio padre');
      }
      await this.validateParent(dto.parent_id);
    }

    return this.prisma.dependencia.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.dependencia.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Dependencia eliminada correctamente' };
  }

  private async validateCodeUnique(code: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.dependencia.findFirst({
      where: {
        code,
        deleted_at: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una dependencia con el código "${code}"`);
    }
  }

  private async validateParent(parentId: string): Promise<void> {
    const parent = await this.prisma.dependencia.findUnique({
      where: { id: parentId },
      select: { id: true, deleted_at: true },
    });

    if (!parent || parent.deleted_at) {
      throw new BadRequestException(
        `La dependencia padre con id ${parentId} no existe`,
      );
    }
  }
}