import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProyectoDto } from './dto/create-proyecto.dto.js';
import { UpdateProyectoDto } from './dto/update-proyecto.dto.js';
import { QueryProyectosDto } from './dto/query-proyectos.dto.js';
import { CambioEstadoProyectoDto } from './dto/cambio-estado-proyecto.dto.js';
import { UpdateWorkflowDto } from './dto/update-workflow.dto.js';
import { UpdateResponsabilidadDto } from './dto/update-responsabilidad.dto.js';
import { DerivarProyectoDto } from './dto/derivar-proyecto.dto.js';
import { ActivarWorkflowDto } from './dto/activar-workflow.dto.js';
import { AgregarEtapaDto } from './dto/agregar-etapa.dto.js';
import { Prisma, EstadoProyecto, ScopeRol } from '@prisma/client';

const USER = {
  id: true,
  nombre: true,
  email: true,
  account: true,
  initials: true,
  avatar_url: true,
  dependencia: { select: { id: true, nombre: true } },
} satisfies Prisma.UsuarioSelect;

const LIST_INCLUDE = {
  owner: { select: USER },
  coordinador: { select: USER },
  created_by: { select: USER },
  dependencia: true,
  proyecto_equipo: {
    where: { usuario: { deleted_at: null } },
    include: { usuario: { select: USER } },
  },
  proyecto_dependencias: {
    include: { dependencia: true },
  },
  proyecto_workflow: { orderBy: { orden: 'asc' } },
  proyecto_responsabilidades: {
    include: { dependencia: true, responsable: { select: USER } },
  },
  _count: { select: { actividades: true, evidencias: true, observaciones: true, proyecto_equipo: true } },
} satisfies Prisma.ProyectoInclude;

const ESTADOS_OFICIALES = ['Pendiente', 'Aprobado', 'EnCurso', 'Implementado', 'EnRevision', 'Completado'] as const;

/** Transiciones permitidas del flujo oficial según el estado actual. */
const TRANSICIONES: Record<
  EstadoProyecto,
  { estado: EstadoProyecto; accion: string; sinAutoprobacion?: boolean; requiereResponsable?: boolean }[]
> = {
  Pendiente: [{ estado: 'Aprobado', accion: 'Aprobar', sinAutoprobacion: true }],
  Aprobado: [
    { estado: 'EnCurso', accion: 'CambiarEstado', requiereResponsable: true },
    { estado: 'Pendiente', accion: 'CambiarEstado', requiereResponsable: true },
  ],
  EnCurso: [{ estado: 'Implementado', accion: 'CambiarEstado', requiereResponsable: true }],
  Implementado: [{ estado: 'EnRevision', accion: 'CambiarEstado', requiereResponsable: true }],
  EnRevision: [
    { estado: 'Completado', accion: 'Completar', sinAutoprobacion: true },
    { estado: 'EnCurso', accion: 'CambiarEstado', requiereResponsable: true },
  ],
  Completado: [],
};

const ACCION_POR_ESTADO: Partial<Record<EstadoProyecto, string>> = {
  Aprobado: 'Aprobación de proyecto',
  EnCurso: 'Inicio de ejecución',
  Implementado: 'Implementación registrada',
  EnRevision: 'Pase a revisión',
  Completado: 'Proyecto completado',
  Pendiente: 'Cambio de estado',
};

/**
 * Plantilla mínima de workflow: las fases operacionales del proyecto.
 * El workflow es parte del proyecto; se instancia al aprobarlo.
 */
const FASES_PLANTILLA_DEFAULT = [
  { nombre: 'Planificación', accion: 'Definir alcance, requerimientos y plan de trabajo' },
  { nombre: 'Implementación', accion: 'Ejecutar las actividades operativas del plan' },
  { nombre: 'Pruebas', accion: 'Validar los entregables y registrar evidencias' },
  { nombre: 'Cierre', accion: 'Documentar lecciones y cerrar el proyecto' },
];

const ACTIVIDADES_BASE_POR_FASE: Record<string, string[]> = {
  Planificación: ['Definición de alcance', 'Levantamiento de requerimientos'],
  Implementación: ['Configuración del servidor', 'Configuración de la plataforma'],
  Pruebas: ['Pruebas técnicas', 'Validación de entregables'],
  Cierre: ['Documentación de cierre', 'Entrega del resultado'],
};

const DETAIL_INCLUDE: Prisma.ProyectoInclude = {
  ...LIST_INCLUDE,
  actividades: {
    where: { deleted_at: null },
    include: { responsable: { select: USER }, created_by: { select: USER } },
    orderBy: { created_at: 'desc' },
  },
  evidencias: {
    where: { deleted_at: null, actividad_id: null },
    orderBy: { created_at: 'desc' },
  },
  historial: {
    include: { usuario: { select: USER } },
    orderBy: { created_at: 'desc' },
  },
};

type ProyectoPayload = Prisma.ProyectoGetPayload<{ include: typeof LIST_INCLUDE }>;

