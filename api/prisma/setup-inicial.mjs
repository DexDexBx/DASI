/**
 * DASI - Inicialización de la base de datos (idempotente).
 *
 * Crea, o actualiza si ya existen, lo siguiente. Puede ejecutarse varias veces
 * sin duplicar ni borrar datos:
 *   1. Roles institucionales y sus permisos.
 *   2. Módulos y permisos del sistema.
 *   3. Oficinas / dependencias institucionales.
 *   4. Cargos y usuarios iniciales (acceso solo con Google/Firebase).
 *
 * Los usuarios se vinculan a su cuenta de Google en el primer inicio de sesión
 * (por correo verificado). Este script NO maneja contraseñas.
 *
 * Uso (desde api/):  node prisma/setup-inicial.mjs
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/* ------------------------------------------------------------------ */
/* CONFIGURACIÓN                                                       */
/* ------------------------------------------------------------------ */

const ROLES = [
  { nombre: 'ADMINISTRADOR', scope: 'GLOBAL', descripcion: 'Acceso global a todos los módulos y acciones del sistema.' },
  { nombre: 'GERENCIA', scope: 'GLOBAL', descripcion: 'Visión global de todos los proyectos de la institución.' },
  { nombre: 'JGA', scope: 'GLOBAL', descripcion: 'Junta General Administrativa: visión global y supervisión institucional.' },
  { nombre: 'ADMINISTRACION_GENERAL', scope: 'GLOBAL', descripcion: 'Administración General: revisión y aprobación de proyectos.' },
  { nombre: 'DEPARTAMENTO_TI', scope: 'DEPENDENCIA', descripcion: 'Departamento de TI: gestor de dependencia y flujo técnico.' },
  { nombre: 'JEFE_OFICINA', scope: 'DEPENDENCIA', descripcion: 'Jefe de oficina: gestiona proyectos, actividades y evidencias de su oficina.' },
  { nombre: 'ASISTENTE', scope: 'DEPENDENCIA', descripcion: 'Asistente de oficina: registra y actualiza proyectos y actividades de su oficina.' },
  { nombre: 'COLABORADOR', scope: 'PROPIO', descripcion: 'Ejecuta y actualiza las actividades que le asignan.' },
  { nombre: 'CONSULTA', scope: 'PROPIO', descripcion: 'Solo lectura: puede ver y observar la información autorizada.' },
];

