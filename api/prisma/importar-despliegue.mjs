/**
 * DASI - Importa los datos iniciales de despliegue desde datos-despliegue.json.
 *
 * Es idempotente: crea o actualiza módulos, permisos, roles, oficinas, cargos y
 * usuarios; no elimina registros ni toca contraseñas, firebase_uid o avatar_url.
 * Los usuarios se vinculan a Google por correo en su primer inicio de sesión.
 *
 * Uso (desde api/):
 *   DATABASE_URL="postgresql://..." node prisma/importar-despliegue.mjs
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { disposeExternalPool: false }) });

async function main() {
  const raw = await readFile(new URL('./datos-despliegue.json', import.meta.url), 'utf8');
  const data = JSON.parse(raw);

  for (const moduloData of data.modulos ?? []) {
    const modulo = await prisma.modulo.upsert({
      where: { slug: moduloData.slug },
      update: {
        nombre: moduloData.nombre,
        descripcion: moduloData.descripcion,
        activo: moduloData.activo,
      },
      create: {
        slug: moduloData.slug,
        nombre: moduloData.nombre,
        descripcion: moduloData.descripcion,
        activo: moduloData.activo,
      },
    });

    for (const accion of moduloData.acciones ?? []) {
      await prisma.permiso.upsert({
        where: { modulo_id_accion: { modulo_id: modulo.id, accion } },
        update: {},
        create: { modulo_id: modulo.id, accion },
      });
    }
  }
  console.log(`Módulos y permisos: ${data.modulos?.length ?? 0}`);

  const permisos = await prisma.permiso.findMany({ include: { modulo: { select: { slug: true } } } });
  const permisosPorClave = new Map(
    permisos.map((permiso) => [`${permiso.modulo.slug}:${permiso.accion}`, permiso]),
  );

  for (const rolData of data.roles ?? []) {
    const rol = await prisma.rol.upsert({
      where: { nombre: rolData.nombre },
      update: { descripcion: rolData.descripcion, scope: rolData.scope },
      create: { nombre: rolData.nombre, descripcion: rolData.descripcion, scope: rolData.scope },
    });

    for (const clave of rolData.permisos ?? []) {
      const permiso = permisosPorClave.get(clave);
      if (!permiso) {
        throw new Error(`El rol ${rolData.nombre} referencia un permiso inexistente: ${clave}`);
      }
      await prisma.rolPermiso.upsert({
        where: { rol_id_permiso_id: { rol_id: rol.id, permiso_id: permiso.id } },
        update: {},
        create: { rol_id: rol.id, permiso_id: permiso.id },
      });
    }
  }
  console.log(`Roles: ${data.roles?.length ?? 0}`);

  const dependenciasPorCode = new Map();
  for (const depData of data.dependencias ?? []) {
    const dep = await prisma.dependencia.upsert({
      where: { code: depData.code },
      update: {
        nombre: depData.nombre,
        tipo: depData.tipo,
        director: depData.director,
        activa: depData.activa ?? true,
        deleted_at: null,
      },
      create: {
        code: depData.code,
        nombre: depData.nombre,
        tipo: depData.tipo,
        director: depData.director,
        activa: depData.activa ?? true,
      },
    });
    dependenciasPorCode.set(dep.code, dep);
  }
  console.log(`Oficinas/dependencias: ${data.dependencias?.length ?? 0}`);

  const cargosPorNombre = new Map();
  for (const cargoData of data.cargos ?? []) {
    const cargo = await prisma.cargo.upsert({
      where: { nombre: cargoData.nombre },
      update: { descripcion: cargoData.descripcion },
      create: { nombre: cargoData.nombre, descripcion: cargoData.descripcion },
    });
    cargosPorNombre.set(cargo.nombre, cargo);
  }
  console.log(`Cargos: ${data.cargos?.length ?? 0}`);

  const rolesPorNombre = new Map(
    (await prisma.rol.findMany()).map((rol) => [rol.nombre, rol]),
  );

  for (const userData of data.usuarios ?? []) {
    const dependencia = userData.dependencia_code
      ? dependenciasPorCode.get(userData.dependencia_code)
      : null;
    if (userData.dependencia_code && !dependencia) {
      throw new Error(`El usuario ${userData.email} referencia una oficina inexistente: ${userData.dependencia_code}`);
    }

    const cargo = userData.cargo ? cargosPorNombre.get(userData.cargo) : null;
    if (userData.cargo && !cargo) {
      throw new Error(`El usuario ${userData.email} referencia un cargo inexistente: ${userData.cargo}`);
    }

    const existente = await prisma.usuario.findFirst({
      where: { OR: [{ email: userData.email }, { account: userData.account }] },
    });

    const base = {
      email: userData.email,
      nombre: userData.nombre,
      account: userData.account,
      initials: userData.initials ?? null,
      estado: userData.estado ?? 'Activo',
      dependencia_id: dependencia?.id ?? null,
      cargo_id: cargo?.id ?? null,
      deleted_at: null,
    };

    const usuario = existente
      ? await prisma.usuario.update({ where: { id: existente.id }, data: base })
      : await prisma.usuario.create({ data: base });

    for (const nombreRol of userData.roles ?? []) {
      const rol = rolesPorNombre.get(nombreRol);
      if (!rol) {
        throw new Error(`El usuario ${userData.email} referencia un rol inexistente: ${nombreRol}`);
      }
      await prisma.usuarioRol.upsert({
        where: { usuario_id_rol_id: { usuario_id: usuario.id, rol_id: rol.id } },
        update: {},
        create: { usuario_id: usuario.id, rol_id: rol.id },
      });
    }

    if (dependencia) {
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

    if (cargo) {
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

    console.log(`  Usuario ${existente ? 'actualizado' : 'creado'}: ${userData.email}`);
  }

  console.log(`Usuarios: ${data.usuarios?.length ?? 0}`);
  console.log('Importación completada. No se eliminó ningún dato existente.');
}

main()
  .catch((error) => {
    console.error('Error al importar los datos de despliegue:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