@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildRoleScope(usuarioId: string): Promise<Record<string, unknown>> {
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

  async findAll(
    query: QueryProyectosDto,
  ): Promise<{ data: ProyectoPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, estado, prioridad, dependencia_id, owner_id, coordinador_id, created_by_id, mis, oficina, colaboro, usuario_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProyectoWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) where.estado = estado as Prisma.ProyectoWhereInput['estado'];
    if (prioridad) where.prioridad = prioridad;
    if (dependencia_id) where.dependencia_id = dependencia_id;
    if (owner_id) where.owner_id = owner_id;
    if (coordinador_id) where.coordinador_id = coordinador_id;
    if (created_by_id) where.created_by_id = created_by_id;

    // Alcance "Mis proyectos": solo los que están a cargo del usuario.
    if (mis === 'true' && usuario_id) {
      where.OR = [
        ...(where.OR ?? []),
        { owner_id: usuario_id },
        { coordinador_id: usuario_id },
        { created_by_id: usuario_id },
      ];
    }

    // Alcance por defecto según rol: GLOBAL ve todo; DEPENDENCIA ve su oficina; PROPIO/ASIGNADO ve propios.
    if (usuario_id && !(mis || oficina || colaboro)) {
      const roleScope = await this.buildRoleScope(usuario_id);
      const scopeFilter = (roleScope as Record<string, unknown>).OR;
      if (Array.isArray(scopeFilter)) {
        where.OR = [...(where.OR ?? []), ...scopeFilter];
      }
    }

    // Alcance "Proyectos de mi oficina": dependencia principal del usuario.
    if (oficina === 'true' && usuario_id) {
      await this.assertPuedeVerOficina(usuario_id);
      const dependenciaPropia = await this.dependenciaDe(usuario_id);
      if (dependenciaPropia) {
        where.OR = [
          ...(where.OR ?? []),
          { dependencia_id: dependenciaPropia },
          { proyecto_dependencias: { some: { dependencia_id: dependenciaPropia } } },
        ];
      } else {
        where.OR = [...(where.OR ?? []), { id: '' }];
      }
    }

    // Alcance "Donde colaboro": participa como equipo/collaborador pero no lo lidera.
    if (colaboro === 'true' && usuario_id) {
      const dependenciaPropia = await this.dependenciaDe(usuario_id);
      where.OR = [
        ...(where.OR ?? []),
        {
          proyecto_equipo: { some: { usuario_id } },
          owner_id: { not: usuario_id },
          coordinador_id: { not: usuario_id },
          created_by_id: { not: usuario_id },
        },
      ];
      if (dependenciaPropia) {
        where.OR.push({
          proyecto_dependencias: { some: { dependencia_id: dependenciaPropia } },
          dependencia_id: { not: dependenciaPropia },
        });
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.proyecto.findMany({
        where,
        include: LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.proyecto.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, usuarioId?: string): Promise<Prisma.ProyectoGetPayload<{ include: typeof DETAIL_INCLUDE }>> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });

    if (!proyecto || proyecto.deleted_at) {
      throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    }

    if (usuarioId) {
      await this.assertPuedeVer(id, usuarioId);
    }

    return proyecto;
  }

  async create(dto: CreateProyectoDto): Promise<ProyectoPayload> {
    const existing = await this.prisma.proyecto.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un proyecto con el código "${dto.code}"`);
    }

    await this.validateUsuario(dto.owner_id, 'owner');
    await this.validateUsuario(dto.coordinador_id, 'coordinador');
    await this.validateUsuario(dto.created_by_id, 'created_by');
    await this.validateDependencia(dto.dependencia_id);

    await this.assertCreadorEnDependencia(dto.created_by_id, dto.dependencia_id);

    const dependenciasColaboradoras = (dto.dependencias ?? []).filter((d) => d !== dto.dependencia_id);
    await this.validateUsuarioEnDependencias(dto.owner_id, 'owner', dto.dependencia_id, dependenciasColaboradoras);
    await this.validateUsuarioEnDependencias(dto.coordinador_id, 'coordinador', dto.dependencia_id, dependenciasColaboradoras);
    if (dto.equipo?.length) {
      await this.validateEquipo(dto.equipo, dto.dependencia_id, dependenciasColaboradoras);
    }

    const data: Prisma.ProyectoCreateInput = {
      code: dto.code,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      objetivo: dto.objetivo,
      prioridad: dto.prioridad,
      estado: 'Pendiente',
      riesgo: dto.riesgo,
      progreso: 0,
      fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
      fecha_fin_estimada: dto.fecha_fin_estimada ? new Date(dto.fecha_fin_estimada) : undefined,
      fecha_fin_real: dto.fecha_fin_real ? new Date(dto.fecha_fin_real) : undefined,
      owner: { connect: { id: dto.owner_id } },
      coordinador: { connect: { id: dto.coordinador_id } },
      created_by: { connect: { id: dto.created_by_id } },
      dependencia: { connect: { id: dto.dependencia_id } },
    };

    if (dto.equipo?.length) {
      data.proyecto_equipo = {
        create: dto.equipo.map((usuario_id) => ({ usuario_id })),
      };
    }

    if (dependenciasColaboradoras.length) {
      data.proyecto_dependencias = {
        create: [...new Set(dependenciasColaboradoras)].map((dependencia_id) => ({ dependencia_id })),
      };
    }

    const estado: EstadoProyecto = 'Pendiente';
    data.historial = {
      create: {
        usuario_id: dto.created_by_id,
        estado_nuevo: estado,
        accion: 'Creación de proyecto',
        comentario: 'Proyecto registrado',
      },
    };

    return this.prisma.proyecto.create({
      data,
      include: LIST_INCLUDE,
    }).then(async (proyecto) => {
      await this.notificarAsignacionProyecto(
        proyecto as Prisma.ProyectoGetPayload<{ include: typeof LIST_INCLUDE }>,
        dto.created_by_id,
      );
      return proyecto;
    });
  }

  async update(id: string, dto: UpdateProyectoDto, usuarioId?: string): Promise<ProyectoPayload> {
    const proyecto = await this.findOne(id);

    await this.assertPuedeAdministrar(proyecto, dto.usuario_id ?? usuarioId);

    const operadorId = dto.usuario_id ?? usuarioId ?? proyecto.created_by_id;
    if (dto.dependencia_id && dto.dependencia_id !== proyecto.dependencia_id) {
      if (!operadorId || !(await this.hasScopeGlobal(operadorId))) {
        throw new ForbiddenException(
          'No puede mover el proyecto a otra dependencia: el proyecto pertenece a su dependencia principal. Coordine la transferencia con el administrador',
        );
      }
    }

    if (dto.code && dto.code !== proyecto.code) {
      const existing = await this.prisma.proyecto.findFirst({
        where: { NOT: { id }, code: dto.code },
      });

      if (existing) {
        throw new ConflictException(`Ya existe otro proyecto con el código "${dto.code}"`);
      }
    }

    if (dto.owner_id) await this.validateUsuario(dto.owner_id, 'owner');
    if (dto.coordinador_id) await this.validateUsuario(dto.coordinador_id, 'coordinador');
    if (dto.dependencia_id) await this.validateDependencia(dto.dependencia_id);

    const dependenciaPrincipal = dto.dependencia_id ?? proyecto.dependencia_id;
    const colaboradoras = (
      dto.dependencias ?? proyecto.proyecto_dependencias.map((d) => d.dependencia_id)
    ).filter((d) => d !== dependenciaPrincipal);

    if (dto.owner_id) {
      await this.validateUsuarioEnDependencias(dto.owner_id, 'owner', dependenciaPrincipal, colaboradoras);
    }
    if (dto.coordinador_id) {
      await this.validateUsuarioEnDependencias(dto.coordinador_id, 'coordinador', dependenciaPrincipal, colaboradoras);
    }
    if (dto.equipo) {
      await this.validateEquipo(dto.equipo, dependenciaPrincipal, colaboradoras);
    }

    const data: Prisma.ProyectoUpdateInput = {
      code: dto.code,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      objetivo: dto.objetivo,
      prioridad: dto.prioridad,
      riesgo: dto.riesgo,
      progreso: dto.progreso,
      fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
      fecha_fin_estimada: dto.fecha_fin_estimada ? new Date(dto.fecha_fin_estimada) : undefined,
      fecha_fin_real: dto.fecha_fin_real ? new Date(dto.fecha_fin_real) : undefined,
    };

    if (dto.owner_id) data.owner = { connect: { id: dto.owner_id } };
    if (dto.coordinador_id) data.coordinador = { connect: { id: dto.coordinador_id } };
    if (dto.dependencia_id) data.dependencia = { connect: { id: dto.dependencia_id } };

    if (dto.equipo) {
      data.proyecto_equipo = {
        deleteMany: {},
        create: dto.equipo.map((usuario_id) => ({ usuario_id })),
      };
    }

    if (dto.dependencias) {
      data.proyecto_dependencias = {
        deleteMany: {},
        create: dto.dependencias
          .filter((d) => d !== (dto.dependencia_id ?? proyecto.dependencia_id))
          .map((dependencia_id) => ({ dependencia_id })),
      };
    }

    const estadoNuevo = dto.estado;
    if (estadoNuevo && estadoNuevo !== proyecto.estado) {
      await this.assertTransicionPermitida(proyecto, estadoNuevo, operadorId);

      if (estadoNuevo === 'Aprobado' && proyecto.estado === 'Pendiente') {
        await this.asegurarWorkflowAlAprobar(proyecto, operadorId);
      }

      data.historial = {
        create: {
          usuario_id: operadorId,
          estado_anterior: proyecto.estado,
          estado_nuevo: estadoNuevo,
          accion: ACCION_POR_ESTADO[estadoNuevo] ?? 'Cambio de estado',
          comentario: `Estado actualizado de ${proyecto.estado} a ${estadoNuevo}`,
        },
      };
    }

    return this.prisma.proyecto.update({
      where: { id },
      data,
      include: LIST_INCLUDE,
    }).then(async (actualizado) => {
      const asignados = new Map<string, string>();

      if (dto.owner_id && dto.owner_id !== proyecto.owner_id) {
        asignados.set(dto.owner_id, 'responsable');
      }
      if (dto.coordinador_id && dto.coordinador_id !== proyecto.coordinador_id) {
        asignados.set(dto.coordinador_id, 'coordinador');
      }
      if (dto.equipo) {
        const previos = new Set(proyecto.proyecto_equipo.map((m) => m.usuario_id));
        for (const miembroId of dto.equipo) {
          if (miembroId !== dto.owner_id && miembroId !== dto.coordinador_id && !previos.has(miembroId)) {
            asignados.set(miembroId, 'colaborador');
          }
        }
      }

      if (asignados.size) {
        const operador = await this.prisma.usuario.findUnique({
          where: { id: operadorId },
          select: { nombre: true },
        });
        const nombreOperador = operador?.nombre ?? 'Un usuario';
        const actualizadoDetalle = actualizado as Prisma.ProyectoGetPayload<{ include: typeof LIST_INCLUDE }>;

        await Promise.all(
          [...asignados.entries()].map(([usuarioId, rol]) =>
            this.prisma.notificacion.create({
              data: {
                usuario_id: usuarioId,
                titulo:
                  rol === 'responsable'
                    ? 'Te asignaron como responsable'
                    : rol === 'coordinador'
                      ? 'Te asignaron como coordinador'
                      : 'Nuevo proyecto para colaborar',
                mensaje: `${nombreOperador} te asignó como ${rol} del proyecto ${actualizadoDetalle.code} - ${actualizadoDetalle.nombre}.`,
                tipo: 'PROYECTO_ASIGNADO',
                proyecto_id: actualizadoDetalle.id,
              },
            }),
          ),
        );
      }

      return actualizado;
    });
  }

  async cambiarEstado(id: string, dto: CambioEstadoProyectoDto): Promise<ProyectoPayload> {
    const proyecto = await this.findOne(id, dto.usuario_id);

    await this.validateUsuario(dto.usuario_id, 'usuario', false);
    await this.assertTransicionPermitida(proyecto, dto.estado, dto.usuario_id);

    if (dto.estado === 'Aprobado' && proyecto.estado === 'Pendiente') {
      await this.asegurarWorkflowAlAprobar(proyecto, dto.usuario_id);
    }

    await this.prisma.historialProyecto.create({
      data: {
        proyecto_id: id,
        usuario_id: dto.usuario_id,
        estado_anterior: proyecto.estado,
        estado_nuevo: dto.estado,
        accion: ACCION_POR_ESTADO[dto.estado] ?? 'Cambio de estado',
        comentario: dto.comentario ?? `Estado actualizado de ${proyecto.estado} a ${dto.estado}`,
      },
    });

    return this.prisma.proyecto.update({
      where: { id },
      data: { estado: dto.estado },
      include: LIST_INCLUDE,
    });
  }

  async derivar(id: string, dto: DerivarProyectoDto): Promise<Prisma.ProyectoGetPayload<{ include: typeof DETAIL_INCLUDE }>> {
    const proyecto = await this.findOne(id, dto.usuario_id);
    await this.assertPuedeAdministrar(proyecto, dto.usuario_id);

    if (proyecto.estado !== 'Pendiente') {
      throw new BadRequestException(
        'Solo se puede derivar un proyecto en estado Pendiente; los demás siguen su flujo normal',
      );
    }

    const yaDerivado = await this.prisma.historialProyecto.findFirst({
      where: { proyecto_id: id, accion: 'Derivación a Administración General' },
      select: { id: true },
    });

    if (!yaDerivado) {
      await this.prisma.historialProyecto.create({
        data: {
          proyecto_id: id,
          usuario_id: dto.usuario_id,
          estado_anterior: 'Pendiente',
          estado_nuevo: 'Pendiente',
          accion: 'Derivación a Administración General',
          comentario:
            dto.comentario ??
            'Proyecto derivado a Administración General para su revisión y aprobación',
        },
      });

      const aprobador = await this.prisma.proyectoResponsabilidad.findFirst({
        where: { proyecto_id: id, etapa: 'Aprobado' },
        select: { responsable_id: true },
      });

      if (aprobador?.responsable_id) {
        await this.prisma.notificacion.create({
          data: {
            usuario_id: aprobador.responsable_id,
            titulo: 'Proyecto por revisar',
            mensaje: `El proyecto ${proyecto.code} - ${proyecto.nombre} fue derivado para su revisión y aprobación.`,
            tipo: 'PROYECTO_PENDIENTE_APROBACION',
            proyecto_id: id,
          },
        });
      }
    }

    return this.findOne(id, dto.usuario_id);
  }

  /**
   * Activa manualmente el workflow del proyecto (fases operacionales y
   * actividades base) cuando aún no lo tiene, por ejemplo para un proyecto
   * Pendiente o aprobado antes de esta versión. Es idempotente por verificacion
   * de fases existentes.
   */
  async activarWorkflow(
    id: string,
    dto: ActivarWorkflowDto,
  ): Promise<Prisma.ProyectoGetPayload<{ include: typeof DETAIL_INCLUDE }>> {
    const proyecto = await this.findOne(id, dto.usuario_id);
    await this.assertPuedeAdministrar(proyecto, dto.usuario_id);

    const existentes = await this.prisma.proyectoWorkflow.count({
      where: { proyecto_id: id },
    });
    if (existentes > 0) {
      throw new ConflictException('El proyecto ya tiene un workflow activo');
    }

    await this.asegurarWorkflowAlAprobar(proyecto, dto.usuario_id, 'manual', dto.comentario);
    return this.findOne(id, dto.usuario_id);
  }

  /**
   * Agrega una etapa adicional al workflow del proyecto. El responsable debe
   * ser miembro del equipo del proyecto (no se admiten externos).
   */
  async agregarEtapa(
    id: string,
    dto: AgregarEtapaDto,
  ): Promise<Prisma.ProyectoWorkflowGetPayload<{ include: { dependencia: true; responsable: { select: typeof USER } } }>> {
    const proyecto = await this.findOne(id, dto.usuario_id);
    await this.assertPuedeAdministrar(proyecto, dto.usuario_id);
    const etapaNormalizada = this.normalizeEtapa(dto.etapa);

    const existe = await this.prisma.proyectoWorkflow.findUnique({
      where: { proyecto_id_etapa: { proyecto_id: id, etapa: etapaNormalizada } },
      select: { id: true },
    });
    if (existe) {
      throw new ConflictException(`La etapa "${etapaNormalizada}" ya existe en el workflow del proyecto`);
    }

    let responsableId: string | undefined;
    if (dto.responsable_id) {
      const esEquipo = await this.prisma.proyectoEquipo.findUnique({
        where: { proyecto_id_usuario_id: { proyecto_id: id, usuario_id: dto.responsable_id } },
        select: { id: true },
      });
      if (!esEquipo) {
        throw new BadRequestException('El responsable debe ser miembro del equipo del proyecto');
      }
      responsableId = dto.responsable_id;
    }

    const ultimoOrden = await this.prisma.proyectoWorkflow.aggregate({
      where: { proyecto_id: id },
      _max: { orden: true },
    });

    return this.prisma.proyectoWorkflow.create({
      data: {
        proyecto_id: id,
        etapa: etapaNormalizada,
        orden: (ultimoOrden._max.orden ?? 0) + 1,
        estado: 'Pendiente',
        dependencia_id: proyecto.dependencia_id,
        responsable_id: responsableId ?? proyecto.coordinador_id,
        accion_requerida: dto.accion_requerida?.trim() || null,
        started_at: null,
        completed_at: null,
      },
      include: { dependencia: true, responsable: { select: USER } },
    });
  }

  /**
   * Instancia el workflow interno (fases operacionales) y las actividades base
   * de cada fase. Se invoca al aprobar un proyecto o manualmente desde
   * "crear workflow" del proyecto; el coordinador ajustará luego responsables
   * y fechas.
   */
  private async asegurarWorkflowAlAprobar(
    proyecto: {
      id: string;
      code: string;
      dependencia_id: string;
      owner_id: string;
      coordinador_id: string;
      created_by_id: string;
      estado: string;
    },
    usuarioId: string,
    origen: 'aprobacion' | 'manual' = 'aprobacion',
    comentario?: string,
  ): Promise<void> {
    const existentes = await this.prisma.proyectoWorkflow.count({
      where: { proyecto_id: proyecto.id },
    });
    if (existentes > 0) return;

    for (const [index, fase] of FASES_PLANTILLA_DEFAULT.entries()) {
      await this.prisma.proyectoWorkflow.create({
        data: {
          proyecto_id: proyecto.id,
          etapa: fase.nombre,
          orden: index + 1,
          estado: index === 0 ? 'EnCurso' : 'Pendiente',
          dependencia_id: proyecto.dependencia_id,
          responsable_id: proyecto.coordinador_id,
          accion_requerida: fase.accion,
          started_at: index === 0 ? new Date() : null,
          completed_at: null,
        },
      });
    }

    let secuencia = await this.prisma.actividad.count({
      where: { proyecto_id: proyecto.id, deleted_at: null },
    });
    const anio = (proyecto.code.match(/(\d{4})/) ?? [])[1] ?? String(new Date().getFullYear());
    const correlativo = (proyecto.code.match(/(\d+)$/) ?? [])[1] ?? '0000';

    for (const fase of FASES_PLANTILLA_DEFAULT) {
      for (const titulo of ACTIVIDADES_BASE_POR_FASE[fase.nombre] ?? []) {
        secuencia += 1;
        await this.prisma.actividad.create({
          data: {
            titulo,
            code: `ACT-${anio}-${correlativo.padStart(4, '0')}-${String(secuencia).padStart(2, '0')}`,
            fase: fase.nombre,
            proyecto_id: proyecto.id,
            responsable_id: proyecto.coordinador_id,
            created_by_id: proyecto.created_by_id,
            prioridad: 'Media',
            estado: 'Pendiente',
            progreso: 0,
          },
        });
      }
    }

    const historialExiste = await this.prisma.historialProyecto.findFirst({
      where: { proyecto_id: proyecto.id, accion: 'Activación de workflow' },
      select: { id: true },
    });
    if (!historialExiste) {
      await this.prisma.historialProyecto.create({
        data: {
          proyecto_id: proyecto.id,
          usuario_id: usuarioId,
          estado_anterior: (proyecto.estado as EstadoProyecto) ?? 'Pendiente',
          estado_nuevo: (proyecto.estado as EstadoProyecto) ?? 'Aprobado',
          accion: 'Activación de workflow',
          comentario:
            comentario ??
            (origen === 'manual'
              ? 'Workflow con fases y actividades base activado manualmente por el coordinador'
              : 'Workflow con fases y actividades base creado tras la aprobación del proyecto'),
        },
      });
    }

    await this.prisma.notificacion.create({
      data: {
        usuario_id: proyecto.coordinador_id,
        titulo: 'Workflow activado',
        mensaje:
          origen === 'manual'
            ? `El proyecto ${proyecto.code} tiene ahora su workflow activo. Configúralo desde Workflow.`
            : `El proyecto ${proyecto.code} fue aprobado. Su workflow de fases y actividades base quedó activo.`,
        tipo: 'PROYECTO_ASIGNADO',
        proyecto_id: proyecto.id,
      },
    });
  }

  async updateWorkflow(
    id: string,
    etapa: string,
    dto: UpdateWorkflowDto,
  ): Promise<Prisma.ProyectoWorkflowGetPayload<{ include: { dependencia: true; responsable: { select: typeof USER } } }>> {
    const proyecto = await this.findOne(id);
    const etapaNormalizada = this.normalizeEtapa(etapa);

    const workflow = await this.prisma.proyectoWorkflow.findUnique({
      where: { proyecto_id_etapa: { proyecto_id: id, etapa: etapaNormalizada } },
    });

    if (!workflow) {
      throw new NotFoundException(`Etapa "${etapaNormalizada}" no está definida en el workflow del proyecto`);
    }

    if (dto.usuario_id && dto.estado) {
      await this.assertPuedeAvanzarEtapa(proyecto, etapaNormalizada, dto.usuario_id, workflow.responsable_id);
    }

    const data: Prisma.ProyectoWorkflowUpdateInput = {
      estado: dto.estado,
      accion_requerida: dto.accion_requerida,
      started_at: dto.started_at ? new Date(dto.started_at) : undefined,
      completed_at: dto.completed_at ? new Date(dto.completed_at) : undefined,
    };

    if (dto && 'started_at' in dto && dto.started_at === null) data.started_at = null;
    if (dto && 'completed_at' in dto && dto.completed_at === null) data.completed_at = null;

    if (dto.dependencia_id) {
      await this.validateDependencia(dto.dependencia_id);
      data.dependencia = { connect: { id: dto.dependencia_id } };
    }

    if (dto.responsable_id) {
      await this.validateUsuario(dto.responsable_id, 'responsable', false);
      data.responsable = { connect: { id: dto.responsable_id } };
    }

    const actualizado = await this.prisma.proyectoWorkflow.update({
      where: { id: workflow.id },
      data,
      include: { dependencia: true, responsable: { select: USER } },
    });

    if (
      dto.estado === 'EnCurso' &&
      dto.usuario_id &&
      actualizado.responsable_id &&
      actualizado.responsable_id !== dto.usuario_id
    ) {
      const operador = await this.prisma.usuario.findUnique({
        where: { id: dto.usuario_id },
        select: { nombre: true },
      });
      await this.prisma.notificacion.create({
        data: {
          usuario_id: actualizado.responsable_id,
          titulo: 'Etapa que te corresponde',
          mensaje: `${operador?.nombre ?? 'El encargado'} inició la etapa "${this.etapaLabel(etapaNormalizada)}" del proyecto ${proyecto.code} - ${proyecto.nombre}. Te toca revisar y avanzar esta fase.`,
          tipo: 'PROYECTO_ASIGNADO',
          proyecto_id: id,
        },
      });
    }

    return actualizado;
  }

  private async assertPuedeAvanzarEtapa(
    proyecto: Prisma.ProyectoGetPayload<{ include: typeof DETAIL_INCLUDE }>,
    etapa: string,
    usuarioId: string,
    etapaResponsableId?: string | null,
  ): Promise<void> {
    const responsabilidad = await this.prisma.proyectoResponsabilidad.findFirst({
      where: { proyecto_id: proyecto.id, etapa: etapa as EstadoProyecto },
      select: { responsable_id: true },
      orderBy: { created_at: 'asc' },
    });

    const esResponsableEtapa =
      etapaResponsableId === usuarioId || responsabilidad?.responsable_id === usuarioId;

    if (
      proyecto.owner_id !== usuarioId &&
      proyecto.coordinador_id !== usuarioId &&
      !esResponsableEtapa
    ) {
      throw new ForbiddenException(
        'No tienes permiso para avanzar la etapa: solo el responsable del proyecto, el coordinador o el responsable de la etapa pueden hacerlo. Como colaborador solo puedes trabajar tus actividades asignadas.',
      );
    }
  }

  private async notificarAsignacionProyecto(
    proyecto: Prisma.ProyectoGetPayload<{ include: typeof LIST_INCLUDE }>,
    createdById: string,
  ): Promise<void> {
    const destinatarios = new Map<string, string>();
    if (proyecto.owner_id !== createdById) destinatarios.set(proyecto.owner_id, 'responsable');
    if (proyecto.coordinador_id !== createdById) destinatarios.set(proyecto.coordinador_id, 'coordinador');
    for (const miembro of proyecto.proyecto_equipo ?? []) {
      const uid = miembro.usuario_id;
      if (uid !== createdById && !destinatarios.has(uid)) {
        destinatarios.set(uid, 'colaborador');
      }
    }

    if (!destinatarios.size) return;

    const operador = await this.prisma.usuario.findUnique({
      where: { id: createdById },
      select: { nombre: true },
    });
    const nombreOperador = operador?.nombre ?? 'Un usuario';

    await Promise.all(
      [...destinatarios.entries()].map(([usuarioId, rol]) =>
        this.prisma.notificacion.create({
          data: {
            usuario_id: usuarioId,
            titulo:
              rol === 'responsable'
                ? 'Te asignaron como responsable'
                : rol === 'coordinador'
                  ? 'Te asignaron como coordinador'
                  : 'Nuevo proyecto para colaborar',
            mensaje: `${nombreOperador} te asignó como ${rol} del proyecto ${proyecto.code} - ${proyecto.nombre}.`,
            tipo: 'PROYECTO_ASIGNADO',
            proyecto_id: proyecto.id,
          },
        }),
      ),
    );
  }

  private etapaLabel(etapa: string): string {
    const etiquetas: Record<string, string> = {
      Pendiente: 'Pendiente',
      Aprobado: 'Aprobado',
      EnCurso: 'En curso',
      Implementado: 'Implementado',
      EnRevision: 'En revisión',
      Completado: 'Completado',
      Planificación: 'Planificación',
      Implementación: 'Implementación',
      Pruebas: 'Pruebas',
      Cierre: 'Cierre',
    };
    return etiquetas[etapa] ?? etapa;
  }

  async updateResponsabilidad(
    id: string,
    etapa: string,
    dto: UpdateResponsabilidadDto,
  ): Promise<Prisma.ProyectoResponsabilidadGetPayload<{ include: { dependencia: true; responsable: { select: typeof USER } } }>> {
    await this.findOne(id);
    const etapaNormalizada = this.normalizeEtapa(etapa);

    const responsabilidad = await this.prisma.proyectoResponsabilidad.findUnique({
      where: { proyecto_id_etapa: { proyecto_id: id, etapa: etapaNormalizada as EstadoProyecto } },
    });

    if (!responsabilidad) {
      throw new NotFoundException(`No existe responsabilidad para la etapa "${etapaNormalizada}"`);
    }

    const data: Prisma.ProyectoResponsabilidadUpdateInput = {
      accion: dto.accion,
      habilitado: dto.habilitado,
    };

    if (dto.responsable_id) {
      await this.validateUsuario(dto.responsable_id, 'responsable', false);
      data.responsable = { connect: { id: dto.responsable_id } };
    }

    return this.prisma.proyectoResponsabilidad.update({
      where: { id: responsabilidad.id },
      data,
      include: { dependencia: true, responsable: { select: USER } },
    });
  }

  async remove(id: string, usuarioId?: string): Promise<{ message: string }> {
    const proyecto = await this.findOne(id);

    if (usuarioId) {
      await this.assertPuedeAdministrar(proyecto, usuarioId);
    }

    await this.prisma.proyecto.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Proyecto eliminado correctamente' };
  }

  private async validateUsuario(id: string, label: string, checkDeleted = true): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!usuario || (checkDeleted && usuario.deleted_at)) {
      throw new BadRequestException(`Usuario (${label}) con id ${id} no encontrado`);
    }
  }

  private async validateDependencia(id: string): Promise<void> {
    const dependencia = await this.prisma.dependencia.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!dependencia) {
      throw new BadRequestException(`Dependencia con id ${id} no encontrada`);
    }
  }

  private normalizeEtapa(etapa: string): string {
    if (!etapa || !etapa.trim()) {
      throw new BadRequestException('La etapa o fase no puede estar vacía');
    }
    return etapa.trim();
  }

  private async dependenciaDe(usuarioId: string): Promise<string | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { dependencia_id: true },
    });
    return usuario?.dependencia_id ?? null;
  }

  private async hasScopeGlobal(usuarioId: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        usuario_roles: { some: { rol: { scope: ScopeRol.GLOBAL } } },
      },
      select: { id: true },
    });
    return usuario !== null;
  }

  /** Aplica el alcance definido por buildRoleScope: GLOBAL/privilegiados ven todo; el resto solo lo que les corresponde. */
  private async assertPuedeVer(proyectoId: string, usuarioId: string): Promise<void> {
    const roleScope = await this.buildRoleScope(usuarioId);
    const scopeFilter = (roleScope as Record<string, unknown>).OR;
    if (!scopeFilter) return;

    const encontrado = await this.prisma.proyecto.findFirst({
      where: {
        id: proyectoId,
        deleted_at: null,
        OR: scopeFilter as Prisma.ProyectoWhereInput[],
      },
      select: { id: true },
    });

    if (!encontrado) {
      throw new ForbiddenException('No tiene permiso para ver este proyecto');
    }
  }

  private async contextoPermisos(
    usuarioId: string,
  ): Promise<{ acciones: Set<string>; globalScope: boolean }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        dependencia: { select: { nombre: true } },
        usuario_roles: {
          select: {
            rol: {
              select: {
                scope: true,
                rol_permisos: {
                  select: {
                    permiso: {
                      select: {
                        accion: true,
                        modulo: { select: { slug: true, activo: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return { acciones: new Set(), globalScope: false };
    }

    let globalScope = usuario.usuario_roles.some(({ rol }) => rol.scope === ScopeRol.GLOBAL);
    const nombreDep = (usuario.dependencia?.nombre ?? '').toLowerCase();
    const privilegiados = ['junta general administrativa', 'gerencia', 'dirección general de administracion', 'direccion general de administracion'];
    if (privilegiados.some((k) => nombreDep.includes(k))) globalScope = true;

    const acciones = new Set<string>();
    for (const { rol } of usuario.usuario_roles) {
      for (const rp of rol.rol_permisos) {
        if (rp.permiso.modulo.activo && rp.permiso.modulo.slug === 'proyectos') {
          acciones.add(rp.permiso.accion);
        }
      }
    }

    return { acciones, globalScope };
  }

  /** Valida que el cambio de estado respete el flujo oficial y los permisos/rol del usuario. */
  private async assertTransicionPermitida(
    proyecto: {
      owner_id: string;
      coordinador_id: string;
      created_by_id: string;
      estado: EstadoProyecto;
    },
    estadoNuevo: EstadoProyecto,
    usuarioId: string,
  ): Promise<void> {
    const reglas = TRANSICIONES[proyecto.estado] ?? [];
    const regla = reglas.find((r) => r.estado === estadoNuevo);

    if (!regla) {
      throw new BadRequestException(
        `La transición de "${proyecto.estado}" a "${estadoNuevo}" no está permitida en el flujo oficial`,
      );
    }

    const esResponsable =
      proyecto.owner_id === usuarioId ||
      proyecto.coordinador_id === usuarioId ||
      proyecto.created_by_id === usuarioId;

    const { acciones, globalScope } = await this.contextoPermisos(usuarioId);

    if (!globalScope && !acciones.has(regla.accion)) {
      throw new ForbiddenException(
        `No tiene permiso "proyectos:${regla.accion}" para realizar esta transición`,
      );
    }

    if (regla.sinAutoprobacion && esResponsable) {
      throw new ForbiddenException(
        'El responsable del proyecto no puede aprobar, revisar ni cerrar sus propios proyectos',
      );
    }

    if (regla.requiereResponsable && !esResponsable && !globalScope) {
      throw new ForbiddenException(
        'Solo el responsable del proyecto puede realizar esta transición',
      );
    }
  }

  /**
   * Permite ver los proyectos de la oficina (dependencia) del usuario solo si
   * tiene el permiso 'proyectos-oficina:Ver' o un rol con alcance GLOBAL.
   */
  private async assertPuedeVerOficina(usuarioId: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        usuario_roles: {
          select: {
            rol: {
              select: {
                scope: true,
                rol_permisos: {
                  select: {
                    permiso: {
                      select: { accion: true, modulo: { select: { slug: true, activo: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const autorizado = usuario.usuario_roles.some(({ rol }) => {
      if (rol.scope === ScopeRol.GLOBAL) return true;
      return rol.rol_permisos.some(
        (rp) => rp.permiso.modulo.activo && rp.permiso.modulo.slug === 'proyectos-oficina' && rp.permiso.accion === 'Ver',
      );
    });

    if (!autorizado) {
      throw new ForbiddenException(
        'No tiene permiso "Ver proyectos de mi oficina"; solicite el permiso correspondiente al administrador',
      );
    }
  }

  private async assertCreadorEnDependencia(usuarioId: string, dependenciaId: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        dependencia_id: true,
        usuario_dependencias: { select: { dependencia_id: true, es_principal: true } },
      },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario creador no encontrado');
    }

    const esPrincipal =
      usuario.dependencia_id === dependenciaId ||
      usuario.usuario_dependencias.some(
        (vinculo) => vinculo.dependencia_id === dependenciaId && vinculo.es_principal,
      );

    if (!esPrincipal) {
      throw new ForbiddenException(
        'No puede crear proyectos de una dependencia distinta a la suya. Coordine la creación con el responsable de esa dependencia.',
      );
    }
  }

  private async validateUsuarioEnDependencias(
    usuarioId: string,
    label: string,
    dependenciaPrincipal: string,
    colaboradoras: string[],
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, dependencia_id: true, deleted_at: true },
    });

    if (!usuario || usuario.deleted_at) {
      throw new BadRequestException(`Usuario (${label}) con id ${usuarioId} no encontrado`);
    }

    const permitidas = new Set([dependenciaPrincipal, ...colaboradoras]);
    if (!usuario.dependencia_id || !permitidas.has(usuario.dependencia_id)) {
      throw new BadRequestException(
        `El usuario (${label}) debe pertenecer a la dependencia principal o a las colaboradoras del proyecto`,
      );
    }
  }

  private async validateEquipo(
    usuarioIds: string[],
    dependenciaPrincipal: string,
    colaboradoras: string[],
  ): Promise<void> {
    const permitidas = new Set([dependenciaPrincipal, ...colaboradoras]);

    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: [...new Set(usuarioIds)] }, deleted_at: null },
      select: { id: true, dependencia_id: true },
    });

    const encontrados = new Set(usuarios.map((u) => u.id));
    for (const id of usuarioIds) {
      if (!encontrados.has(id)) {
        throw new BadRequestException(`Usuario de equipo con id ${id} no encontrado`);
      }
    }

    for (const usuario of usuarios) {
      if (usuario.dependencia_id && !permitidas.has(usuario.dependencia_id)) {
        throw new BadRequestException(
          `El usuario «${usuario.id}» no pertenece a las dependencias principales o colaboradoras del proyecto`,
        );
      }
    }
  }

  private async assertPuedeAdministrar(
    proyecto: { owner_id: string; coordinador_id: string; created_by_id: string },
    usuarioId: string | undefined,
  ): Promise<void> {
    if (!usuarioId) {
      throw new ForbiddenException('Se requiere el usuario que realiza la operación');
    }

    const esResponsable =
      proyecto.owner_id === usuarioId ||
      proyecto.coordinador_id === usuarioId ||
      proyecto.created_by_id === usuarioId;

    if (esResponsable) {
      return;
    }

    const administrador = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        usuario_roles: { some: { rol: { scope: { in: [ScopeRol.GLOBAL] } } } },
      },
      select: { id: true },
    });

    if (!administrador) {
      throw new ForbiddenException('No tiene permiso para administrar este proyecto');
    }
  }
}