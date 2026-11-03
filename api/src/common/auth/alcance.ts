import { Prisma, ScopeRol } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Dependencias cuyo personal ve y gestiona todos los proyectos de la institución. */
const DEPENDENCIAS_PRIVILEGIADAS = [
  'junta general administrativa',
  'gerencia',
  'dirección general de administracion',
  'direccion general de administracion',
];

/**
 * Filtro de proyectos según el alcance del usuario.
 *  - `{}` => sin restricción (rol GLOBAL o dependencia privilegiada).
 *  - `{ OR: [...] }` => solo los proyectos de su oficina o donde participa.
 *  - Usuario inexistente => `{ OR: [] }` (no ve nada).
 */
export async function buildAlcanceProyectos(
  prisma: PrismaService,
  usuarioId: string,
): Promise<Prisma.ProyectoWhereInput> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      dependencia: { select: { id: true, nombre: true } },
      usuario_roles: { select: { rol: { select: { scope: true, nombre: true } } } },
    },
  });

  if (!usuario) return { OR: [] };

  const scopes = new Set(usuario.usuario_roles.map((ur) => ur.rol.scope));
  if (scopes.has(ScopeRol.GLOBAL)) return {};

  const nombreDep = (usuario.dependencia?.nombre ?? '').toLowerCase();
  if (DEPENDENCIAS_PRIVILEGIADAS.some((k) => nombreDep.includes(k))) return {};

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

/**
 * Filtro para evidencias: solo las de proyectos de la oficina del usuario
 * (o donde participa). `null` = sin restricción (rol GLOBAL / privilegiado).
 */
export async function buildAlcanceEvidencias(
  prisma: PrismaService,
  usuarioId: string,
): Promise<Prisma.EvidenciaWhereInput | null> {
  const alcance = await buildAlcanceProyectos(prisma, usuarioId);
  if (!alcance.OR) return null;

  const proyectos = alcance.OR as Prisma.ProyectoWhereInput[];
  const proyectoScope: Prisma.ProyectoWhereInput = { deleted_at: null, OR: proyectos };

  return {
    OR: [
      { proyecto: { is: proyectoScope } },
      { actividad: { is: { deleted_at: null, proyecto: { is: proyectoScope } } } },
    ],
  };
}

/**
 * Filtro para observaciones: solo las vinculadas a proyectos/actividades/evidencias
 * de la oficina del usuario (o donde participa). `null` = sin restricción.
 */
export async function buildAlcanceObservaciones(
  prisma: PrismaService,
  usuarioId: string,
): Promise<Prisma.ObservacionWhereInput | null> {
  const alcance = await buildAlcanceProyectos(prisma, usuarioId);
  if (!alcance.OR) return null;

  const proyectos = alcance.OR as Prisma.ProyectoWhereInput[];
  const proyectoScope: Prisma.ProyectoWhereInput = { deleted_at: null, OR: proyectos };
  const evidenciaScope: Prisma.EvidenciaWhereInput = {
    deleted_at: null,
    OR: [
      { proyecto: { is: proyectoScope } },
      { actividad: { is: { deleted_at: null, proyecto: { is: proyectoScope } } } },
    ],
  };

  return {
    OR: [
      { proyecto: { is: proyectoScope } },
      { actividad: { is: { deleted_at: null, proyecto: { is: proyectoScope } } } },
      { evidencia: { is: evidenciaScope } },
    ],
  };
}

/** Indica si el usuario puede gestionar el proyecto (según su alcance). */
export async function puedeGestionarProyecto(
  prisma: PrismaService,
  usuarioId: string,
  proyectoId: string,
): Promise<boolean> {
  const alcance = await buildAlcanceProyectos(prisma, usuarioId);
  if (!alcance.OR) return true;

  const encontrado = await prisma.proyecto.findFirst({
    where: { id: proyectoId, deleted_at: null, OR: alcance.OR },
    select: { id: true },
  });
  return encontrado !== null;
}
