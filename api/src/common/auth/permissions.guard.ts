import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { DasiUser } from './dasi-user.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { buildAlcanceProyectos, puedeGestionarProyecto } from './alcance.js';

/** Módulos cuyos registros pertenecen a un proyecto (y por tanto a una oficina). */
const MODULOS_CON_PROYECTO = ['proyectos', 'actividades', 'evidencias', 'observaciones'];

interface Requirement {
  slug: string;
  accion: string;
}

interface Rule {
  anyOf: Requirement[];
}

const req = (slug: string, ...acciones: string[]): Requirement[] =>
  acciones.map((accion) => ({ slug, accion }));

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: DasiUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Debe iniciar sesión para continuar.');
    }

    if (user.roles.includes('ADMINISTRADOR')) return true;

    const rule = this.resolveRule(request);
    if (rule) {
      const autorizado = rule.anyOf.some(({ slug, accion }) =>
        user.permisos.includes(`${slug}:${accion}`),
      );

      if (!autorizado) {
        throw new ForbiddenException(
          'No tiene permisos para realizar esta acción.',
        );
      }
    }

    await this.verificarAlcance(request, user);
    return true;
  }

  /**
   * Las modificaciones solo se permiten sobre proyectos del alcance del usuario:
   * su oficina (DEPENDENCIA) o los proyectos donde participa (PROPIO/ASIGNADO).
   * Las lecturas se filtran en cada servicio.
   */
  private async verificarAlcance(request: Request, user: DasiUser): Promise<void> {
    if (request.method.toUpperCase() === 'GET') return;

    const segments = this.segmentos(request);
    const modulo = segments[0];
    if (!MODULOS_CON_PROYECTO.includes(modulo)) return;

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.sub },
      select: { dependencia_id: true },
    });
    const alcance = await buildAlcanceProyectos(this.prisma, user.sub);
    if (!alcance.OR) return; // rol GLOBAL o dependencia privilegiada

    const denegado = () =>
      new ForbiddenException(
        'Solo puede modificar proyectos de su oficina o donde participa.',
      );

    // Crear un proyecto: debe pertenecer a su oficina.
    if (modulo === 'proyectos' && segments.length === 1) {
      const body = request.body as { dependencia_id?: string } | undefined;
      if (!body?.dependencia_id || body.dependencia_id !== usuario?.dependencia_id) {
        throw denegado();
      }
      return;
    }

    const proyectoId = await this.proyectoDelRecurso(modulo, segments, request);
    if (!proyectoId) {
      // Recurso inexistente: el servicio responderá 404; POST sin proyecto es denegado.
      if (request.method.toUpperCase() === 'POST') throw denegado();
      return;
    }

    if (!(await puedeGestionarProyecto(this.prisma, user.sub, proyectoId))) {
      throw denegado();
    }
  }

  /** Resuelve el proyecto al que pertenece el recurso de la ruta o del cuerpo. */
  private async proyectoDelRecurso(
    modulo: string,
    segments: string[],
    request: Request,
  ): Promise<string | null> {
    const body = (request.body ?? {}) as {
      proyecto_id?: string;
      actividad_id?: string;
    };

    if (modulo === 'proyectos') return segments[1] ?? null;

    if (request.method.toUpperCase() === 'POST') {
      if (body.proyecto_id) return body.proyecto_id;
      if (body.actividad_id) return this.proyectoDeActividad(body.actividad_id);
      return null;
    }

    const id = segments[1];
    if (!id) return null;

    if (modulo === 'actividades') return this.proyectoDeActividad(id);

    if (modulo === 'evidencias') {
      const registro = await this.prisma.evidencia.findUnique({
        where: { id },
        select: { proyecto_id: true, actividad_id: true },
      });
      if (!registro) return null;
      return registro.proyecto_id ?? (await this.proyectoDeActividad(registro.actividad_id));
    }

    const registro = await this.prisma.observacion.findUnique({
      where: { id },
      select: { proyecto_id: true, actividad_id: true },
    });
    if (!registro) return null;
    return registro.proyecto_id ?? (await this.proyectoDeActividad(registro.actividad_id));
  }

  private async proyectoDeActividad(actividadId: string | null | undefined): Promise<string | null> {
    if (!actividadId) return null;
    const actividad = await this.prisma.actividad.findUnique({
      where: { id: actividadId },
      select: { proyecto_id: true },
    });
    return actividad?.proyecto_id ?? null;
  }

  private segmentos(request: Request): string[] {
    const path = request.originalUrl.split('?')[0].replace(/^\/api(?=\/|$)/, '');
    return path.split('/').filter(Boolean);
  }

  private resolveRule(request: Request): Rule | null {
    const path = request.originalUrl.split('?')[0].replace(/^\/api(?=\/|$)/, '');
    const segments = path.split('/').filter(Boolean);
    const modulo = segments[0];
    const method = request.method.toUpperCase();
    const subrecurso = segments[2];

    switch (modulo) {
      case 'proyectos':
        if (method === 'GET') return null;
        if (segments.length === 2 && method === 'POST') {
          return { anyOf: req('proyectos', 'Crear', 'Administrar') };
        }
        if (subrecurso === 'derivar') {
          return {
            anyOf: [
              ...req('proyectos', 'Asignar', 'Administrar'),
              ...req('workflow', 'Administrar'),
            ],
          };
        }
        if (subrecurso === 'activar-workflow' || subrecurso === 'workflow') {
          return {
            anyOf: [
              ...req('proyectos', 'Editar', 'Administrar'),
              ...req('workflow', 'Administrar', 'CambiarEstado'),
            ],
          };
        }
        if (subrecurso === 'responsabilidades') {
          return {
            anyOf: [
              ...req('proyectos', 'Asignar', 'Administrar'),
              ...req('workflow', 'Administrar'),
            ],
          };
        }
        if (subrecurso === 'estado') {
          return {
            anyOf: req(
              'proyectos',
              'CambiarEstado',
              'Aprobar',
              'Revisar',
              'Completar',
              'Administrar',
            ),
          };
        }
        if (method === 'PATCH') {
          return { anyOf: req('proyectos', 'Editar', 'Administrar') };
        }
        if (method === 'DELETE') {
          return { anyOf: req('proyectos', 'Eliminar', 'Administrar') };
        }
        return null;

      case 'actividades':
        if (method === 'GET') {
          return {
            anyOf: [
              ...req('actividades', 'Ver'),
              ...req('tareas', 'Ver'),
              ...req('kanban', 'Ver'),
              ...req('workflow', 'Ver'),
              ...req('proyectos', 'Ver'),
            ],
          };
        }
        if (subrecurso === 'estado') {
          return {
            anyOf: [
              ...req('actividades', 'CambiarEstado', 'Editar'),
              ...req('tareas', 'CambiarEstado', 'Editar'),
              ...req('kanban', 'CambiarEstado'),
            ],
          };
        }
        if (method === 'POST') {
          return {
            anyOf: [
              ...req('actividades', 'Crear'),
              ...req('tareas', 'Crear'),
            ],
          };
        }
        if (method === 'PATCH') {
          return {
            anyOf: [
              ...req('actividades', 'Editar'),
              ...req('tareas', 'Editar'),
            ],
          };
        }
        if (method === 'DELETE') {
          return {
            anyOf: [
              ...req('actividades', 'Eliminar', 'Administrar'),
              ...req('tareas', 'Editar', 'Administrar'),
            ],
          };
        }
        return null;

      case 'evidencias':
        if (method === 'GET') return { anyOf: req('evidencias', 'Ver') };
        if (subrecurso === 'estado') {
          return {
            anyOf: req('evidencias', 'Aprobar', 'Observar', 'Editar', 'Administrar'),
          };
        }
        if (method === 'POST') return { anyOf: req('evidencias', 'Crear') };
        if (method === 'PATCH') return { anyOf: req('evidencias', 'Editar') };
        if (method === 'DELETE') {
          return { anyOf: req('evidencias', 'Eliminar', 'Administrar') };
        }
        return null;

      case 'observaciones':
        if (method === 'GET') return { anyOf: req('observaciones', 'Ver') };
        if (subrecurso === 'estado') {
          return {
            anyOf: req(
              'observaciones',
              'Aprobar',
              'Observar',
              'Editar',
              'Administrar',
            ),
          };
        }
        if (method === 'POST') return { anyOf: req('observaciones', 'Crear') };
        if (method === 'PATCH') return { anyOf: req('observaciones', 'Editar') };
        if (method === 'DELETE') {
          return { anyOf: req('observaciones', 'Eliminar', 'Administrar') };
        }
        return null;

      case 'usuarios':
        if (method === 'GET') return null;
        if (method === 'POST') return { anyOf: req('usuarios', 'Crear') };
        if (method === 'PATCH') {
          return { anyOf: req('usuarios', 'Editar', 'Administrar') };
        }
        if (method === 'DELETE') {
          return { anyOf: req('usuarios', 'Eliminar', 'Administrar') };
        }
        return null;

      case 'roles':
        if (method === 'GET') return { anyOf: req('roles', 'Ver') };
        if (subrecurso === 'permisos' || method === 'DELETE') {
          return { anyOf: req('roles', 'Administrar') };
        }
        if (method === 'POST') return { anyOf: req('roles', 'Crear') };
        if (method === 'PATCH') return { anyOf: req('roles', 'Editar') };
        return null;

      case 'permisos':
        if (method === 'GET') return { anyOf: req('permisos', 'Ver') };
        if (method === 'POST') return { anyOf: req('permisos', 'Crear') };
        if (method === 'PATCH') return { anyOf: req('permisos', 'Editar') };
        if (method === 'DELETE') {
          return { anyOf: req('permisos', 'Administrar') };
        }
        return null;

      case 'modulos':
        if (method === 'GET') return { anyOf: req('modulos', 'Ver') };
        if (method === 'PATCH') return { anyOf: req('modulos', 'Editar') };
        return { anyOf: req('modulos', 'Administrar') };

      case 'dependencias':
        if (method === 'GET') return null;
        if (method === 'POST') {
          return { anyOf: req('dependencias', 'Administrar', 'Editar') };
        }
        if (method === 'PATCH') {
          return { anyOf: req('dependencias', 'Editar', 'Administrar') };
        }
        if (method === 'DELETE') {
          return { anyOf: req('dependencias', 'Administrar') };
        }
        return null;

      case 'cargos':
        if (method === 'GET') return null;
        if (method === 'POST') {
          return { anyOf: req('cargos', 'Crear', 'Administrar') };
        }
        if (method === 'PATCH') {
          return { anyOf: req('cargos', 'Editar', 'Administrar') };
        }
        if (method === 'DELETE') {
          return { anyOf: req('cargos', 'Eliminar', 'Administrar') };
        }
        return null;

      case 'auditoria':
        if (method === 'POST') return null;
        if (method === 'GET') return { anyOf: req('auditoria', 'Ver') };
        if (method === 'DELETE') {
          return { anyOf: req('auditoria', 'Exportar', 'Administrar') };
        }
        return null;

      case 'calendario':
        return { anyOf: req('calendar', 'Ver') };

      case 'notificaciones':
        return { anyOf: req('notificaciones', 'Ver') };

      case 'stats':
        return null;

      case 'auth':
      case 'health':
        return null;

      default:
        return null;
    }
  }
}
