import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCargoDto } from './dto/create-cargo.dto.js';
import { UpdateCargoDto } from './dto/update-cargo.dto.js';
import { QueryCargosDto } from './dto/query-cargos.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  _count: { select: { usuarios: true, usuario_cargos: true } },
} satisfies Prisma.CargoInclude;

type CargoPayload = Prisma.CargoGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class CargosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryCargosDto,
  ): Promise<{ data: CargoPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CargoWhereInput = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cargo.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.cargo.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<CargoPayload> {
    const cargo = await this.prisma.cargo.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!cargo) {
      throw new NotFoundException(`Cargo con id ${id} no encontrado`);
    }

    return cargo;
  }

  async create(dto: CreateCargoDto): Promise<CargoPayload> {
    const existing = await this.prisma.cargo.findUnique({
      where: { nombre: dto.nombre },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un cargo con el nombre "${dto.nombre}"`);
    }

    return this.prisma.cargo.create({
      data: dto,
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateCargoDto): Promise<CargoPayload> {
    await this.findOne(id);

    if (dto.nombre) {
      const existing = await this.prisma.cargo.findFirst({
        where: { NOT: { id }, nombre: dto.nombre },
      });

      if (existing) {
        throw new ConflictException(`Ya existe otro cargo con el nombre "${dto.nombre}"`);
      }
    }

    return this.prisma.cargo.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.cargo.delete({
      where: { id },
    });

    return { message: 'Cargo eliminado correctamente' };
  }
}