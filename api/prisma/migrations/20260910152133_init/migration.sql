-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('Requerimiento', 'Derivacion', 'Evaluacion', 'Autorizacion', 'Inicio', 'Adquisicion', 'Ejecucion', 'Pruebas', 'Entrega', 'Observaciones', 'InformeFinal', 'Implementado', 'Completado');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('Pendiente', 'Aprobado', 'EnCurso', 'Terminado', 'EnRevision', 'Completado');

-- CreateEnum
CREATE TYPE "EstadoEvidencia" AS ENUM ('Pendiente', 'EnRevision', 'Aprobada', 'Observada');

-- CreateEnum
CREATE TYPE "EstadoObservacion" AS ENUM ('Abierta', 'Respondida', 'Resuelta');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('Alta', 'Media', 'Baja');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "ScopeRol" AS ENUM ('GLOBAL', 'DEPENDENCIA', 'PROPIO', 'ASIGNADO');

-- CreateEnum
CREATE TYPE "TipoAccionPermiso" AS ENUM ('Ver', 'Crear', 'Editar', 'CambiarEstado', 'Eliminar', 'Aprobar', 'Observar', 'Asignar', 'Exportar', 'Administrar');

-- CreateEnum
CREATE TYPE "TipoDependencia" AS ENUM ('Oficina', 'Escuela', 'JGA', 'Direccion');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('local', 's3', 'r2', 'minio');

