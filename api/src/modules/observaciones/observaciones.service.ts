import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateObservacionDto } from './dto/create-observacion.dto.js';
import { UpdateObservacionDto } from './dto/update-observacion.dto.js';
import { QueryObservacionesDto } from './dto/query-observaciones.dto.js';
import { CambioEstadoObservacionDto } from './dto/cambio-estado-observacion.dto.js';
import { Prisma } from '@prisma/client';

const USER = {
  id: true,
  nombre: true,
  email: true,
  account: true,
  initials: true,
  avatar_url: true,
} satisfies Prisma.UsuarioSelect;

const INCLUDE = {
  usuario: { select: USER },
  evidencia: { select: { id: true, nombre: true, estado: true } },
  actividad: { select: { id: true, titulo: true } },
  proyecto: { select: { id: true, code: true, nombre: true } },
  replies: {
    where: { deleted_at: null },
    include: { usuario: { select: USER } },
    orderBy: { created_at: 'asc' },
  },
} satisfies Prisma.ObservacionInclude;

type ObservacionPayload = Prisma.ObservacionGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class ObservacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryObservacionesDto,
  ): Promise<{ data: ObservacionPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, evidencia_id, actividad_id, proyecto_id, usuario_id, estado, solo_raiz } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ObservacionWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { contenido: { contains: search, mode: 'insensitive' } },
        { proyecto: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (evidencia_id) where.evidencia_id = evidencia_id;
    if (actividad_id) where.actividad_id = actividad_id;
    if (proyecto_id) where.proyecto_id = proyecto_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (estado) where.estado = estado as Prisma.ObservacionWhereInput['estado'];
    if (solo_raiz === 'true') where.parent_id = null;

    const [data, total] = await Promise.all([
      this.prisma.observacion.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.observacion.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<ObservacionPayload> {
    const observacion = await this.prisma.observacion.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!observacion || observacion.deleted_at) {
      throw new NotFoundException(`Observación con id ${id} no encontrada`);
    }

    return observacion;
  }

  async create(dto: CreateObservacionDto): Promise<ObservacionPayload> {
    if (!dto.evidencia_id && !dto.actividad_id && !dto.proyecto_id && !dto.parent_id) {
      throw new BadRequestException(
        'Debe indicarse al menos una evidencia, actividad, proyecto o una observación padre (respuesta)',
      );
    }

    await this.validateUsuario(dto.usuario_id);

    if (dto.evidencia_id) await this.validateRef('evidencia', dto.evidencia_id);
    if (dto.actividad_id) await this.validateRef('actividad', dto.actividad_id);
    if (dto.proyecto_id) await this.validateRef('proyecto', dto.proyecto_id);
    if (dto.parent_id) await this.validateRef('observacion', dto.parent_id);

    if (!dto.parent_id) {
      const proyectoId = await this.scopeProyecto(dto.evidencia_id, dto.actividad_id, dto.proyecto_id);
      if (proyectoId) await this.assertParticipa(proyectoId, dto.usuario_id);
    }

    const proyectoId = await this.scopeProyecto(dto.evidencia_id, dto.actividad_id, dto.proyecto_id);

    const observacion = await this.prisma.observacion.create({
      data: {
        contenido: dto.contenido,
        estado: dto.estado,
        usuario: { connect: { id: dto.usuario_id } },
        evidencia: dto.evidencia_id ? { connect: { id: dto.evidencia_id } } : undefined,
        actividad: dto.actividad_id ? { connect: { id: dto.actividad_id } } : undefined,
        proyecto: dto.proyecto_id ? { connect: { id: dto.proyecto_id } } : undefined,
        parent: dto.parent_id ? { connect: { id: dto.parent_id } } : undefined,
      },
      include: INCLUDE,
    });

    // Trazabilidad: toda observación a un proyecto queda registrada en su historial.
    if (!dto.parent_id && proyectoId) {
      const proyecto = await this.prisma.proyecto.findUnique({
        where: { id: proyectoId },
        select: { estado: true },
      });
      if (proyecto) {
        await this.prisma.historialProyecto.create({
          data: {
            proyecto_id: proyectoId,
            usuario_id: dto.usuario_id,
            estado_anterior: null,
            estado_nuevo: proyecto.estado,
            accion: 'Observación registrada',
            comentario: dto.contenido,
          },
        });
      }
    }

    return observacion;
  }

  async update(id: string, dto: UpdateObservacionDto): Promise<ObservacionPayload> {
    await this.findOne(id);

    return this.prisma.observacion.update({
      where: { id },
      data: { contenido: dto.contenido },
      include: INCLUDE,
    });
  }

  async cambiarEstado(id: string, dto: CambioEstadoObservacionDto): Promise<ObservacionPayload> {
    await this.findOne(id);

    return this.prisma.observacion.update({
      where: { id },
      data: { estado: dto.estado },
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.observacion.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Observación eliminada correctamente' };
  }

  private async validateUsuario(id: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!usuario || usuario.deleted_at) {
      throw new BadRequestException(`Usuario con id ${id} no encontrado`);
    }
  }

  private async validateRef(
    model: 'evidencia' | 'actividad' | 'proyecto' | 'observacion',
    id: string,
  ): Promise<void> {
    const data = await this.findRef(model, id);

    if (!data || data.deleted_at) {
      const labels: Record<string, string> = {
        evidencia: 'Evidencia',
        actividad: 'Actividad',
        proyecto: 'Proyecto',
        observacion: 'Observación',
      };
      throw new BadRequestException(`${labels[model]} con id ${id} no encontrada`);
    }
  }

  private async findRef(
    model: 'evidencia' | 'actividad' | 'proyecto' | 'observacion',
    id: string,
  ): Promise<{ id: string; deleted_at: Date | null } | null> {
    const base = {
      where: { id },
      select: { id: true, deleted_at: true } as const,
    };

    switch (model) {
      case 'evidencia':
        return this.prisma.evidencia.findUnique(base);
      case 'actividad':
        return this.prisma.actividad.findUnique(base);
      case 'proyecto':
        return this.prisma.proyecto.findUnique(base);
      case 'observacion':
        return this.prisma.observacion.findUnique(base);
    }
  }

  private async scopeProyecto(
    evidenciaId: string | undefined,
    actividadId: string | undefined,
    proyectoId: string | undefined,
  ): Promise<string | null> {
    if (proyectoId) return proyectoId;
    if (actividadId) {
      const actividad = await this.prisma.actividad.findUnique({
        where: { id: actividadId },
        select: { proyecto_id: true },
      });
      return actividad?.proyecto_id ?? null;
    }
    if (evidenciaId) {
      const evidencia = await this.prisma.evidencia.findUnique({
        where: { id: evidenciaId },
        select: { actividad_id: true, proyecto_id: true },
      });
      if (evidencia?.actividad_id) return this.scopeProyecto(undefined, evidencia.actividad_id, undefined);
      return evidencia?.proyecto_id ?? null;
    }
    return null;
  }

  private async assertParticipa(proyectoId: string, usuarioId: string): Promise<void> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: {
        owner_id: true,
        coordinador_id: true,
        created_by_id: true,
        dependencia_id: true,
        proyecto_equipo: { select: { usuario_id: true } },
        proyecto_dependencias: { select: { dependencia_id: true } },
      },
    });

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { dependencia_id: true },
    });

    if (!proyecto || !usuario) {
      throw new BadRequestException('No se pudo verificar la participación del usuario en el proyecto');
    }

    const directo =
      proyecto.owner_id === usuarioId ||
      proyecto.coordinador_id === usuarioId ||
      proyecto.created_by_id === usuarioId ||
      proyecto.proyecto_equipo.some((e) => e.usuario_id === usuarioId);
    const porDependencia =
      !!usuario.dependencia_id &&
      (usuario.dependencia_id === proyecto.dependencia_id ||
        proyecto.proyecto_dependencias.some((d) => d.dependencia_id === usuario.dependencia_id));

    if (!directo && !porDependencia) {
      throw new ForbiddenException(
        'El usuario no participa en el proyecto de esta observación (no es responsable ni colaborador)',
      );
    }
  }
}