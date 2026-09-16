/**
 * DASI - Seed de datos reales institucionales
 * =====================================================================
 * Limpia cualquier dato TEST_DASI previo y crea un conjunto real para
 * la institución: Gerencia, Junta General Administrativa (JGA),
 * Administración General y Departamento de TI, con sus cargos, roles,
 * módulos, permisos, usuarios y un proyecto demo con su flujo completo.
 *
 * - Solo interactúa con la base de datos mediante Prisma (sin SQL manual).
 * - Es idempotente: si un registro ya existe, se reutiliza.
 * - Al inicio elimina restos de datos TEST (prefijo TEST_DASI / test_dasi).
 * - No sube archivos (R2 no está implementado todavía).
 * - No modifica el schema ni crea migraciones.
 *
 * Uso (desde la carpeta api/):
 *   node prisma/seed.mjs
 * =====================================================================
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { disposeExternalPool: false });
const prisma = new PrismaClient({ adapter });

const daysFromNow = (days, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/** Busca un registro existente o lo crea. Retorna el id (o undefined si no hay dato válido). */
async function getOrCreate(model, find, createData) {
  const existing = await prisma[model].findFirst({ where: find });
  let row = existing;
  if (!row) {
    row = await prisma[model].create({ data: createData });
  }
  return row;
}

/** Crea un vínculo único (join) sin duplicar. */
async function upsertLink(model, uniqueWhere, createData) {
  await prisma[model].upsert({ where: uniqueWhere, update: {}, create: createData });
}

async function collectIds(model, where) {
  const rows = await prisma[model].findMany({ where, select: { id: true } });
  return rows.map((r) => r.id);
}

async function deleteMany(model, where) {
  const result = await prisma[model].deleteMany({ where });
  return result.count;
}

/** Elimina cualquier dato TEST_DASI restante de instalaciones previas. */
async function limpiarDatosTest() {
  const testUsers = await collectIds('usuario', { OR: [{ account: { startsWith: 'test_dasi' } }, { email: { startsWith: 'test_dasi' } }] });
  const testProjects = await collectIds('proyecto', { OR: [{ code: { startsWith: 'TEST_DASI' } }, { owner_id: { in: testUsers } }, { coordinador_id: { in: testUsers } }, { created_by_id: { in: testUsers } }] });
  const testModulos = await collectIds('modulo', { nombre: { startsWith: 'TEST_DASI' } });
  const testPermisos = await collectIds('permiso', { modulo_id: { in: testModulos } });
  const testRoles = await collectIds('rol', { nombre: { startsWith: 'TEST_DASI' } });
  const testDependencias = await collectIds('dependencia', { code: { startsWith: 'TEST_DASI' } });
  const testCargos = await collectIds('cargo', { nombre: { startsWith: 'TEST_DASI' } });
  const testActividades = await collectIds('actividad', { OR: [{ proyecto_id: { in: testProjects } }, { code: { startsWith: 'ACT-2026' } }] });
  const testEvidencias = await collectIds('evidencia', { OR: [{ nombre: { startsWith: 'TEST_DASI' } }, { actividad_id: { in: testActividades } }] });
  const testObservaciones = await collectIds('observacion', { OR: [{ contenido: { startsWith: 'TEST_DASI' } }, { proyecto_id: { in: testProjects } }, { actividad_id: { in: testActividades } }, { evidencia_id: { in: testEvidencias } }] });

  let total = 0;

  total += await deleteMany('auditoria', { OR: [{ descripcion: { startsWith: 'TEST_DASI' } }, { entidad_id: { in: [...testUsers, ...testProjects, ...testActividades] } }] });
  total += await deleteMany('eventoCalendario', { OR: [{ titulo: { startsWith: 'TEST_DASI' } }, { usuario_id: { in: testUsers } }, { proyecto_id: { in: testProjects } }, { actividad_id: { in: testActividades } }] });
  total += await deleteMany('notificacion', { OR: [{ titulo: { startsWith: 'TEST_DASI' } }, { usuario_id: { in: testUsers } }] });
  total += await deleteMany('historialProyecto', { OR: [{ proyecto_id: { in: testProjects } }, { usuario_id: { in: testUsers } }] });
  total += await deleteMany('observacion', { id: { in: testObservaciones } });
  total += await deleteMany('evidencia', { id: { in: testEvidencias } });
  total += await deleteMany('actividad', { id: { in: testActividades } });
  total += await deleteMany('proyectoResponsabilidad', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyectoWorkflow', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyectoEquipo', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyectoDependencia', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyecto', { id: { in: testProjects } });
  total += await deleteMany('usuarioDependencia', { usuario_id: { in: testUsers } });
  total += await deleteMany('usuarioCargo', { usuario_id: { in: testUsers } });
  total += await deleteMany('usuarioRol', { usuario_id: { in: testUsers } });
  total += await deleteMany('usuario', { id: { in: testUsers } });
  total += await deleteMany('rolPermiso', { OR: [{ rol_id: { in: testRoles } }, { permiso_id: { in: testPermisos } }] });
  total += await deleteMany('permiso', { id: { in: testPermisos } });
  total += await deleteMany('modulo', { id: { in: testModulos } });
  total += await deleteMany('rol', { id: { in: testRoles } });
  total += await deleteMany('cargo', { id: { in: testCargos } });
  total += await deleteMany('dependencia', { id: { in: testDependencias } });

  if (total > 0) {
    console.log(`  → ${total} registros TEST_DASI antiguos eliminados`);
  }
}

