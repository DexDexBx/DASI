import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateActividadDto } from './dto/create-actividad.dto.js';
import { UpdateActividadDto } from './dto/update-actividad.dto.js';
import { QueryActividadesDto } from './dto/query-actividades.dto.js';
import { CambioEstadoActividadDto } from './dto/cambio-estado-actividad.dto.js';
import { Prisma, ScopeRol } from '@prisma/client';

const USER = {
  id: true,
  nombre: true,
  email: true,
  account: true,
  initials: true,
  avatar_url: true,
} satisfies Prisma.UsuarioSelect;

const INCLUDE = {
  proyecto: { select: { id: true, code: true, nombre: true, estado: true } },
  responsable: { select: USER },
  created_by: { select: USER },
  _count: { select: { evidencias: true, observaciones: true } },
} satisfies Prisma.ActividadInclude;

type ActividadPayload = Prisma.ActividadGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryActividadesDto,
  ): Promise<{ data: ActividadPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, proyecto_id, responsable_id, created_by_id, estado, prioridad, usuario_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ActividadWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { proyecto: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (proyecto_id) where.proyecto_id = proyecto_id;
    if (!proyecto_id && usuario_id) {
      const proyectoScope = await this.buildProyectoScope(usuario_id);
      if (proyectoScope.OR) {
        where.proyecto = { deleted_at: null, OR: proyectoScope.OR as Prisma.ProyectoWhereInput[] };
      }
    }
    if (responsable_id) where.responsable_id = responsable_id;
    if (created_by_id) where.created_by_id = created_by_id;
    if (estado) where.estado = estado as Prisma.ActividadWhereInput['estado'];
    if (prioridad) where.prioridad = prioridad;

    const [data, total] = await Promise.all([
      this.prisma.actividad.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.actividad.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async buildProyectoScope(usuarioId: string): Promise<Record<string, unknown>> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        dependencia: { select: { id: true, nombre: true } },
        usuario_roles: { select: { rol: { select: { scope: true, nombre: true } } } },
      },
    });
    if (!usuario) return {};
    const scopes = new Set(usuario.usuario_roles.map((ur) => ur.rol.scope));
    if (scopes.has(ScopeRol.GLOBAL)) return {};
    const nombreDep = (usuario.dependencia?.nombre ?? '').toLowerCase();
    const privilegiados = ['junta general administrativa', 'gerencia', 'dirección general de administracion', 'direccion general de administracion'];
    if (privilegiados.some((k) => nombreDep.includes(k))) return {};
    if (scopes.has(ScopeRol.DEPENDENCIA) && usuario.dependencia?.id) {
      return {
        OR: [
          { dependencia_id: usuario.dependencia.id },
          { proyecto_dependencias: { some: { dependencia_id: usuario.dependencia.id } } },
        ],
      };
    }
    return {
      OR: [
        { owner_id: usuarioId },
        { coordinador_id: usuarioId },
        { created_by_id: usuarioId },
        { proyecto_equipo: { some: { usuario_id: usuarioId } } },
        { actividades: { some: { responsable_id: usuarioId, deleted_at: null } } },
      ],
    };
  }

  async findOne(id: string): Promise<ActividadPayload> {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!actividad || actividad.deleted_at) {
      throw new NotFoundException(`Actividad con id ${id} no encontrada`);
    }

    return actividad;
  }

  async create(dto: CreateActividadDto): Promise<ActividadPayload> {
    await this.validateProyecto(dto.proyecto_id);
    await this.validateFase(dto.proyecto_id, dto.fase);

    const participantes = await this.participantesProyecto(dto.proyecto_id);
    await this.assertParticipa(participantes, dto.responsable_id, 'responsable');
    await this.assertParticipa(participantes, dto.created_by_id, 'created_by');

    const code = dto.code?.trim() || (await this.proximoCodigo(dto.proyecto_id));

    const actividad = await this.prisma.actividad.create({
      data: {
        titulo: dto.titulo,
        code,
        fase: dto.fase,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad,
        estado: dto.estado,
        progreso: dto.progreso,
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        fecha_fin_estimada: dto.fecha_fin_estimada ? new Date(dto.fecha_fin_estimada) : undefined,
        fecha_fin_real: dto.fecha_fin_real ? new Date(dto.fecha_fin_real) : undefined,
        proyecto: { connect: { id: dto.proyecto_id } },
        responsable: { connect: { id: dto.responsable_id } },
        created_by: { connect: { id: dto.created_by_id } },
      },
      include: INCLUDE,
    });

    await this.syncCalendario(actividad);

    if (actividad.responsable_id !== dto.created_by_id) {
      await this.notificarAsignacionActividad(actividad, dto.created_by_id);
    }

    return actividad;
  }

  async update(id: string, dto: UpdateActividadDto): Promise<ActividadPayload> {
    const actividad = await this.findOne(id);

    if (dto.responsable_id) {
      await this.validateUsuario(dto.responsable_id, 'responsable');
      const participantes = await this.participantesProyecto(actividad.proyecto_id);
      await this.assertParticipa(participantes, dto.responsable_id, 'responsable');
    }

    const actualizada = await this.prisma.actividad.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        code: dto.code,
        fase: dto.fase,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad,
        estado: dto.estado,
        progreso: dto.progreso,
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        fecha_fin_estimada: dto.fecha_fin_estimada ? new Date(dto.fecha_fin_estimada) : undefined,
        fecha_fin_real: dto.fecha_fin_real ? new Date(dto.fecha_fin_real) : undefined,
        responsable: dto.responsable_id ? { connect: { id: dto.responsable_id } } : undefined,
      },
      include: INCLUDE,
    });

    await this.syncCalendario(actualizada);

    if (dto.responsable_id && dto.responsable_id !== actividad.responsable_id && dto.responsable_id !== actividad.created_by_id) {
      await this.notificarAsignacionActividad(actualizada, actividad.created_by_id);
    }

    return actualizada;
  }

  async cambiarEstado(id: string, dto: CambioEstadoActividadDto): Promise<ActividadPayload> {
    await this.findOne(id);

    return this.prisma.actividad.update({
      where: { id },
      data: { estado: dto.estado },
      include: INCLUDE,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.actividad.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Actividad eliminada correctamente' };
  }

  private async validateFase(proyectoId: string, fase?: string): Promise<void> {
    if (!fase) return;
    const existe = await this.prisma.proyectoWorkflow.findFirst({
      where: { proyecto_id: proyectoId, etapa: fase },
      select: { id: true },
    });
    if (!existe) {
      throw new BadRequestException(`La fase "${fase}" no está definida en el workflow del proyecto`);
    }
  }

  /** Genera el código correlativo de una actividad: ACT-ANIO-CORRELATIVO-SECUENCIA */
  private async proximoCodigo(proyectoId: string): Promise<string> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, code: true },
    });

    const total = await this.prisma.actividad.count({
      where: { proyecto_id: proyectoId, deleted_at: null },
    });

    const anio = (proyecto?.code ?? '').match(/(\d{4})/)?.[1] ?? String(new Date().getFullYear());
    const correlativo = (proyecto?.code ?? '').match(/(\d+)$/)?.[1] ?? '0000';
    return `ACT-${anio}-${correlativo.padStart(4, '0')}-${String(total + 1).padStart(2, '0')}`;
  }

  /**
   * Sincronización de calendario: toda actividad con responsable y fecha genera
   * un único evento de tipo ACTIVIDAD en el calendario de ese responsable.
   * Si cambian fechas o responsable, el evento se actualiza; sin duplicados.
   */
  private async syncCalendario(actividad: {
    id: string;
    titulo: string;
    code: string | null;
    proyecto_id: string;
    responsable_id: string;
    fecha_inicio: Date | string | null;
    fecha_fin_estimada: Date | string | null;
  }): Promise<void> {
    const evento = await this.prisma.eventoCalendario.findFirst({
      where: { actividad_id: actividad.id },
    });

    const fechaInicio = actividad.fecha_inicio ? new Date(actividad.fecha_inicio) : null;
    if (!fechaInicio) {
      if (evento) {
        await this.prisma.eventoCalendario.deleteMany({ where: { actividad_id: actividad.id } });
      }
      return;
    }

    const fechaFin = actividad.fecha_fin_estimada ? new Date(actividad.fecha_fin_estimada) : fechaInicio;
    const titulo = actividad.code ? `${actividad.code} · ${actividad.titulo}` : actividad.titulo;

    if (evento) {
      await this.prisma.eventoCalendario.update({
        where: { id: evento.id },
        data: {
          titulo,
          descripcion: actividad.titulo,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          todo_dia: false,
          color: '#10B981',
          usuario: { connect: { id: actividad.responsable_id } },
        },
      });
      return;
    }

    await this.prisma.eventoCalendario.create({
      data: {
        titulo,
        descripcion: actividad.titulo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        todo_dia: false,
        color: '#10B981',
        tipo: 'ACTIVIDAD',
        usuario_id: actividad.responsable_id,
        proyecto_id: actividad.proyecto_id,
        actividad_id: actividad.id,
      },
    });
  }

  private async validateProyecto(id: string, checkDeleted = true): Promise<void> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!proyecto || (checkDeleted && proyecto.deleted_at)) {
      throw new BadRequestException(`Proyecto con id ${id} no encontrado`);
    }
  }

  private async validateUsuario(id: string, label: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!usuario || usuario.deleted_at) {
      throw new BadRequestException(`Usuario (${label}) con id ${id} no encontrado`);
    }
  }

  private async participantesProyecto(proyectoId: string): Promise<{
    owner_id: string;
    coordinador_id: string;
    created_by_id: string;
    dependencia_id: string;
    equipo: Set<string>;
    dependencias: Set<string>;
  }> {
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

    if (!proyecto) {
      throw new BadRequestException(`Proyecto con id ${proyectoId} no encontrado`);
    }

    const equipo = new Set(proyecto.proyecto_equipo.map((e) => e.usuario_id));
    const dependencias = new Set(proyecto.proyecto_dependencias.map((d) => d.dependencia_id));
    dependencias.add(proyecto.dependencia_id);

    return { ...proyecto, equipo, dependencias };
  }

  private async assertParticipa(
    participantes: {
      owner_id: string;
      coordinador_id: string;
      created_by_id: string;
      dependencia_id: string;
      equipo: Set<string>;
      dependencias: Set<string>;
    },
    usuarioId: string,
    etiqueta: string,
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, dependencia_id: true },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuario (${etiqueta}) con id ${usuarioId} no encontrado`);
    }

    const directo =
      participantes.owner_id === usuarioId ||
      participantes.coordinador_id === usuarioId ||
      participantes.created_by_id === usuarioId ||
      participantes.equipo.has(usuarioId);
    const porDependencia = !!usuario.dependencia_id && participantes.dependencias.has(usuario.dependencia_id);

    if (!directo && !porDependencia) {
      throw new ForbiddenException(
        `El usuario (${etiqueta}) no participa en este proyecto (no es responsable ni colaborador del mismo)`,
      );
    }
  }

  private async notificarAsignacionActividad(
    actividad: Prisma.ActividadGetPayload<{ include: typeof INCLUDE }>,
    operadorId: string,
  ): Promise<void> {
    const operador = await this.prisma.usuario.findUnique({
      where: { id: operadorId },
      select: { nombre: true },
    });

    await this.prisma.notificacion.create({
      data: {
        usuario_id: actividad.responsable_id,
        titulo: 'Actividad asignada',
        mensaje: `${operador?.nombre ?? 'Un usuario'} te asignó la actividad "${actividad.titulo}" del proyecto ${actividad.proyecto?.code ?? ''}. Revísala en el módulo de Actividades o Kanban.`,
        tipo: 'ACTIVIDAD_ASIGNADA',
        proyecto_id: actividad.proyecto_id,
        actividad_id: actividad.id,
      },
    });
  }
}