-- CreateEnum
CREATE TYPE "EstadoWorkflow" AS ENUM ('Pendiente', 'EnCurso', 'Completado');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('PROYECTO_CREADO', 'PROYECTO_ASIGNADO', 'ACTIVIDAD_ASIGNADA', 'ACTIVIDAD_PROXIMO_VENCER', 'ACTIVIDAD_VENCIDA', 'PROYECTO_PROXIMO_VENCER', 'PROYECTO_VENCIDO', 'PROYECTO_ESTANCADO', 'EVIDENCIA_PENDIENTE', 'OBSERVACION_REGISTRADA', 'ACTIVIDAD_PENDIENTE_REVISION', 'PROYECTO_PENDIENTE_APROBACION', 'PROYECTO_IMPLEMENTADO', 'PROYECTO_COMPLETADO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "TipoEventoCalendario" AS ENUM ('PROYECTO', 'ACTIVIDAD', 'PERSONAL', 'REUNION');

-- CreateTable
CREATE TABLE "Dependencia" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDependencia" NOT NULL,
    "director" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "initials" TEXT,
    "avatar_url" TEXT,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'Activo',
    "dependencia_id" UUID,
    "cargo_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioDependencia" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "dependencia_id" UUID NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioDependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioCargo" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cargo_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "scope" "ScopeRol" NOT NULL DEFAULT 'DEPENDENCIA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" UUID NOT NULL,
    "modulo_id" UUID NOT NULL,
    "accion" "TipoAccionPermiso" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "permiso_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "owner_id" UUID NOT NULL,
    "coordinador_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "dependencia_id" UUID NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'Media',
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'Requerimiento',
    "riesgo" BOOLEAN NOT NULL DEFAULT false,
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin_estimada" TIMESTAMP(3),
    "fecha_fin_real" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoDependencia" (
    "id" UUID NOT NULL,
    "proyecto_id" UUID NOT NULL,
    "dependencia_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProyectoDependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoEquipo" (
    "id" UUID NOT NULL,
    "proyecto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProyectoEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoWorkflow" (
    "id" UUID NOT NULL,
    "proyecto_id" UUID NOT NULL,
    "etapa" "EstadoProyecto" NOT NULL,
    "orden" INTEGER NOT NULL,
    "estado" "EstadoWorkflow" NOT NULL DEFAULT 'Pendiente',
    "dependencia_id" UUID,
    "responsable_id" UUID,
    "accion_requerida" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProyectoWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoResponsabilidad" (
    "id" UUID NOT NULL,
    "proyecto_id" UUID NOT NULL,
    "etapa" "EstadoProyecto" NOT NULL,
    "dependencia_id" UUID NOT NULL,
    "responsable_id" UUID,
    "accion" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProyectoResponsabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "proyecto_id" UUID NOT NULL,
    "responsable_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'Media',
    "estado" "EstadoActividad" NOT NULL DEFAULT 'Pendiente',
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin_estimada" TIMESTAMP(3),
    "fecha_fin_real" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" UUID NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "nombre_storage" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'r2',
    "storage_key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "checksum" TEXT,
    "cdn_url" TEXT,
    "usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "actividad_id" UUID,
    "proyecto_id" UUID,
    "archivo_id" UUID,
    "usuario_id" UUID NOT NULL,
    "estado" "EstadoEvidencia" NOT NULL DEFAULT 'Pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observacion" (
    "id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "evidencia_id" UUID,
    "actividad_id" UUID,
    "proyecto_id" UUID,
    "usuario_id" UUID NOT NULL,
    "parent_id" UUID,
    "estado" "EstadoObservacion" NOT NULL DEFAULT 'Abierta',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Observacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialProyecto" (
    "id" UUID NOT NULL,
    "proyecto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "estado_anterior" "EstadoProyecto",
    "estado_nuevo" "EstadoProyecto" NOT NULL,
    "accion" TEXT NOT NULL,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL DEFAULT 'SISTEMA',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "proyecto_id" UUID,
    "actividad_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoCalendario" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "todo_dia" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "tipo" "TipoEventoCalendario" NOT NULL DEFAULT 'PERSONAL',
    "usuario_id" UUID NOT NULL,
    "proyecto_id" UUID,
    "actividad_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoCalendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "accion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "descripcion" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" UUID NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_code_key" ON "Dependencia"("code");

-- CreateIndex
CREATE INDEX "Dependencia_tipo_idx" ON "Dependencia"("tipo");

-- CreateIndex
CREATE INDEX "Dependencia_activa_idx" ON "Dependencia"("activa");

-- CreateIndex
CREATE INDEX "Dependencia_parent_id_idx" ON "Dependencia"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_nombre_key" ON "Cargo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_account_key" ON "Usuario"("account");

-- CreateIndex
CREATE INDEX "Usuario_dependencia_id_idx" ON "Usuario"("dependencia_id");

-- CreateIndex
CREATE INDEX "Usuario_cargo_id_idx" ON "Usuario"("cargo_id");

-- CreateIndex
CREATE INDEX "Usuario_estado_idx" ON "Usuario"("estado");

-- CreateIndex
CREATE INDEX "UsuarioDependencia_dependencia_id_idx" ON "UsuarioDependencia"("dependencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioDependencia_usuario_id_dependencia_id_key" ON "UsuarioDependencia"("usuario_id", "dependencia_id");

-- CreateIndex
CREATE INDEX "UsuarioCargo_cargo_id_idx" ON "UsuarioCargo"("cargo_id");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioCargo_usuario_id_cargo_id_key" ON "UsuarioCargo"("usuario_id", "cargo_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE INDEX "UsuarioRol_rol_id_idx" ON "UsuarioRol"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioRol_usuario_id_rol_id_key" ON "UsuarioRol"("usuario_id", "rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_slug_key" ON "Modulo"("slug");

-- CreateIndex
CREATE INDEX "Modulo_activo_idx" ON "Modulo"("activo");

-- CreateIndex
CREATE INDEX "Permiso_modulo_id_idx" ON "Permiso"("modulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_modulo_id_accion_key" ON "Permiso"("modulo_id", "accion");

-- CreateIndex
CREATE INDEX "RolPermiso_permiso_id_idx" ON "RolPermiso"("permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "RolPermiso_rol_id_permiso_id_key" ON "RolPermiso"("rol_id", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_code_key" ON "Proyecto"("code");

-- CreateIndex
CREATE INDEX "Proyecto_owner_id_idx" ON "Proyecto"("owner_id");

-- CreateIndex
CREATE INDEX "Proyecto_coordinador_id_idx" ON "Proyecto"("coordinador_id");

-- CreateIndex
CREATE INDEX "Proyecto_created_by_id_idx" ON "Proyecto"("created_by_id");

-- CreateIndex
CREATE INDEX "Proyecto_dependencia_id_idx" ON "Proyecto"("dependencia_id");

-- CreateIndex
CREATE INDEX "Proyecto_estado_idx" ON "Proyecto"("estado");

-- CreateIndex
CREATE INDEX "Proyecto_prioridad_idx" ON "Proyecto"("prioridad");

-- CreateIndex
CREATE INDEX "Proyecto_created_at_idx" ON "Proyecto"("created_at");

-- CreateIndex
CREATE INDEX "ProyectoDependencia_dependencia_id_idx" ON "ProyectoDependencia"("dependencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoDependencia_proyecto_id_dependencia_id_key" ON "ProyectoDependencia"("proyecto_id", "dependencia_id");

-- CreateIndex
CREATE INDEX "ProyectoEquipo_usuario_id_idx" ON "ProyectoEquipo"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoEquipo_proyecto_id_usuario_id_key" ON "ProyectoEquipo"("proyecto_id", "usuario_id");

-- CreateIndex
CREATE INDEX "ProyectoWorkflow_proyecto_id_idx" ON "ProyectoWorkflow"("proyecto_id");

-- CreateIndex
CREATE INDEX "ProyectoWorkflow_etapa_idx" ON "ProyectoWorkflow"("etapa");

-- CreateIndex
CREATE INDEX "ProyectoWorkflow_estado_idx" ON "ProyectoWorkflow"("estado");

-- CreateIndex
CREATE INDEX "ProyectoWorkflow_orden_idx" ON "ProyectoWorkflow"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoWorkflow_proyecto_id_etapa_key" ON "ProyectoWorkflow"("proyecto_id", "etapa");

-- CreateIndex
CREATE INDEX "ProyectoResponsabilidad_proyecto_id_idx" ON "ProyectoResponsabilidad"("proyecto_id");

-- CreateIndex
CREATE INDEX "ProyectoResponsabilidad_dependencia_id_idx" ON "ProyectoResponsabilidad"("dependencia_id");

-- CreateIndex
CREATE INDEX "ProyectoResponsabilidad_responsable_id_idx" ON "ProyectoResponsabilidad"("responsable_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoResponsabilidad_proyecto_id_etapa_key" ON "ProyectoResponsabilidad"("proyecto_id", "etapa");

-- CreateIndex
CREATE INDEX "Actividad_proyecto_id_estado_idx" ON "Actividad"("proyecto_id", "estado");

-- CreateIndex
CREATE INDEX "Actividad_responsable_id_idx" ON "Actividad"("responsable_id");

-- CreateIndex
CREATE INDEX "Actividad_created_by_id_idx" ON "Actividad"("created_by_id");

-- CreateIndex
CREATE INDEX "Actividad_prioridad_idx" ON "Actividad"("prioridad");

-- CreateIndex
CREATE INDEX "Actividad_created_at_idx" ON "Actividad"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Archivo_nombre_storage_key" ON "Archivo"("nombre_storage");

-- CreateIndex
CREATE INDEX "Archivo_usuario_id_idx" ON "Archivo"("usuario_id");

-- CreateIndex
CREATE INDEX "Archivo_storage_key_idx" ON "Archivo"("storage_key");

-- CreateIndex
CREATE INDEX "Archivo_bucket_idx" ON "Archivo"("bucket");

-- CreateIndex
CREATE INDEX "Archivo_created_at_idx" ON "Archivo"("created_at");

-- CreateIndex
CREATE INDEX "Evidencia_actividad_id_idx" ON "Evidencia"("actividad_id");

-- CreateIndex
CREATE INDEX "Evidencia_proyecto_id_idx" ON "Evidencia"("proyecto_id");

-- CreateIndex
CREATE INDEX "Evidencia_archivo_id_idx" ON "Evidencia"("archivo_id");

-- CreateIndex
CREATE INDEX "Evidencia_usuario_id_idx" ON "Evidencia"("usuario_id");

-- CreateIndex
CREATE INDEX "Evidencia_estado_idx" ON "Evidencia"("estado");

-- CreateIndex
CREATE INDEX "Evidencia_created_at_idx" ON "Evidencia"("created_at");

-- CreateIndex
CREATE INDEX "Observacion_evidencia_id_idx" ON "Observacion"("evidencia_id");

-- CreateIndex
CREATE INDEX "Observacion_actividad_id_idx" ON "Observacion"("actividad_id");

-- CreateIndex
CREATE INDEX "Observacion_proyecto_id_idx" ON "Observacion"("proyecto_id");

-- CreateIndex
CREATE INDEX "Observacion_usuario_id_idx" ON "Observacion"("usuario_id");

-- CreateIndex
CREATE INDEX "Observacion_parent_id_idx" ON "Observacion"("parent_id");

-- CreateIndex
CREATE INDEX "Observacion_estado_idx" ON "Observacion"("estado");

-- CreateIndex
CREATE INDEX "Observacion_created_at_idx" ON "Observacion"("created_at");

-- CreateIndex
CREATE INDEX "HistorialProyecto_proyecto_id_created_at_idx" ON "HistorialProyecto"("proyecto_id", "created_at");

-- CreateIndex
CREATE INDEX "HistorialProyecto_usuario_id_idx" ON "HistorialProyecto"("usuario_id");

-- CreateIndex
CREATE INDEX "HistorialProyecto_estado_nuevo_idx" ON "HistorialProyecto"("estado_nuevo");

-- CreateIndex
CREATE INDEX "Notificacion_usuario_id_idx" ON "Notificacion"("usuario_id");

-- CreateIndex
CREATE INDEX "Notificacion_leida_idx" ON "Notificacion"("leida");

-- CreateIndex
CREATE INDEX "Notificacion_tipo_idx" ON "Notificacion"("tipo");

-- CreateIndex
CREATE INDEX "Notificacion_created_at_idx" ON "Notificacion"("created_at");

-- CreateIndex
CREATE INDEX "Notificacion_usuario_id_leida_idx" ON "Notificacion"("usuario_id", "leida");

-- CreateIndex
CREATE INDEX "EventoCalendario_usuario_id_idx" ON "EventoCalendario"("usuario_id");

-- CreateIndex
CREATE INDEX "EventoCalendario_fecha_inicio_idx" ON "EventoCalendario"("fecha_inicio");

-- CreateIndex
CREATE INDEX "EventoCalendario_fecha_fin_idx" ON "EventoCalendario"("fecha_fin");

-- CreateIndex
CREATE INDEX "EventoCalendario_proyecto_id_idx" ON "EventoCalendario"("proyecto_id");

-- CreateIndex
CREATE INDEX "EventoCalendario_actividad_id_idx" ON "EventoCalendario"("actividad_id");

-- CreateIndex
CREATE INDEX "EventoCalendario_tipo_idx" ON "EventoCalendario"("tipo");

-- CreateIndex
CREATE INDEX "Auditoria_usuario_id_idx" ON "Auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "Auditoria_modulo_idx" ON "Auditoria"("modulo");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidad_id_idx" ON "Auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "Auditoria_created_at_idx" ON "Auditoria"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- AddForeignKey
ALTER TABLE "Dependencia" ADD CONSTRAINT "Dependencia_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UsuarioDependencia" ADD CONSTRAINT "UsuarioDependencia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioDependencia" ADD CONSTRAINT "UsuarioDependencia_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Dependencia"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UsuarioCargo" ADD CONSTRAINT "UsuarioCargo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioCargo" ADD CONSTRAINT "UsuarioCargo_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Permiso" ADD CONSTRAINT "Permiso_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "Modulo"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_coordinador_id_fkey" FOREIGN KEY ("coordinador_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProyectoDependencia" ADD CONSTRAINT "ProyectoDependencia_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoDependencia" ADD CONSTRAINT "ProyectoDependencia_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProyectoEquipo" ADD CONSTRAINT "ProyectoEquipo_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoEquipo" ADD CONSTRAINT "ProyectoEquipo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoWorkflow" ADD CONSTRAINT "ProyectoWorkflow_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProyectoWorkflow" ADD CONSTRAINT "ProyectoWorkflow_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProyectoWorkflow" ADD CONSTRAINT "ProyectoWorkflow_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoResponsabilidad" ADD CONSTRAINT "ProyectoResponsabilidad_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProyectoResponsabilidad" ADD CONSTRAINT "ProyectoResponsabilidad_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProyectoResponsabilidad" ADD CONSTRAINT "ProyectoResponsabilidad_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_evidencia_id_fkey" FOREIGN KEY ("evidencia_id") REFERENCES "Evidencia"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Observacion"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "HistorialProyecto" ADD CONSTRAINT "HistorialProyecto_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialProyecto" ADD CONSTRAINT "HistorialProyecto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "Actividad"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