async function main() {
  console.log('Limpieza de datos TEST previos...');
  await limpiarDatosTest();

  /* ------------------------------------------------------------------ */
  /* 1. DEPENDENCIAS (gerencia real)                                     */
  /* ------------------------------------------------------------------ */
  const depGerencia = await getOrCreate(
    'dependencia',
    { code: 'DEP-GERENCIA' },
    {
      code: 'DEP-GERENCIA',
      nombre: 'Gerencia',
      tipo: 'Direccion',
      director: 'Gerente General',
    },
  );
  const depDga = await getOrCreate(
    'dependencia',
    { code: 'DEP-DGA' },
    {
      code: 'DEP-DGA',
      nombre: 'Administración General',
      tipo: 'Direccion',
      director: 'Director General de Administración',
      parent_id: depGerencia?.id,
    },
  );
  const depJga = await getOrCreate(
    'dependencia',
    { code: 'DEP-JGA' },
    {
      code: 'DEP-JGA',
      nombre: 'Junta General Administrativa',
      tipo: 'JGA',
      director: 'Presidente de la Junta General Administrativa',
      parent_id: depGerencia?.id,
    },
  );
  const depTi = await getOrCreate(
    'dependencia',
    { code: 'DEP-TI' },
    {
      code: 'DEP-TI',
      nombre: 'Departamento de TI',
      tipo: 'Oficina',
      director: 'Jefe de Departamento de TI',
      parent_id: depDga?.id,
    },
  );
  const depEscuela = await getOrCreate(
    'dependencia',
    { code: 'DEP-ESC' },
    {
      code: 'DEP-ESC',
      nombre: 'Escuela Técnica',
      tipo: 'Escuela',
      director: 'Director de Escuela Técnica',
      parent_id: depDga?.id,
    },
  );

  /* ------------------------------------------------------------------ */
  /* 2. CARGOS                                                           */
  /* ------------------------------------------------------------------ */
  const cargoGerente = await getOrCreate(
    'cargo',
    { nombre: 'Gerente General' },
    { nombre: 'Gerente General', descripcion: 'Máxima autoridad de la institución.' },
  );
  const cargoDirectorAdmin = await getOrCreate(
    'cargo',
    { nombre: 'Director General de Administración' },
    { nombre: 'Director General de Administración', descripcion: 'Responsable de la administración institucional.' },
  );
  const cargoPresidenteJga = await getOrCreate(
    'cargo',
    { nombre: 'Presidente de la Junta General Administrativa' },
    { nombre: 'Presidente de la Junta General Administrativa', descripcion: 'Preside la Junta General Administrativa.' },
  );
  const cargoJefeTi = await getOrCreate(
    'cargo',
    { nombre: 'Jefe de Departamento de TI' },
    { nombre: 'Jefe de Departamento de TI', descripcion: 'Lidera el departamento de tecnología.' },
  );
  const cargoAnalista = await getOrCreate(
    'cargo',
    { nombre: 'Analista de TI' },
    { nombre: 'Analista de TI', descripcion: 'Ejecuta y analiza tareas técnicas del departamento.' },
  );

  /* ------------------------------------------------------------------ */
  /* 3. ROLES                                                            */
  /* ------------------------------------------------------------------ */
  const rolAdministrador = await getOrCreate(
    'rol',
    { nombre: 'ADMINISTRADOR' },
    { nombre: 'ADMINISTRADOR', descripcion: 'Acceso global a todos los módulos y acciones del sistema.', scope: 'GLOBAL' },
  );
  const rolGerencia = await getOrCreate(
    'rol',
    { nombre: 'GERENCIA' },
    { nombre: 'GERENCIA', descripcion: 'Visión global de todos los proyectos de la institución.', scope: 'GLOBAL' },
  );
  const rolJga = await getOrCreate(
    'rol',
    { nombre: 'JGA' },
    { nombre: 'JGA', descripcion: 'Junta General Administrativa: visión global y supervisión institucional.', scope: 'GLOBAL' },
  );
  const rolAdministracion = await getOrCreate(
    'rol',
    { nombre: 'ADMINISTRACION_GENERAL' },
    { nombre: 'ADMINISTRACION_GENERAL', descripcion: 'Administración General: revisión y aprobación de proyectos.', scope: 'GLOBAL' },
  );
  const rolTi = await getOrCreate(
    'rol',
    { nombre: 'DEPARTAMENTO_TI' },
    { nombre: 'DEPARTAMENTO_TI', descripcion: 'Departamento de TI: gestor de dependencia y flujo técnico.', scope: 'DEPENDENCIA' },
  );
  const rolColaborador = await getOrCreate(
    'rol',
    { nombre: 'COLABORADOR' },
    { nombre: 'COLABORADOR', descripcion: 'Ejecuta y actualiza las actividades que le asignan.', scope: 'PROPIO' },
  );
  const rolConsulta = await getOrCreate(
    'rol',
    { nombre: 'CONSULTA' },
    { nombre: 'CONSULTA', descripcion: 'Solo lectura: puede ver y observar la información autorizada.', scope: 'PROPIO' },
  );

  /* ------------------------------------------------------------------ */
  /* 4. MÓDULOS + PERMISOS                                               */
  /* ------------------------------------------------------------------ */
  const MODULOS = [
    { slug: 'dashboard', nombre: 'Dashboard' },
    { slug: 'proyectos', nombre: 'Proyectos' },
    { slug: 'mis-proyectos', nombre: 'Mis proyectos' },
    { slug: 'proyectos-oficina', nombre: 'Proyectos de mi oficina' },
    { slug: 'proyectos-colaboracion', nombre: 'Proyectos donde colaboro' },
    { slug: 'tareas', nombre: 'Tareas' },
    { slug: 'kanban', nombre: 'Kanban' },
    { slug: 'workflow', nombre: 'Workflow' },
    { slug: 'actividades', nombre: 'Actividades' },
    { slug: 'observaciones', nombre: 'Observaciones' },
    { slug: 'evidencias', nombre: 'Evidencias' },
    { slug: 'reportes', nombre: 'Reportes' },
    { slug: 'indicadores', nombre: 'Indicadores' },
    { slug: 'usuarios', nombre: 'Usuarios' },
    { slug: 'roles', nombre: 'Roles' },
    { slug: 'permisos', nombre: 'Permisos' },
    { slug: 'modulos', nombre: 'Módulos' },
    { slug: 'dependencias', nombre: 'Dependencias' },
    { slug: 'cargos', nombre: 'Cargos' },
    { slug: 'administracion', nombre: 'Panel de administración' },
    { slug: 'configuracion', nombre: 'Configuración' },
    { slug: 'calendar', nombre: 'Calendario' },
    { slug: 'profile', nombre: 'Perfil' },
    { slug: 'notificaciones', nombre: 'Notificaciones' },
    { slug: 'auditoria', nombre: 'Auditoría' },
  ];

  const ACCIONES_MODULO = {
    dashboard: ['Ver'],
    proyectos: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar', 'Exportar', 'Aprobar', 'Revisar', 'Completar'],
    'mis-proyectos': ['Ver'],
    'proyectos-oficina': ['Ver'],
    'proyectos-colaboracion': ['Ver'],
    tareas: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar'],
    kanban: ['Ver', 'CambiarEstado'],
    workflow: ['Ver', 'CambiarEstado', 'Aprobar', 'Administrar'],
    actividades: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar'],
    observaciones: ['Ver', 'Crear', 'Aprobar', 'Observar'],
    evidencias: ['Ver', 'Crear', 'Editar', 'Aprobar', 'Observar', 'Exportar'],
    reportes: ['Ver', 'Exportar'],
    indicadores: ['Ver', 'Exportar'],
    usuarios: ['Ver', 'Crear', 'Editar', 'Eliminar', 'Administrar'],
    roles: ['Ver', 'Crear', 'Editar', 'Administrar'],
    permisos: ['Ver', 'Crear', 'Editar', 'Administrar'],
    modulos: ['Ver', 'Editar', 'Administrar'],
    dependencias: ['Ver', 'Editar', 'Administrar'],
    cargos: ['Ver', 'Crear', 'Editar', 'Eliminar', 'Administrar'],
    administracion: ['Ver', 'Administrar'],
    configuracion: ['Ver', 'Editar', 'Administrar'],
    calendar: ['Ver'],
    profile: ['Ver', 'Editar'],
    notificaciones: ['Ver'],
    auditoria: ['Ver', 'Exportar'],
  };

  const modulos = {};
  const permisosPorModulo = {};

  for (const m of MODULOS) {
    const modulo = await getOrCreate(
      'modulo',
      { slug: m.slug },
      { slug: m.slug, nombre: m.nombre, descripcion: `Módulo ${m.nombre}`, activo: true },
    );
    if (modulo) modulos[m.slug] = modulo;
  }

  for (const m of MODULOS) {
    const modulo = modulos[m.slug];
    if (!modulo) continue;
    permisosPorModulo[m.slug] = [];
    for (const accion of ACCIONES_MODULO[m.slug]) {
      const permiso = await getOrCreate(
        'permiso',
        { modulo_id: modulo.id, accion },
        { modulo_id: modulo.id, accion },
      );
      if (permiso) permisosPorModulo[m.slug].push(permiso);
    }
  }

  /**
   * Otorga permisos a un rol.
   * - forAdmin=true: todas las acciones de todos los módulos.
   * - Si no es admin, otorga todas las acciones de cada módulo incluido en `slugs`,
   *   salvo que `accionesPorSlug[slug]` defina una lista concreta de acciones.
   */
  async function grantPermisos(rolId, slugs, forAdmin = false, accionesPorSlug = {}) {
    if (!rolId) return;
    for (const [slug, permisos] of Object.entries(permisosPorModulo)) {
      if (!forAdmin && !slugs.includes(slug)) continue;
      const accionList = forAdmin ? undefined : accionesPorSlug[slug];
      for (const permiso of permisos) {
        if (accionList && !accionList.includes(permiso.accion)) continue;
        await upsertLink(
          'rolPermiso',
          { rol_id_permiso_id: { rol_id: rolId, permiso_id: permiso.id } },
          { rol_id: rolId, permiso_id: permiso.id },
        );
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 5. USUARIOS                                                         */
  /* ------------------------------------------------------------------ */
  const usuarioAdmin = await getOrCreate(
    'usuario',
    { account: 'administrador' },
    {
      email: 'administrador@dasi.local',
      nombre: 'Administrador',
      account: 'administrador',
      initials: 'AD',
      estado: 'Activo',
      dependencia_id: depGerencia?.id,
      cargo_id: cargoGerente?.id,
    },
  );
  const usuarioGerente = await getOrCreate(
    'usuario',
    { account: 'gerencia' },
    {
      email: 'gerencia@dasi.local',
      nombre: 'Gerencia',
      account: 'gerencia',
      initials: 'GE',
      estado: 'Activo',
      dependencia_id: depGerencia?.id,
      cargo_id: cargoGerente?.id,
    },
  );
  const usuarioJga = await getOrCreate(
    'usuario',
    { account: 'jga' },
    {
      email: 'jga@dasi.local',
      nombre: 'Junta General Administrativa',
      account: 'jga',
      initials: 'JG',
      estado: 'Activo',
      dependencia_id: depJga?.id,
      cargo_id: cargoPresidenteJga?.id,
    },
  );
  const usuarioDirectorAdmin = await getOrCreate(
    'usuario',
    { account: 'juan' },
    {
      email: 'juan@dasi.local',
      nombre: 'Juan',
      account: 'juan',
      initials: 'JU',
      estado: 'Activo',
      dependencia_id: depDga?.id,
      cargo_id: cargoDirectorAdmin?.id,
    },
  );
  const usuarioJefeTi = await getOrCreate(
    'usuario',
    { account: 'cristh' },
    {
      email: 'christ@dasi.local',
      nombre: 'Christ',
      account: 'cristh',
      initials: 'CH',
      estado: 'Activo',
      dependencia_id: depTi?.id,
      cargo_id: cargoJefeTi?.id,
    },
  );
  const usuarioTecnicoTi = await getOrCreate(
    'usuario',
    { account: 'jhonatan' },
    {
      email: 'jhonatan@dasi.local',
      nombre: 'JHONATAN',
      account: 'jhonatan',
      initials: 'JH',
      estado: 'Activo',
      dependencia_id: depTi?.id,
      cargo_id: cargoAnalista?.id,
    },
  );

  const asignarRol = (usuarioId, rolId) =>
    upsertLink(
      'usuarioRol',
      { usuario_id_rol_id: { usuario_id: usuarioId, rol_id: rolId } },
      { usuario_id: usuarioId, rol_id: rolId },
    );
  const asignarDependencia = (usuarioId, dependenciaId) =>
    upsertLink(
      'usuarioDependencia',
      { usuario_id_dependencia_id: { usuario_id: usuarioId, dependencia_id: dependenciaId } },
      { usuario_id: usuarioId, dependencia_id: dependenciaId, es_principal: true },
    );

  await asignarRol(usuarioAdmin.id, rolAdministrador.id);
  await asignarRol(usuarioGerente.id, rolGerencia.id);
  await asignarRol(usuarioJga.id, rolJga.id);
  await asignarRol(usuarioDirectorAdmin.id, rolAdministracion.id);
  await asignarRol(usuarioJefeTi.id, rolTi.id);
  await asignarRol(usuarioTecnicoTi.id, rolColaborador.id);

  await asignarDependencia(usuarioAdmin.id, depGerencia.id);
  await asignarDependencia(usuarioGerente.id, depGerencia.id);
  await asignarDependencia(usuarioJga.id, depJga.id);
  await asignarDependencia(usuarioDirectorAdmin.id, depDga.id);
  await asignarDependencia(usuarioJefeTi.id, depTi.id);
  await asignarDependencia(usuarioTecnicoTi.id, depTi.id);

  const ALL_SLUGS = MODULOS.map((m) => m.slug);
  const VISION_GLOBAL_SLUGS = [
    'dashboard', 'proyectos', 'mis-proyectos', 'proyectos-oficina', 'proyectos-colaboracion',
    'tareas', 'kanban', 'workflow',
    'actividades', 'observaciones', 'evidencias', 'reportes', 'indicadores',
    'calendar', 'profile', 'notificaciones', 'auditoria',
  ];
  const TI_SLUGS = [
    'dashboard', 'proyectos', 'mis-proyectos', 'proyectos-oficina', 'proyectos-colaboracion',
    'tareas', 'kanban', 'workflow',
    'actividades', 'observaciones', 'evidencias', 'reportes', 'indicadores',
    'calendar', 'profile', 'notificaciones', 'auditoria',
  ];
  const COLABORADOR_SLUGS = [
    'dashboard', 'mis-proyectos', 'proyectos-colaboracion',
    'tareas', 'kanban', 'workflow',
    'actividades', 'observaciones', 'evidencias', 'calendar', 'profile', 'notificaciones',
  ];
  const CONSULTA_SLUGS = [
    'dashboard', 'mis-proyectos', 'proyectos-colaboracion',
    'tareas', 'kanban', 'workflow',
    'actividades', 'observaciones', 'evidencias', 'reportes', 'indicadores',
    'calendar', 'profile', 'notificaciones', 'auditoria',
  ];

  const soloVer = (slug) => ({ [slug]: ['Ver'] });

  await grantPermisos(rolAdministrador.id, ALL_SLUGS, true);
  await grantPermisos(rolGerencia.id, VISION_GLOBAL_SLUGS);
  await grantPermisos(rolJga.id, VISION_GLOBAL_SLUGS);
  await grantPermisos(rolAdministracion.id, VISION_GLOBAL_SLUGS, false, {
    proyectos: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Aprobar', 'Revisar'],
    observaciones: ['Ver', 'Crear', 'Aprobar', 'Observar'],
    evidencias: ['Ver', 'Crear', 'Editar', 'Aprobar', 'Observar'],
  });
  await grantPermisos(rolTi.id, TI_SLUGS, false, {
    proyectos: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar'],
  });
  await grantPermisos(rolColaborador.id, COLABORADOR_SLUGS);
  await grantPermisos(rolConsulta.id, CONSULTA_SLUGS, false, {
    proyectos: ['Ver'],
    tareas: ['Ver'],
    actividades: ['Ver'],
    observaciones: ['Ver', 'Observar'],
    evidencias: ['Ver', 'Observar'],
  });

  /* ------------------------------------------------------------------ */
  /* 6. PROYECTOS                                                        */
  /* ------------------------------------------------------------------ */
  const proyectos = {};
  async function crearProyecto(clave, data, owner, coordinador, creador, dependencia) {
    const proyecto = await getOrCreate(
      'proyecto',
      { code: data.code },
      { ...data, owner_id: owner, coordinador_id: coordinador, created_by_id: creador, dependencia_id: dependencia },
    );
    proyectos[clave] = proyecto;
  }

  await crearProyecto(
    'pry1',
    {
      code: 'PRY-2026-0001',
      nombre: 'Implementación de plataforma de gestión TI',
      descripcion: 'Proyecto institucional: implementación de la plataforma de gestión TI.',
      objetivo: 'Proveer a la institución de una plataforma centralizada de gestión de TI.',
      prioridad: 'Alta',
      estado: 'Aprobado',
      riesgo: false,
      progreso: 0,
      fecha_inicio: daysFromNow(0),
      fecha_fin_estimada: daysFromNow(60),
    },
    usuarioJefeTi.id,
    usuarioJefeTi.id,
    usuarioJefeTi.id,
    depTi.id,
  );
  await crearProyecto(
    'pry2',
    {
      code: 'PRY-2026-0002',
      nombre: 'Automatización de inventario de activos',
      descripcion: 'Proyecto sin participación de JHONATAN (caso de visibilidad restringida).',
      objetivo: 'Digitalizar el inventario de activos institucionales.',
      prioridad: 'Baja',
      estado: 'Pendiente',
      riesgo: false,
      progreso: 0,
      fecha_inicio: daysFromNow(5),
      fecha_fin_estimada: daysFromNow(75),
    },
    usuarioJefeTi.id,
    usuarioJefeTi.id,
    usuarioJefeTi.id,
    depTi.id,
  );

  await upsertLink(
    'proyectoDependencia',
    { proyecto_id_dependencia_id: { proyecto_id: proyectos.pry1.id, dependencia_id: depTi.id } },
    { proyecto_id: proyectos.pry1.id, dependencia_id: depTi.id },
  );
  await upsertLink(
    'proyectoDependencia',
    { proyecto_id_dependencia_id: { proyecto_id: proyectos.pry2.id, dependencia_id: depTi.id } },
    { proyecto_id: proyectos.pry2.id, dependencia_id: depTi.id },
  );

  async function agregarEquipo(proyectoId, usuarioId) {
    await upsertLink(
      'proyectoEquipo',
      { proyecto_id_usuario_id: { proyecto_id: proyectoId, usuario_id: usuarioId } },
      { proyecto_id: proyectoId, usuario_id: usuarioId },
    );
  }
  await agregarEquipo(proyectos.pry1.id, usuarioJefeTi.id);
  await agregarEquipo(proyectos.pry1.id, usuarioTecnicoTi.id);
  await agregarEquipo(proyectos.pry2.id, usuarioJefeTi.id);

  /* Proyecto demo con vencimiento cercano: dispara avisos y resumen de login */
  await crearProyecto(
    'pry3',
    {
      code: 'PRY-2026-0003',
      nombre: 'Digitalización de trámites documentarios',
      descripcion: 'Proyecto demo: digitalización de trámites con vencimiento próximo.',
      objetivo: 'Agilizar los trámites institucionales mediante su digitalización.',
      prioridad: 'Alta',
      estado: 'EnCurso',
      riesgo: true,
      progreso: 30,
      fecha_inicio: daysFromNow(-10),
      fecha_fin_estimada: daysFromNow(4),
    },
    usuarioJefeTi.id,
    usuarioTecnicoTi.id,
    usuarioJefeTi.id,
    depTi.id,
  );
  await upsertLink(
    'proyectoDependencia',
    { proyecto_id_dependencia_id: { proyecto_id: proyectos.pry3.id, dependencia_id: depTi.id } },
    { proyecto_id: proyectos.pry3.id, dependencia_id: depTi.id },
  );
  await agregarEquipo(proyectos.pry3.id, usuarioJefeTi.id);
  await agregarEquipo(proyectos.pry3.id, usuarioTecnicoTi.id);

  async function crearEtapas(proyectoId, etapas) {
    for (const e of etapas) {
      await prisma.proyectoWorkflow.upsert({
        where: { proyecto_id_etapa: { proyecto_id: proyectoId, etapa: e.etapa } },
        update: {},
        create: {
          proyecto_id: proyectoId,
          etapa: e.etapa,
          orden: e.orden,
          estado: e.estado,
          dependencia_id: e.dependencia_id,
          responsable_id: e.responsable_id,
          accion_requerida: e.accion,
          started_at: e.estado === 'EnCurso' ? new Date() : e.completed ? daysFromNow(-10) : null,
          completed_at: e.completed ? daysFromNow(-5) : null,
        },
      });
    }
  }

  await crearEtapas(proyectos.pry1.id, [
    { etapa: 'Planificación', orden: 1, estado: 'EnCurso', dependencia_id: depTi.id, responsable_id: usuarioJefeTi.id, accion: 'Definir alcance, requerimientos y plan de trabajo' },
    { etapa: 'Implementación', orden: 2, estado: 'Pendiente', dependencia_id: depTi.id, responsable_id: usuarioJefeTi.id, accion: 'Ejecutar las actividades operativas del plan' },
    { etapa: 'Pruebas', orden: 3, estado: 'Pendiente', dependencia_id: depTi.id, responsable_id: usuarioJefeTi.id, accion: 'Validar los entregables y registrar evidencias' },
    { etapa: 'Cierre', orden: 4, estado: 'Pendiente', dependencia_id: depTi.id, responsable_id: usuarioJefeTi.id, accion: 'Documentar lecciones y cerrar el proyecto' },
  ]);

  async function crearResponsabilidad(proyectoId, etapa, dependenciaId, responsableId, accion, habilitado = true) {
    await prisma.proyectoResponsabilidad.upsert({
      where: { proyecto_id_etapa: { proyecto_id: proyectoId, etapa } },
      update: {},
      create: { proyecto_id: proyectoId, etapa, dependencia_id: dependenciaId, responsable_id: responsableId, accion, habilitado },
    });
  }
  await crearResponsabilidad(proyectos.pry1.id, 'Aprobado', depDga.id, usuarioDirectorAdmin.id, 'Aprobar el proyecto');
  await crearResponsabilidad(proyectos.pry1.id, 'EnCurso', depTi.id, usuarioJefeTi.id, 'Ejecutar el plan');
  await crearResponsabilidad(proyectos.pry1.id, 'EnRevision', depDga.id, usuarioDirectorAdmin.id, 'Revisión final');

  async function crearHistorial(proyectoId, usuarioId, accion, estadoNuevo, comentario, estadoAnterior = null) {
    const existe = await prisma.historialProyecto.findFirst({
      where: { proyecto_id: proyectoId, accion },
    });
    if (existe) return;
    await prisma.historialProyecto.create({
      data: {
        proyecto_id: proyectoId,
        usuario_id: usuarioId,
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo,
        accion,
        comentario,
      },
    });
  }
  await crearHistorial(proyectos.pry1.id, usuarioJefeTi.id, 'Creación de proyecto', 'Pendiente', 'Proyecto registrado por Christ (Jefe de TI).');
  await crearHistorial(proyectos.pry1.id, usuarioJefeTi.id, 'Derivación a Administración General', 'Pendiente', 'Proyecto derivado a Administración General para su revisión y aprobación.');
  await crearHistorial(proyectos.pry1.id, usuarioDirectorAdmin.id, 'Aprobación de proyecto', 'Aprobado', 'Juan aprueba el proyecto y DASI activa el workflow con fases y actividades base.', 'Pendiente');
  await crearHistorial(proyectos.pry1.id, usuarioDirectorAdmin.id, 'Activación de workflow', 'Aprobado', 'Workflow con fases y actividades base creado tras la aprobación del proyecto.', 'Pendiente');
  await crearHistorial(proyectos.pry2.id, usuarioJefeTi.id, 'Creación de proyecto', 'Pendiente', 'Proyecto registrado por Christ (Jefe de TI).');
  await crearHistorial(proyectos.pry2.id, usuarioJefeTi.id, 'Derivación a Administración General', 'Pendiente', 'Proyecto derivado a Administración General para su revisión y aprobación.');

  /* ------------------------------------------------------------------ */
  /* 7. ACTIVIDADES                                                      */
  /* ------------------------------------------------------------------ */
  const actividades = {};
  async function crearActividad(clave, data) {
    const actividad = await getOrCreate(
      'actividad',
      { titulo: data.titulo, proyecto_id: data.proyecto_id },
      data,
    );
    actividades[clave] = actividad;
  }

  await crearActividad('a_pry1_1', {
    titulo: 'Configuración del servidor',
    code: 'ACT-2026-0001-01',
    fase: 'Implementación',
    descripcion: 'Instalación y configuración inicial del servidor de la plataforma.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioTecnicoTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Alta',
    estado: 'Pendiente',
    progreso: 0,
    fecha_inicio: daysFromNow(3),
    fecha_fin_estimada: daysFromNow(20),
  });
  await crearActividad('a_pry1_2', {
    titulo: 'Pruebas técnicas',
    code: 'ACT-2026-0001-02',
    fase: 'Pruebas',
    descripcion: 'Pruebas de integración y validación de la plataforma.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioTecnicoTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Media',
    estado: 'Pendiente',
    progreso: 0,
    fecha_inicio: daysFromNow(21),
    fecha_fin_estimada: daysFromNow(45),
  });
  await crearActividad('a_pry1_3', {
    titulo: 'Definición de alcance',
    code: 'ACT-2026-0001-03',
    fase: 'Planificación',
    descripcion: 'Definición del alcance del proyecto.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioJefeTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Alta',
    estado: 'Pendiente',
    progreso: 0,
  });
  await crearActividad('a_pry1_4', {
    titulo: 'Levantamiento de requerimientos',
    code: 'ACT-2026-0001-04',
    fase: 'Planificación',
    descripcion: 'Levantamiento de requerimientos con las áreas.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioJefeTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Alta',
    estado: 'Pendiente',
    progreso: 0,
  });
  await crearActividad('a_pry1_5', {
    titulo: 'Configuración de la plataforma',
    code: 'ACT-2026-0001-05',
    fase: 'Implementación',
    descripcion: 'Habilitación y configuración funcional de la plataforma.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioTecnicoTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Alta',
    estado: 'Pendiente',
    progreso: 0,
    fecha_inicio: daysFromNow(8),
    fecha_fin_estimada: daysFromNow(30),
  });
  await crearActividad('a_pry1_6', {
    titulo: 'Validación de entregables',
    code: 'ACT-2026-0001-06',
    fase: 'Pruebas',
    descripcion: 'Validación funcional de los entregables con el coordinador.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioTecnicoTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Media',
    estado: 'Pendiente',
    progreso: 0,
    fecha_inicio: daysFromNow(46),
    fecha_fin_estimada: daysFromNow(60),
  });
  await crearActividad('a_pry1_7', {
    titulo: 'Documentación de cierre',
    code: 'ACT-2026-0001-07',
    fase: 'Cierre',
    descripcion: 'Elaboración de la documentación de cierre.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioJefeTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Media',
    estado: 'Pendiente',
    progreso: 0,
  });
  await crearActividad('a_pry1_8', {
    titulo: 'Entrega del resultado',
    code: 'ACT-2026-0001-08',
    fase: 'Cierre',
    descripcion: 'Entrega formal del resultado a la institución.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioJefeTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Media',
    estado: 'Pendiente',
    progreso: 0,
  });

  /* Actividades demo con vencimiento cercano: disparan avisos y resumen de login */
  await crearActividad('a_pry1_9', {
    titulo: 'Entrega de informe de avance',
    code: 'ACT-2026-0001-09',
    fase: 'Planificación',
    descripcion: 'Informe de avance del proyecto con corte semanal.',
    proyecto_id: proyectos.pry1.id,
    responsable_id: usuarioJefeTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Alta',
    estado: 'EnCurso',
    progreso: 40,
    fecha_inicio: daysFromNow(-5),
    fecha_fin_estimada: daysFromNow(2),
  });
  await crearActividad('a_pry2_1', {
    titulo: 'Validación de inventario con las áreas',
    code: 'ACT-2026-0002-01',
    fase: 'Implementación',
    descripcion: 'Validación del inventario de activos con las áreas usuarias.',
    proyecto_id: proyectos.pry2.id,
    responsable_id: usuarioTecnicoTi.id,
    created_by_id: usuarioJefeTi.id,
    prioridad: 'Media',
    estado: 'Pendiente',
    progreso: 0,
    fecha_inicio: daysFromNow(1),
    fecha_fin_estimada: daysFromNow(5),
  });

  /* ------------------------------------------------------------------ */
  /* 8. EVIDENCIAS (solo texto; sin archivos, R2 pendiente)              */
  /* ------------------------------------------------------------------ */
  const evidencias = {};
  async function crearEvidencia(clave, data) {
    const evidencia = await getOrCreate(
      'evidencia',
      { nombre: data.nombre, actividad_id: data.actividad_id },
      data,
    );
    evidencias[clave] = evidencia;
  }

  await crearEvidencia('e1', {
    nombre: 'Evidencia de configuración',
    descripcion: 'Registro de la configuración inicial del servidor.',
    actividad_id: actividades.a_pry1_1.id,
    usuario_id: usuarioTecnicoTi.id,
    estado: 'Pendiente',
  });
  await crearEvidencia('e2', {
    nombre: 'Evidencia de pruebas técnicas',
    descripcion: 'Resultados de las pruebas técnicas (sin archivo adjunto).',
    actividad_id: actividades.a_pry1_2.id,
    usuario_id: usuarioTecnicoTi.id,
    estado: 'EnRevision',
  });

  /* ------------------------------------------------------------------ */
  /* 9. OBSERVACIONES (con hilo padre/hijo)                              */
  /* ------------------------------------------------------------------ */
  await getOrCreate(
    'observacion',
    { contenido: 'Observación general sobre la plataforma de gestión TI.' },
    { contenido: 'Observación general sobre la plataforma de gestión TI.', proyecto_id: proyectos.pry1.id, usuario_id: usuarioDirectorAdmin.id, estado: 'Abierta' },
  );
  await getOrCreate(
    'observacion',
    { contenido: 'Observación sobre la configuración del servidor.' },
    { contenido: 'Observación sobre la configuración del servidor.', actividad_id: actividades.a_pry1_1.id, usuario_id: usuarioDirectorAdmin.id, estado: 'Abierta' },
  );
  const obsPadre = await getOrCreate(
    'observacion',
    { contenido: 'Observación sobre la evidencia de configuración.' },
    { contenido: 'Observación sobre la evidencia de configuración.', evidencia_id: evidencias.e1.id, usuario_id: usuarioDirectorAdmin.id, estado: 'Respondida' },
  );
  await getOrCreate(
    'observacion',
    { contenido: 'Respuesta a la observación anterior.' },
    { contenido: 'Respuesta a la observación anterior.', evidencia_id: evidencias.e1.id, parent_id: obsPadre?.id, usuario_id: usuarioTecnicoTi.id, estado: 'Respondida' },
  );

  /* ------------------------------------------------------------------ */
  /* 10. NOTIFICACIONES                                                  */
  /* ------------------------------------------------------------------ */
  await getOrCreate(
    'notificacion',
    { titulo: 'Proyecto creado', usuario_id: usuarioJefeTi.id },
    { usuario_id: usuarioJefeTi.id, titulo: 'Proyecto creado', mensaje: 'Recuerda que el proyecto está pendiente de aprobación.', tipo: 'PROYECTO_PENDIENTE_APROBACION', proyecto_id: proyectos.pry1.id },
  );
  await getOrCreate(
    'notificacion',
    { titulo: 'Proyecto por revisar', usuario_id: usuarioDirectorAdmin.id },
    { usuario_id: usuarioDirectorAdmin.id, titulo: 'Proyecto por revisar', mensaje: 'El proyecto PRY-2026-0001 fue derivado para su revisión y aprobación.', tipo: 'PROYECTO_PENDIENTE_APROBACION', proyecto_id: proyectos.pry1.id },
  );
  await getOrCreate(
    'notificacion',
    { titulo: 'Workflow activado', usuario_id: usuarioJefeTi.id },
    { usuario_id: usuarioJefeTi.id, titulo: 'Workflow activado', mensaje: 'El proyecto PRY-2026-0001 fue aprobado. Su workflow de fases y actividades base quedó activo.', tipo: 'PROYECTO_ASIGNADO', proyecto_id: proyectos.pry1.id },
  );
  await getOrCreate(
    'notificacion',
    { titulo: 'Actividad asignada', usuario_id: usuarioTecnicoTi.id },
    { usuario_id: usuarioTecnicoTi.id, titulo: 'Actividad asignada', mensaje: 'Se te asignó la actividad de configuración del servidor.', tipo: 'ACTIVIDAD_ASIGNADA', actividad_id: actividades.a_pry1_1.id },
  );
  await getOrCreate(
    'notificacion',
    { titulo: 'Evidencia pendiente', usuario_id: usuarioDirectorAdmin.id },
    { usuario_id: usuarioDirectorAdmin.id, titulo: 'Evidencia pendiente', mensaje: 'Existe una evidencia por revisar.', tipo: 'EVIDENCIA_PENDIENTE', actividad_id: actividades.a_pry1_2.id, leida: true },
  );

  /* ------------------------------------------------------------------ */
  /* 11. CALENDARIO                                                      */
  /* ------------------------------------------------------------------ */
  await getOrCreate(
    'eventoCalendario',
    { titulo: 'Reunión de seguimiento', usuario_id: usuarioJefeTi.id },
    { titulo: 'Reunión de seguimiento', descripcion: 'Revisión de avance de la plataforma de gestión TI.', fecha_inicio: daysFromNow(2, 9), fecha_fin: daysFromNow(2, 10), tipo: 'REUNION', usuario_id: usuarioJefeTi.id, proyecto_id: proyectos.pry1.id, color: '#3C50E0' },
  );
  await getOrCreate(
    'eventoCalendario',
    { titulo: 'ACT-2026-0001-01 · Configuración del servidor', usuario_id: usuarioTecnicoTi.id },
    { titulo: 'ACT-2026-0001-01 · Configuración del servidor', descripcion: 'Configuración del servidor', fecha_inicio: daysFromNow(5, 11), fecha_fin: daysFromNow(5, 12), tipo: 'ACTIVIDAD', usuario_id: usuarioTecnicoTi.id, actividad_id: actividades.a_pry1_1.id, color: '#10B981' },
  );
  await getOrCreate(
    'eventoCalendario',
    { titulo: 'Hito de proyecto', usuario_id: usuarioJefeTi.id },
    { titulo: 'Hito de proyecto', descripcion: 'Hito programado de la plataforma de gestión TI.', fecha_inicio: daysFromNow(10), fecha_fin: daysFromNow(10), todo_dia: true, tipo: 'PROYECTO', usuario_id: usuarioJefeTi.id, proyecto_id: proyectos.pry1.id, color: '#F59E0B' },
  );
  await getOrCreate(
    'eventoCalendario',
    { titulo: 'Sesión de Junta', usuario_id: usuarioJga.id },
    { titulo: 'Sesión de Junta', descripcion: 'Revisión de avances institucionales.', fecha_inicio: daysFromNow(8), fecha_fin: daysFromNow(8), todo_dia: true, tipo: 'REUNION', usuario_id: usuarioJga.id, color: '#8B5CF6' },
  );
  await getOrCreate(
    'eventoCalendario',
    { titulo: 'Comité de gerencia', usuario_id: usuarioGerente.id },
    { titulo: 'Comité de gerencia', descripcion: 'Seguimiento de cartera de proyectos.', fecha_inicio: daysFromNow(3, 9), fecha_fin: daysFromNow(3, 12), tipo: 'REUNION', usuario_id: usuarioGerente.id, proyecto_id: proyectos.pry1.id, color: '#3C50E0' },
  );
  await getOrCreate(
    'eventoCalendario',
    { titulo: 'Revisión de administración', usuario_id: usuarioDirectorAdmin.id },
    { titulo: 'Revisión de administración', descripcion: 'Auditoría de ejecución presupuestaria.', fecha_inicio: daysFromNow(6), fecha_fin: daysFromNow(6), todo_dia: true, tipo: 'REUNION', usuario_id: usuarioDirectorAdmin.id, proyecto_id: proyectos.pry2.id, color: '#F59E0B' },
  );

  /* ------------------------------------------------------------------ */
  /* 12. AUDITORÍA                                                       */
  /* ------------------------------------------------------------------ */
  await getOrCreate(
    'auditoria',
    { descripcion: 'Inicio de sesión simulado.' },
    { usuario_id: usuarioAdmin.id, accion: 'LOGIN', modulo: 'AUTH', entidad: 'Usuario', entidad_id: usuarioAdmin.id, descripcion: 'Inicio de sesión simulado.', ip_address: '127.0.0.1' },
  );
  await getOrCreate(
    'auditoria',
    { descripcion: 'Registro de actividad.' },
    { usuario_id: usuarioJefeTi.id, accion: 'CREAR', modulo: 'Actividades', entidad: 'Actividad', entidad_id: actividades.a_pry1_1.id, descripcion: 'Registro de actividad.' },
  );
  await getOrCreate(
    'auditoria',
    { descripcion: 'Actualización de proyecto.' },
    { usuario_id: usuarioJefeTi.id, accion: 'ACTUALIZAR', modulo: 'Proyectos', entidad: 'Proyecto', entidad_id: proyectos.pry1.id, descripcion: 'Actualización de proyecto.' },
  );

  /* ------------------------------------------------------------------ */
  /* RESUMEN                                                             */
  /* ------------------------------------------------------------------ */
  const [totalDependencias, totalCargos, totalRoles, totalModulos, totalPermisos, totalUsuarios, totalProyectos, totalActividades, totalEvidencias, totalObservaciones, totalNotificaciones, totalEventos, totalAuditoria, totalWorkflow, totalConsultas] =
    await Promise.all([
      prisma.dependencia.count(),
      prisma.cargo.count(),
      prisma.rol.count(),
      prisma.modulo.count(),
      prisma.permiso.count(),
      prisma.usuario.count(),
      prisma.proyecto.count(),
      prisma.actividad.count(),
      prisma.evidencia.count(),
      prisma.observacion.count(),
      prisma.notificacion.count(),
      prisma.eventoCalendario.count(),
      prisma.auditoria.count(),
      prisma.proyectoWorkflow.count(),
      prisma.rol.count({ where: { nombre: 'CONSULTA' } }),
    ]);

  console.log('================================================');
  console.log('SEED DASI COMPLETADO (datos institucionales reales)');
  console.log('================================================');
  console.log(`  Dependencias : ${totalDependencias}`);
  console.log(`  Cargos       : ${totalCargos}`);
  console.log(`  Roles        : ${totalRoles}`);
  console.log(`  Módulos      : ${totalModulos}`);
  console.log(`  Permisos     : ${totalPermisos}`);
  console.log(`  Usuarios     : ${totalUsuarios}`);
  console.log(`  Proyectos    : ${totalProyectos}`);
  console.log(`  Actividades  : ${totalActividades}`);
  console.log(`  Evidencias   : ${totalEvidencias}`);
  console.log(`  Observaciones: ${totalObservaciones}`);
  console.log(`  Notificaciones: ${totalNotificaciones}`);
  console.log(`  Eventos      : ${totalEventos}`);
  console.log(`  Auditoría    : ${totalAuditoria}`);
  console.log(`  Fases        : ${totalWorkflow}`);
  console.log('------------------------------------------------');
  console.log('6 cuentas reales:');
  console.log('  administrador / gerencia / jga / juan / cristh / jhonatan');
  console.log('Jerarquía: Gerencia -> (JGA, Administración General -> Departamento de TI)');
  console.log('Flujo: Christ (cristh) crea PRY-2026-0001 -> lo deriva -> Juan (juan)');
  console.log('  aprueba y DASI activa workflow (fases) + actividades base ->');
  console.log('  Christ administra/asigna a JHONATAN (jhonatan) -> JHONATAN ejecuta');
  console.log('  lo asignado -> Gerencia (gerencia) y JGA (jga) supervisan global.');
  console.log('PRY-2026-0002 queda Pendiente y derivado, sin participación de JHONATAN.');
  console.log(`Rol CONSULTA (solo lectura): ${totalConsultas}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (err) => {
    console.error('ERROR en el seed DASI:', err);
    process.exitCode = 1;
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  });