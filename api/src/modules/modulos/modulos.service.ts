import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateModuloDto } from './dto/create-modulo.dto.js';
import { UpdateModuloDto } from './dto/update-modulo.dto.js';
import { QueryModulosDto } from './dto/query-modulos.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  _count: { select: { permisos: true } },
} satisfies Prisma.ModuloInclude;

type ModuloPayload = Prisma.ModuloGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class ModulosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryModulosDto,
  ): Promise<{ data: ModuloPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, activo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ModuloWhereInput = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activo !== undefined) where.activo = activo === 'true';

    const [data, total] = await Promise.all([
      this.prisma.modulo.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.modulo.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<ModuloPayload> {
    const modulo = await this.prisma.modulo.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!modulo) {
      throw new NotFoundException(`Módulo con id ${id} no encontrado`);
    }

    return modulo;
  }

  async create(dto: CreateModuloDto): Promise<ModuloPayload> {
    const existing = await this.prisma.modulo.findFirst({
      where: { OR: [{ nombre: dto.nombre }, { slug: dto.slug }] },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un módulo con el nombre o slug "${dto.nombre}"`);
    }

    return this.prisma.modulo.create({
      data: dto,
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateModuloDto): Promise<ModuloPayload> {
    await this.findOne(id);

    if (dto.nombre || dto.slug) {
      const existing = await this.prisma.modulo.findFirst({
        where: {
          NOT: { id },
          OR: [
            ...(dto.nombre ? [{ nombre: dto.nombre }] : []),
            ...(dto.slug ? [{ slug: dto.slug }] : []),
          ],
        },
      });

      if (existing) {
        throw new ConflictException('Ya existe otro módulo con el nombre o slug indicado');
      }
    }

    return this.prisma.modulo.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.modulo.delete({
      where: { id },
    });

    return { message: 'Módulo eliminado correctamente' };
  }
}