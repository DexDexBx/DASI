/**
 * DASI - Registra o actualiza el administrador inicial.
 *
 * La autenticación es solo con Google (Firebase). Este script NO maneja
 * contraseñas: el correo debe ser la cuenta de Google con la que el
 * administrador ingresará. El vínculo con Firebase se hace en el primer inicio
 * de sesión (por correo verificado).
 *
 * Es idempotente. Uso (desde api/):
 *   ADMIN_NOMBRE="..." ADMIN_EMAIL="..." ADMIN_ACCOUNT="..." node prisma/create-admin.mjs
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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
  proyectos: [
    'Ver',
    'Crear',
    'Editar',
    'CambiarEstado',
    'Asignar',
    'Exportar',
    'Aprobar',
    'Revisar',
    'Completar',
  ],
  'mis-proyectos': ['Ver'],
  'proyectos-oficina': ['Ver'],
  'proyectos-colaboracion': ['Ver'],
  tareas: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Asignar'],
  kanban: ['Ver', 'CambiarEstado'],
  workflow: ['Ver', 'CambiarEstado', 'Aprobar', 'Administrar'],
  actividades: ['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Eliminar', 'Asignar'],
  observaciones: ['Ver', 'Crear', 'Editar', 'Observar', 'Aprobar', 'Administrar'],
  evidencias: ['Ver', 'Crear', 'Editar', 'Observar', 'Aprobar', 'Eliminar', 'Administrar'],
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
  auditoria: ['Ver', 'Exportar', 'Administrar'],
};

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { disposeExternalPool: false });
const prisma = new PrismaClient({ adapter });

async function main() {
  const nombre = requiredEnv('ADMIN_NOMBRE');
  const email = requiredEnv('ADMIN_EMAIL').toLowerCase();
  const account = requiredEnv('ADMIN_ACCOUNT');

  const rol = await prisma.rol.upsert({
    where: { nombre: 'ADMINISTRADOR' },
    update: {
      descripcion:
        'Acceso global a todos los módulos y acciones del sistema.',
      scope: 'GLOBAL',
    },
    create: {
      nombre: 'ADMINISTRADOR',
      descripcion:
        'Acceso global a todos los módulos y acciones del sistema.',
      scope: 'GLOBAL',
    },
  });

  let totalPermisos = 0;
  for (const moduloData of MODULOS) {
    const modulo = await prisma.modulo.upsert({
      where: { slug: moduloData.slug },
      update: {
        nombre: moduloData.nombre,
        descripcion: `Módulo ${moduloData.nombre}`,
        activo: true,
      },
      create: {
        slug: moduloData.slug,
        nombre: moduloData.nombre,
        descripcion: `Módulo ${moduloData.nombre}`,
        activo: true,
      },
    });

    for (const accion of ACCIONES_MODULO[moduloData.slug] ?? []) {
      const permiso = await prisma.permiso.upsert({
        where: { modulo_id_accion: { modulo_id: modulo.id, accion } },
        update: {},
        create: { modulo_id: modulo.id, accion },
      });

      await prisma.rolPermiso.upsert({
        where: {
          rol_id_permiso_id: { rol_id: rol.id, permiso_id: permiso.id },
        },
        update: {},
        create: { rol_id: rol.id, permiso_id: permiso.id },
      });

      totalPermisos += 1;
    }
  }

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ account }, { email }] },
  });

  const usuario = existente
    ? await prisma.usuario.update({
        where: { id: existente.id },
        data: {
          nombre,
          email,
          account,
          estado: 'Activo',
          deleted_at: null,
        },
      })
    : await prisma.usuario.create({
        data: {
          nombre,
          email,
          account,
          estado: 'Activo',
        },
      });

  await prisma.usuarioRol.upsert({
    where: {
      usuario_id_rol_id: { usuario_id: usuario.id, rol_id: rol.id },
    },
    update: {},
    create: { usuario_id: usuario.id, rol_id: rol.id },
  });

  const dependenciaCode = process.env.ADMIN_DEPENDENCIA_CODE?.trim();
  if (dependenciaCode) {
    const dependencia = await prisma.dependencia.findUnique({
      where: { code: dependenciaCode },
    });
    if (!dependencia) {
      throw new Error(
        `No existe una dependencia con código ${dependenciaCode}.`,
      );
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { dependencia_id: dependencia.id },
    });
    await prisma.usuarioDependencia.upsert({
      where: {
        usuario_id_dependencia_id: {
          usuario_id: usuario.id,
          dependencia_id: dependencia.id,
        },
      },
      update: { es_principal: true },
      create: {
        usuario_id: usuario.id,
        dependencia_id: dependencia.id,
        es_principal: true,
      },
    });
  }

  const cargoNombre = process.env.ADMIN_CARGO?.trim();
  if (cargoNombre) {
    const cargo = await prisma.cargo.findUnique({
      where: { nombre: cargoNombre },
    });
    if (!cargo) {
      throw new Error(`No existe un cargo con nombre ${cargoNombre}.`);
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { cargo_id: cargo.id },
    });
    await prisma.usuarioCargo.upsert({
      where: {
        usuario_id_cargo_id: {
          usuario_id: usuario.id,
          cargo_id: cargo.id,
        },
      },
      update: {},
      create: { usuario_id: usuario.id, cargo_id: cargo.id },
    });
  }

  console.log('================================================');
  console.log('ADMINISTRADOR DASI LISTO');
  console.log('================================================');
  console.log(`  Nombre   : ${nombre}`);
  console.log(`  Cuenta   : ${account}`);
  console.log(`  Correo   : ${email}`);
  console.log(`  Rol      : ADMINISTRADOR (${rol.scope})`);
  console.log(`  Permisos : ${totalPermisos}`);
  console.log(
    `  Acción   : ${existente ? 'usuario actualizado' : 'usuario creado'}`,
  );
  console.log('  Acceso   : Google (Firebase) con el correo indicado');
  console.log('================================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error('No se pudo crear el administrador:', error.message);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