const MODULOS = [
  { slug: 'dashboard', nombre: 'Dashboard', acciones: ['Ver'] },
  { slug: 'proyectos', nombre: 'Proyectos', acciones: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar', 'Exportar', 'Aprobar', 'Revisar', 'Completar'] },
  { slug: 'mis-proyectos', nombre: 'Mis proyectos', acciones: ['Ver'] },
  { slug: 'proyectos-oficina', nombre: 'Proyectos de mi oficina', acciones: ['Ver'] },
  { slug: 'proyectos-colaboracion', nombre: 'Proyectos donde colaboro', acciones: ['Ver'] },
  { slug: 'tareas', nombre: 'Tareas', acciones: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar'] },
  { slug: 'kanban', nombre: 'Kanban', acciones: ['Ver', 'CambiarEstado'] },
  { slug: 'workflow', nombre: 'Workflow', acciones: ['Ver', 'CambiarEstado', 'Aprobar', 'Administrar'] },
  { slug: 'actividades', nombre: 'Actividades', acciones: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Eliminar', 'Asignar'] },
  { slug: 'observaciones', nombre: 'Observaciones', acciones: ['Ver', 'Crear', 'Editar', 'Observar', 'Aprobar', 'Administrar'] },
  { slug: 'evidencias', nombre: 'Evidencias', acciones: ['Ver', 'Crear', 'Editar', 'Observar', 'Aprobar', 'Eliminar', 'Exportar', 'Administrar'] },
  { slug: 'reportes', nombre: 'Reportes', acciones: ['Ver', 'Exportar'] },
  { slug: 'indicadores', nombre: 'Indicadores', acciones: ['Ver', 'Exportar'] },
  { slug: 'usuarios', nombre: 'Usuarios', acciones: ['Ver', 'Crear', 'Editar', 'Eliminar', 'Administrar'] },
  { slug: 'roles', nombre: 'Roles', acciones: ['Ver', 'Crear', 'Editar', 'Administrar'] },
  { slug: 'permisos', nombre: 'Permisos', acciones: ['Ver', 'Crear', 'Editar', 'Administrar'] },
  { slug: 'modulos', nombre: 'Módulos', acciones: ['Ver', 'Editar', 'Administrar'] },
  { slug: 'dependencias', nombre: 'Dependencias', acciones: ['Ver', 'Editar', 'Administrar'] },
  { slug: 'cargos', nombre: 'Cargos', acciones: ['Ver', 'Crear', 'Editar', 'Eliminar', 'Administrar'] },
  { slug: 'administracion', nombre: 'Panel de administración', acciones: ['Ver', 'Administrar'] },
  { slug: 'configuracion', nombre: 'Configuración', acciones: ['Ver', 'Editar', 'Administrar'] },
  { slug: 'calendar', nombre: 'Calendario', acciones: ['Ver'] },
  { slug: 'profile', nombre: 'Perfil', acciones: ['Ver', 'Editar'] },
  { slug: 'notificaciones', nombre: 'Notificaciones', acciones: ['Ver'] },
  { slug: 'auditoria', nombre: 'Auditoría', acciones: ['Ver', 'Exportar', 'Administrar'] },
];

const TODOS_LOS_MODULOS = MODULOS.map((m) => m.slug);
const VISION_GLOBAL = [
  'dashboard', 'proyectos', 'mis-proyectos', 'proyectos-oficina', 'proyectos-colaboracion',
  'tareas', 'kanban', 'workflow', 'actividades', 'observaciones', 'evidencias', 'reportes',
  'indicadores', 'calendar', 'profile', 'notificaciones', 'auditoria',
];
const COLABORADOR = [
  'dashboard', 'mis-proyectos', 'proyectos-colaboracion', 'tareas', 'kanban', 'workflow',
  'actividades', 'observaciones', 'evidencias', 'calendar', 'profile', 'notificaciones',
];
/** Módulos operativos de una oficina (sin auditoría ni administración). */
const OFICINA = VISION_GLOBAL.filter((slug) => slug !== 'auditoria');
const CONSULTA = [
  'dashboard', 'mis-proyectos', 'proyectos-colaboracion', 'tareas', 'kanban', 'workflow',
  'actividades', 'observaciones', 'evidencias', 'reportes', 'indicadores', 'calendar',
  'profile', 'notificaciones', 'auditoria',
];

/** Acciones permitidas por rol (undefined = todas las acciones del módulo). */
const PERMISOS_POR_ROL = {
  ADMINISTRADOR: { slugs: TODOS_LOS_MODULOS },
  GERENCIA: { slugs: VISION_GLOBAL },
  JGA: { slugs: VISION_GLOBAL },
  ADMINISTRACION_GENERAL: {
    slugs: VISION_GLOBAL,
    acciones: {
      proyectos: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Aprobar', 'Revisar'],
      observaciones: ['Ver', 'Crear', 'Aprobar', 'Observar'],
      evidencias: ['Ver', 'Crear', 'Editar', 'Aprobar', 'Observar'],
    },
  },
  DEPARTAMENTO_TI: {
    slugs: VISION_GLOBAL,
    acciones: { proyectos: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar'] },
  },
  // Jefe de oficina: todas las acciones operativas, limitadas a su oficina por el alcance DEPENDENCIA.
  JEFE_OFICINA: { slugs: OFICINA },
  // Asistente: registra y actualiza; no asigna, aprueba ni elimina.
  ASISTENTE: {
    slugs: OFICINA,
    acciones: {
      proyectos: ['Ver', 'Crear', 'Editar', 'CambiarEstado'],
      tareas: ['Ver', 'Crear', 'Editar', 'CambiarEstado'],
      actividades: ['Ver', 'Crear', 'Editar', 'CambiarEstado'],
      kanban: ['Ver', 'CambiarEstado'],
      workflow: ['Ver', 'CambiarEstado'],
      observaciones: ['Ver', 'Crear', 'Editar', 'Observar'],
      evidencias: ['Ver', 'Crear', 'Editar', 'Observar'],
    },
  },
  COLABORADOR: { slugs: COLABORADOR },
  CONSULTA: {
    slugs: CONSULTA,
    acciones: {
      proyectos: ['Ver'],
      tareas: ['Ver'],
      actividades: ['Ver'],
      observaciones: ['Ver', 'Observar'],
      evidencias: ['Ver', 'Observar'],
    },
  },
};

const DEPENDENCIAS = [
  { code: 'DEP-OTI', nombre: 'Oficina de Tecnologías de la Información', tipo: 'Oficina' },
  { code: 'DEP-OBU', nombre: 'Oficina de Bienestar Universitario', tipo: 'Oficina' },
  { code: 'DEP-ADG', nombre: 'Administración General', tipo: 'Direccion' },
  { code: 'DEP-BIB', nombre: 'Biblioteca Central', tipo: 'Oficina' },
  { code: 'DEP-OPBS', nombre: 'Oficina Producción de Bienes y servicios', tipo: 'Oficina' },
  { code: 'DEP-MII', nombre: 'Marketing e Imagen Institucional', tipo: 'Oficina' },
  { code: 'DEP-EPOBS', nombre: 'E.P. Obstetricia', tipo: 'Escuela' },
  { code: 'DEP-EPCFB', nombre: 'E.P. Ciencias Farmacéuticas y Bioquímica', tipo: 'Escuela' },
  { code: 'DEP-ECOFIN', nombre: 'Economía y Finanzas', tipo: 'Oficina' },
  { code: 'DEP-CALEDU', nombre: 'Calidad Educativa', tipo: 'Oficina' },
  { code: 'DEP-DEFUNI', nombre: 'Defensoría Universitaria', tipo: 'Oficina' },
  { code: 'DEP-INV', nombre: 'Instituto de investigación', tipo: 'Oficina' },
  { code: 'DEP-POS', nombre: 'Posgrado', tipo: 'Oficina' },
  { code: 'DEP-LOG', nombre: 'Logística', tipo: 'Oficina' },
  { code: 'DEP-EPEST', nombre: 'E.P. Estomatología', tipo: 'Escuela' },
  { code: 'DEP-INF', nombre: 'Informes', tipo: 'Oficina' },
  { code: 'DEP-ARA', nombre: 'Asuntos y Registros Académicos', tipo: 'Oficina' },
  { code: 'DEP-TES', nombre: 'Tesorería', tipo: 'Oficina' },
  { code: 'DEP-GYT', nombre: 'Grados y Títulos', tipo: 'Oficina' },
  { code: 'DEP-SECGEN', nombre: 'Secretaria General', tipo: 'Oficina' },
  { code: 'DEP-TH', nombre: 'Talento Humano', tipo: 'Oficina' },
  { code: 'DEP-REC', nombre: 'Rectorado', tipo: 'Direccion' },
  { code: 'DEP-VRC', nombre: 'Vicerrectorado', tipo: 'Direccion' },
  { code: 'DEP-EPANI', nombre: 'E.P. Administración y Negocios Internacionales', tipo: 'Escuela' },
  { code: 'DEP-EPDER', nombre: 'E.P. Derecho', tipo: 'Escuela' },
  { code: 'DEP-EPENF', nombre: 'E.P. Enfermería', tipo: 'Escuela' },
  { code: 'DEP-EPMED', nombre: 'E.P. Medicina', tipo: 'Escuela' },
  { code: 'DEP-EPPSI', nombre: 'E.P. Psicología', tipo: 'Escuela' },
  { code: 'DEP-FCS', nombre: 'Facultad de Ciencias de la Salud', tipo: 'Escuela' },
  { code: 'DEP-FCED', nombre: 'Facultad de Ciencias Empresariales y Derecho', tipo: 'Escuela' },
];

const CARGOS = [
  { nombre: 'Jefe de Departamento de TI', descripcion: 'Lidera el departamento de tecnología.' },
];

/**
 * Usuarios iniciales. Solo pueden ingresar con su cuenta de Google con ese correo.
 *  - soporte: super administrador (rol ADMINISTRADOR, acceso global).
 *  - cespinal: administrador y jefe de TI; puede crear proyectos (DEPARTAMENTO_TI).
 */
const USUARIOS = [
  {
    email: 'soporte@uroosevelt.edu.pe',
    account: 'soporte',
    nombre: 'Soporte DASI',
    roles: ['ADMINISTRADOR'],
  },
  {
    email: 'cespinal@uroosevelt.edu.pe',
    account: 'cespinal',
    nombre: 'C. Espinal',
    roles: ['ADMINISTRADOR', 'DEPARTAMENTO_TI'],
    dependencia: 'DEP-OTI',
    cargo: 'Jefe de Departamento de TI',
  },
];

/* ------------------------------------------------------------------ */
/* EJECUCIÓN                                                          */
/* ------------------------------------------------------------------ */

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { disposeExternalPool: false }) });

async function crearRoles() {
  const porNombre = new Map();
  for (const rol of ROLES) {
    const registro = await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion, scope: rol.scope },
      create: rol,
    });
    porNombre.set(rol.nombre, registro);
  }
  return porNombre;
}

