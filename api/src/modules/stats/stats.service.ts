import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryStatsDto } from './dto/query-stats.dto.js';
import { Prisma, ScopeRol } from '@prisma/client';

type ProyectoScope = Prisma.ProyectoWhereInput;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen(query: QueryStatsDto) {
    const scope = await this.buildScope(query.usuario_id);

    const whereProyecto: Prisma.ProyectoWhereInput = { deleted_at: null, ...scope };
    const whereActividad: Prisma.ActividadWhereInput = { deleted_at: null };
    const whereEvidencia: Prisma.EvidenciaWhereInput = { deleted_at: null };
    const whereObservacion: Prisma.ObservacionWhereInput = { deleted_at: null };

    if (Object.keys(scope).length > 0) {
      whereActividad.proyecto = { deleted_at: null, ...scope };
      whereEvidencia.OR = [
        { proyecto: { deleted_at: null, ...scope } },
        { actividad: { proyecto: { deleted_at: null, ...scope } } },
      ];
      whereObservacion.OR = [
        { proyecto: { deleted_at: null, ...scope } },
        { actividad: { proyecto: { deleted_at: null, ...scope } } },
        { evidencia: { proyecto: { deleted_at: null, ...scope } } },
      ];
    }

    const [
      proyectos,
      proyectosPorEstado,
      actividades,
      actividadesPorEstado,
      evidencias,
      evidenciasPorEstado,
      observacionesAbiertas,
      notificaciones,
      usuarios,
      dependencias,
      proyectosPorPrioridad,
      actividadesPorPrioridad,
    ] = await Promise.all([
      this.prisma.proyecto.count({ where: whereProyecto }),
      this.prisma.proyecto.groupBy({ by: ['estado'], where: whereProyecto, _count: { _all: true } }),
      this.prisma.actividad.count({ where: whereActividad }),
      this.prisma.actividad.groupBy({ by: ['estado'], where: whereActividad, _count: { _all: true } }),
      this.prisma.evidencia.count({ where: whereEvidencia }),
      this.prisma.evidencia.groupBy({ by: ['estado'], where: whereEvidencia, _count: { _all: true } }),
      this.prisma.observacion.count({ where: { ...whereObservacion, estado: 'Abierta' } }),
      query.usuario_id
        ? this.prisma.notificacion.count({ where: { usuario_id: query.usuario_id, leida: false } })
        : Promise.resolve(0),
      this.prisma.usuario.count({ where: { deleted_at: null, estado: 'Activo' } }),
      this.prisma.dependencia.count({ where: { activa: true } }),
      this.prisma.proyecto.groupBy({ by: ['prioridad'], where: whereProyecto, _count: { _all: true } }),
      this.prisma.actividad.groupBy({ by: ['prioridad'], where: whereActividad, _count: { _all: true } }),
    ]);

    return {
      proyectos,
      proyectos_por_estado: proyectosPorEstado.map((e) => ({ estado: e.estado, count: e._count._all })),
      proyectos_por_prioridad: proyectosPorPrioridad.map((e) => ({ prioridad: e.prioridad, count: e._count._all })),
      actividades,
      actividades_por_estado: actividadesPorEstado.map((e) => ({ estado: e.estado, count: e._count._all })),
      actividades_por_prioridad: actividadesPorPrioridad.map((e) => ({ prioridad: e.prioridad, count: e._count._all })),
      evidencias,
      evidencias_por_estado: evidenciasPorEstado.map((e) => ({ estado: e.estado, count: e._count._all })),
      observaciones_abiertas: observacionesAbiertas,
      notificaciones_no_leidas: notificaciones,
      usuarios: usuarios,
      dependencias: dependencias,
    };
  }

  /**
   * Resuelve el alcance del usuario según el scope de sus roles:
   * - GLOBAL (o sin usuario): estadísticas institucionales completas.
   * - DEPENDENCIA: proyectos de su dependencia y donde su dependencia colabora.
   * - PROPIO / ASIGNADO / sin rol: proyectos donde participa directamente.
   */
  private async buildScope(usuarioId: string | undefined): Promise<ProyectoScope> {
    if (!usuarioId) {
      return {};
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        dependencia_id: true,
        usuario_roles: { select: { rol: { select: { scope: true } } } },
      },
    });

    if (!usuario) {
      return {};
    }

    const scopes = new Set(usuario.usuario_roles.map(({ rol }) => rol.scope));

    if (scopes.has(ScopeRol.GLOBAL)) {
      return {};
    }

    if (scopes.has(ScopeRol.DEPENDENCIA) && usuario.dependencia_id) {
      return {
        OR: [
          { dependencia_id: usuario.dependencia_id },
          { proyecto_dependencias: { some: { dependencia_id: usuario.dependencia_id } } },
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
}