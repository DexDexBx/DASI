/**
 * DASI - Limpieza de datos TEST
 * =====================================================================
 * Elimina de PostgreSQL TODOS los registros identificados con el prefijo
 * TEST_DASI_ (datos de prueba temporales creados por prisma/seed.mjs).
 *
 * - Solo interactúa con la base de datos mediante Prisma (sin SQL manual).
 * - Respeta el orden de dependencias para evitar errores de FK.
 * - NO elimina ningún registro que no sea TEST.
 * - No modifica el schema ni crea migraciones.
 *
 * Uso (desde la carpeta api/):
 *   node prisma/clean-test.mjs
 * =====================================================================
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { disposeExternalPool: false });
const prisma = new PrismaClient({ adapter });

async function deleteMany(model, where) {
  const result = await prisma[model].deleteMany({ where });
  return result.count;
}

async function collectIds(model, where) {
  const rows = await prisma[model].findMany({ where, select: { id: true } });
  return rows.map((r) => r.id);
}

async function main() {
  console.log('Limpieza TEST_DASI - inicio...');

  /* Recopilar ids de entidades TEST */
  const testUsers = await collectIds('usuario', { deleted_at: null, OR: [{ account: { startsWith: 'test_dasi' } }, { email: { startsWith: 'test_dasi' } }] });
  const testProjects = await collectIds('proyecto', { deleted_at: null, OR: [
    { code: { startsWith: 'TEST_DASI' } },
    { owner_id: { in: testUsers } },
    { coordinador_id: { in: testUsers } },
    { created_by_id: { in: testUsers } },
  ] });
  const testModulos = await collectIds('modulo', { nombre: { startsWith: 'TEST_DASI' } });
  const testPermisos = await collectIds('permiso', { modulo_id: { in: testModulos } });
  const testRoles = await collectIds('rol', { nombre: { startsWith: 'TEST_DASI' } });
  const testDependencias = await collectIds('dependencia', { deleted_at: null, code: { startsWith: 'TEST_DASI' } });
  const testCargos = await collectIds('cargo', { nombre: { startsWith: 'TEST_DASI' } });
  const testActividades = await collectIds('actividad', { deleted_at: null, OR: [{ proyecto_id: { in: testProjects } }, { code: { startsWith: 'ACT-2026' } }] });
  const testEvidencias = await collectIds('evidencia', { deleted_at: null, OR: [{ nombre: { startsWith: 'TEST_DASI' } }, { actividad_id: { in: testActividades } }] });
  const testObservaciones = await collectIds('observacion', { deleted_at: null, OR: [{ contenido: { startsWith: 'TEST_DASI' } }, { proyecto_id: { in: testProjects } }, { actividad_id: { in: testActividades } }, { evidencia_id: { in: testEvidencias } }] });

  let total = 0;

  /* 1. Auditoría */
  total += await deleteMany('auditoria', { OR: [{ descripcion: { startsWith: 'TEST_DASI' } }, { entidad_id: { in: [...testUsers, ...testProjects, ...testActividades] } }] });
  /* 2. Calendario */
  total += await deleteMany('eventoCalendario', { OR: [{ titulo: { startsWith: 'TEST_DASI' } }, { usuario_id: { in: testUsers } }, { proyecto_id: { in: testProjects } }, { actividad_id: { in: testActividades } }] });
  /* 3. Notificaciones */
  total += await deleteMany('notificacion', { OR: [{ titulo: { startsWith: 'TEST_DASI' } }, { usuario_id: { in: testUsers } }] });
  /* 4. Historial de proyectos */
  total += await deleteMany('historialProyecto', { OR: [{ proyecto_id: { in: testProjects } }, { usuario_id: { in: testUsers } }] });
  /* 5. Observaciones */
  total += await deleteMany('observacion', { id: { in: testObservaciones } });
  /* 6. Evidencias */
  total += await deleteMany('evidencia', { id: { in: testEvidencias } });
  /* 7. Actividades */
  total += await deleteMany('actividad', { id: { in: testActividades } });
  /* 8. Proyectos: responsabilidades, workflow, equipo, dependencias */
  total += await deleteMany('proyectoResponsabilidad', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyectoWorkflow', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyectoEquipo', { proyecto_id: { in: testProjects } });
  total += await deleteMany('proyectoDependencia', { proyecto_id: { in: testProjects } });
  /* 9. Proyectos */
  total += await deleteMany('proyecto', { id: { in: testProjects } });
  /* 10. Usuarios: dependencias, cargos y roles asociados */
  total += await deleteMany('usuarioDependencia', { usuario_id: { in: testUsers } });
  total += await deleteMany('usuarioCargo', { usuario_id: { in: testUsers } });
  total += await deleteMany('usuarioRol', { usuario_id: { in: testUsers } });
  total += await deleteMany('usuario', { id: { in: testUsers } });
  /* 11. Permisos y roles de acceso */
  total += await deleteMany('rolPermiso', { OR: [{ rol_id: { in: testRoles } }, { permiso_id: { in: testPermisos } }] });
  total += await deleteMany('permiso', { id: { in: testPermisos } });
  total += await deleteMany('modulo', { id: { in: testModulos } });
  total += await deleteMany('rol', { id: { in: testRoles } });
  /* 12. Cargos y dependencias */
  total += await deleteMany('cargo', { id: { in: testCargos } });
  total += await deleteMany('dependencia', { id: { in: testDependencias } });

  /* Verificación final */
  const [restUsers, restProjects, restObservaciones, restEvidencias, restModulos] = await Promise.all([
    prisma.usuario.count({ where: { OR: [{ account: { startsWith: 'test_dasi' } }, { email: { startsWith: 'test_dasi' } }] } }),
    prisma.proyecto.count({ where: { OR: [{ code: { startsWith: 'TEST_DASI' } }, { code: { startsWith: 'PRY-2026' } }] } }),
    prisma.observacion.count({ where: { contenido: { startsWith: 'TEST_DASI' } } }),
    prisma.evidencia.count({ where: { nombre: { startsWith: 'TEST_DASI' } } }),
    prisma.modulo.count({ where: { nombre: { startsWith: 'TEST_DASI' } } }),
  ]);

  console.log(`Registros TEST eliminados: ${total}`);
  console.log('Verificación restante:');
  console.log(`  Usuarios test restantes : ${restUsers}`);
  console.log(`  Proyectos test restantes: ${restProjects}`);
  console.log(`  Observaciones restantes : ${restObservaciones}`);
  console.log(`  Evidencias restantes    : ${restEvidencias}`);
  console.log(`  Módulos test restantes  : ${restModulos}`);
  if (restUsers + restProjects + restObservaciones + restEvidencias + restModulos === 0) {
    console.log('Limpieza TEST_DASI completada correctamente.');
  } else {
    console.warn('ATENCIÓN: quedan registros TEST sin eliminar. Revisar manualmente.');
    process.exitCode = 1;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (err) => {
    console.error('ERROR en la limpieza TEST_DASI:', err);
    process.exitCode = 1;
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  });