async function crearModulosYPermisos() {
  const permisosPorModulo = new Map();

  for (const m of MODULOS) {
    const modulo = await prisma.modulo.upsert({
      where: { slug: m.slug },
      update: { nombre: m.nombre, activo: true },
      create: { slug: m.slug, nombre: m.nombre, descripcion: `Módulo ${m.nombre}`, activo: true },
    });

    const permisos = [];
    for (const accion of m.acciones) {
      permisos.push(
        await prisma.permiso.upsert({
          where: { modulo_id_accion: { modulo_id: modulo.id, accion } },
          update: {},
          create: { modulo_id: modulo.id, accion },
        }),
      );
    }
    permisosPorModulo.set(m.slug, permisos);
  }

  return permisosPorModulo;
}

async function asignarPermisosARoles(roles, permisosPorModulo) {
  let total = 0;
  for (const [nombreRol, config] of Object.entries(PERMISOS_POR_ROL)) {
    const rol = roles.get(nombreRol);
    for (const slug of config.slugs) {
      for (const permiso of permisosPorModulo.get(slug) ?? []) {
        const permitidas = config.acciones?.[slug];
        if (permitidas && !permitidas.includes(permiso.accion)) continue;
        await prisma.rolPermiso.upsert({
          where: { rol_id_permiso_id: { rol_id: rol.id, permiso_id: permiso.id } },
          update: {},
          create: { rol_id: rol.id, permiso_id: permiso.id },
        });
        total += 1;
      }
    }
  }
  return total;
}

