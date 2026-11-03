/*
  DASI - cambios de esquema institucional.

  Nota: esta migración había fallado porque intentaba eliminar el enum
  "EstadoProyecto" viejo mientras "ProyectoWorkflow.etapa" todavía dependía
  de él. El orden correcto es convertir esa columna a TEXT antes de borrar
  el enum. La base local estaba vacía, por lo que no se pierden datos.
*/

-- AlterEnum: nuevos estados oficiales de proyecto
BEGIN;
CREATE TYPE "EstadoProyecto_new" AS ENUM ('Pendiente', 'Aprobado', 'EnCurso', 'Implementado', 'EnRevision', 'Completado');
ALTER TABLE "public"."Proyecto" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Proyecto" ALTER COLUMN "estado" TYPE "EstadoProyecto_new" USING ("estado"::text::"EstadoProyecto_new");
ALTER TABLE "ProyectoResponsabilidad" ALTER COLUMN "etapa" TYPE "EstadoProyecto_new" USING ("etapa"::text::"EstadoProyecto_new");
ALTER TABLE "HistorialProyecto" ALTER COLUMN "estado_anterior" TYPE "EstadoProyecto_new" USING ("estado_anterior"::text::"EstadoProyecto_new");
ALTER TABLE "HistorialProyecto" ALTER COLUMN "estado_nuevo" TYPE "EstadoProyecto_new" USING ("estado_nuevo"::text::"EstadoProyecto_new");
ALTER TABLE "ProyectoWorkflow" ALTER COLUMN "etapa" TYPE TEXT USING ("etapa"::text);
ALTER TYPE "EstadoProyecto" RENAME TO "EstadoProyecto_old";
ALTER TYPE "EstadoProyecto_new" RENAME TO "EstadoProyecto";
DROP TYPE "public"."EstadoProyecto_old";
ALTER TABLE "Proyecto" ALTER COLUMN "estado" SET DEFAULT 'Pendiente';
COMMIT;

-- AlterEnum: acciones nuevas del catálogo de permisos
ALTER TYPE "TipoAccionPermiso" ADD VALUE IF NOT EXISTS 'Revisar';
ALTER TYPE "TipoAccionPermiso" ADD VALUE IF NOT EXISTS 'Completar';

-- AlterTable: campos operativos de actividades
ALTER TABLE "Actividad" ADD COLUMN "code" TEXT,
ADD COLUMN "fase" TEXT;

-- AlterTable: objetivo del proyecto
ALTER TABLE "Proyecto" ADD COLUMN "objetivo" TEXT,
ALTER COLUMN "estado" SET DEFAULT 'Pendiente';
