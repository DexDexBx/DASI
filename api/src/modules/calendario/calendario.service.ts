import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';
import { QueryEventosDto } from './dto/query-eventos.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE = {
  proyecto: { select: { id: true, code: true, nombre: true } },
  actividad: { select: { id: true, titulo: true, code: true, fase: true } },
} satisfies Prisma.EventoCalendarioInclude;

type EventoPayload = Prisma.EventoCalendarioGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class CalendarioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryEventosDto,
  ): Promise<{ data: EventoPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, usuario_id, proyecto_id, actividad_id, desde, hasta, tipo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventoCalendarioWhereInput = {};

    if (usuario_id) where.usuario_id = usuario_id;
    if (proyecto_id) where.proyecto_id = proyecto_id;
    if (actividad_id) where.actividad_id = actividad_id;
    if (tipo) where.tipo = tipo as Prisma.EventoCalendarioWhereInput['tipo'];

    if (desde && hasta) {
      where.OR = [
        { fecha_inicio: { gte: new Date(desde), lte: new Date(hasta) } },
        { fecha_fin: { gte: new Date(desde), lte: new Date(hasta) } },
      ];
    } else if (desde) {
      where.fecha_fin = { gte: new Date(desde) };
    } else if (hasta) {
      where.fecha_inicio = { lte: new Date(hasta) };
    }

    const [data, total] = await Promise.all([
      this.prisma.eventoCalendario.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { fecha_inicio: 'asc' },
      }),
      this.prisma.eventoCalendario.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<EventoPayload> {
    const evento = await this.prisma.eventoCalendario.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!evento) {
      throw new NotFoundException(`Evento con id ${id} no encontrado`);
    }

    return evento;
  }

  async create(dto: CreateEventoDto): Promise<EventoPayload> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuario_id },
      select: { id: true },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuario con id ${dto.usuario_id} no encontrado`);
    }

    if (!dto.todo_dia && new Date(dto.fecha_fin) <= new Date(dto.fecha_inicio)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    return this.prisma.eventoCalendario.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
        todo_dia: dto.todo_dia,
        color: dto.color,
        tipo: dto.tipo,
        usuario_id: dto.usuario_id,
        proyecto_id: dto.proyecto_id,
        actividad_id: dto.actividad_id,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateEventoDto): Promise<EventoPayload> {
    await this.findOne(id);

    const data: Prisma.EventoCalendarioUpdateInput = {
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      todo_dia: dto.todo_dia,
      color: dto.color,
      tipo: dto.tipo,
      fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
      fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : undefined,
    };

    if (dto.proyecto_id) {
      data.proyecto = { connect: { id: dto.proyecto_id } };
    }

    if (dto.actividad_id) {
      data.actividad = { connect: { id: dto.actividad_id } };
    }

    return this.prisma.eventoCalendario.update({
      where: { id },
      data,
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.eventoCalendario.delete({ where: { id } });

    return { message: 'Evento eliminado correctamente' };
  }
}