async function crearDependencias() {
  const porCode = new Map();
  for (const dep of DEPENDENCIAS) {
    const registro = await prisma.dependencia.upsert({
      where: { code: dep.code },
      update: { nombre: dep.nombre, tipo: dep.tipo, activa: true, deleted_at: null },
      create: { ...dep, director: 'Por asignar', activa: true },
    });
    porCode.set(dep.code, registro);
  }
  return porCode;
}

async function crearCargos() {
  const porNombre = new Map();
  for (const cargo of CARGOS) {
    const registro = await prisma.cargo.upsert({
      where: { nombre: cargo.nombre },
      update: { descripcion: cargo.descripcion },
      create: cargo,
    });
    porNombre.set(cargo.nombre, registro);
  }
  return porNombre;
}

async function crearUsuarios(roles, dependencias, cargos) {
  for (const data of USUARIOS) {
    const existente = await prisma.usuario.findFirst({
      where: { OR: [{ email: data.email }, { account: data.account }] },
    });

    const base = {
      nombre: data.nombre,
      email: data.email,
      account: data.account,
      estado: 'Activo',
      deleted_at: null,
      initials: data.nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join(''),
    };

    const usuario = existente
      ? await prisma.usuario.update({ where: { id: existente.id }, data: base })
      : await prisma.usuario.create({ data: base });

    for (const nombreRol of data.roles) {
      await prisma.usuarioRol.upsert({
        where: { usuario_id_rol_id: { usuario_id: usuario.id, rol_id: roles.get(nombreRol).id } },
        update: {},
        create: { usuario_id: usuario.id, rol_id: roles.get(nombreRol).id },
      });
    }

    if (data.dependencia) {
      const dep = dependencias.get(data.dependencia);
      await prisma.usuario.update({ where: { id: usuario.id }, data: { dependencia_id: dep.id } });
      await prisma.usuarioDependencia.upsert({
        where: { usuario_id_dependencia_id: { usuario_id: usuario.id, dependencia_id: dep.id } },
        update: { es_principal: true },
        create: { usuario_id: usuario.id, dependencia_id: dep.id, es_principal: true },
      });
    }

    if (data.cargo) {
      const cargo = cargos.get(data.cargo);
      await prisma.usuario.update({ where: { id: usuario.id }, data: { cargo_id: cargo.id } });
      await prisma.usuarioCargo.upsert({
        where: { usuario_id_cargo_id: { usuario_id: usuario.id, cargo_id: cargo.id } },
        update: {},
        create: { usuario_id: usuario.id, cargo_id: cargo.id },
      });
    }

    console.log(`  Usuario ${existente ? 'actualizado' : 'creado'}: ${data.email} (${data.roles.join(', ')})`);
  }
}

async function main() {
  console.log('DASI - Inicialización de la base de datos');

  const roles = await crearRoles();
  console.log(`  Roles: ${roles.size}`);

  const permisosPorModulo = await crearModulosYPermisos();
  const totalPermisosRol = await asignarPermisosARoles(roles, permisosPorModulo);
  console.log(`  Módulos: ${permisosPorModulo.size} | Asignaciones rol-permiso: ${totalPermisosRol}`);

  const dependencias = await crearDependencias();
  console.log(`  Oficinas/dependencias: ${dependencias.size}`);

  const cargos = await crearCargos();
  console.log(`  Cargos: ${cargos.size}`);

  await crearUsuarios(roles, dependencias, cargos);

  console.log('Listo. Los usuarios entran con Google usando su correo institucional.');
}

main()
  .catch((error) => {
    console.error('Error en la inicialización:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
