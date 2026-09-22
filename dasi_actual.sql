--
-- PostgreSQL database dump
--

\restrict fVkGhoKlkYctf4fU1hZpxPlXO2oVvoICLNyqBefRt2hei1mIePXrweGqwJJaN56

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoActividad; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoActividad" AS ENUM (
    'Pendiente',
    'Aprobado',
    'EnCurso',
    'Terminado',
    'EnRevision',
    'Completado'
);


ALTER TYPE public."EstadoActividad" OWNER TO postgres;

--
-- Name: EstadoEvidencia; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoEvidencia" AS ENUM (
    'Pendiente',
    'EnRevision',
    'Aprobada',
    'Observada'
);


ALTER TYPE public."EstadoEvidencia" OWNER TO postgres;

--
-- Name: EstadoObservacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoObservacion" AS ENUM (
    'Abierta',
    'Respondida',
    'Resuelta'
);


ALTER TYPE public."EstadoObservacion" OWNER TO postgres;

--
-- Name: EstadoProyecto; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoProyecto" AS ENUM (
    'Pendiente',
    'Aprobado',
    'EnCurso',
    'Implementado',
    'EnRevision',
    'Completado'
);


ALTER TYPE public."EstadoProyecto" OWNER TO postgres;

--
-- Name: EstadoUsuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoUsuario" AS ENUM (
    'Activo',
    'Inactivo'
);


ALTER TYPE public."EstadoUsuario" OWNER TO postgres;

--
-- Name: EstadoWorkflow; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoWorkflow" AS ENUM (
    'Pendiente',
    'EnCurso',
    'Completado'
);


ALTER TYPE public."EstadoWorkflow" OWNER TO postgres;

--
-- Name: Prioridad; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Prioridad" AS ENUM (
    'Alta',
    'Media',
    'Baja'
);


ALTER TYPE public."Prioridad" OWNER TO postgres;

--
-- Name: ScopeRol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ScopeRol" AS ENUM (
    'GLOBAL',
    'DEPENDENCIA',
    'PROPIO',
    'ASIGNADO'
);


ALTER TYPE public."ScopeRol" OWNER TO postgres;

--
-- Name: StorageProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StorageProvider" AS ENUM (
    'local',
    's3',
    'r2',
    'minio'
);


ALTER TYPE public."StorageProvider" OWNER TO postgres;

--
-- Name: TipoAccionPermiso; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoAccionPermiso" AS ENUM (
    'Ver',
    'Crear',
    'Editar',
    'CambiarEstado',
    'Eliminar',
    'Aprobar',
    'Observar',
    'Asignar',
    'Exportar',
    'Administrar',
    'Revisar',
    'Completar'
);


ALTER TYPE public."TipoAccionPermiso" OWNER TO postgres;

--
-- Name: TipoDependencia; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoDependencia" AS ENUM (
    'Oficina',
    'Escuela',
    'JGA',
    'Direccion'
);


ALTER TYPE public."TipoDependencia" OWNER TO postgres;

--
-- Name: TipoEventoCalendario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoEventoCalendario" AS ENUM (
    'PROYECTO',
    'ACTIVIDAD',
    'PERSONAL',
    'REUNION'
);


ALTER TYPE public."TipoEventoCalendario" OWNER TO postgres;

--
-- Name: TipoNotificacion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoNotificacion" AS ENUM (
    'PROYECTO_CREADO',
    'PROYECTO_ASIGNADO',
    'ACTIVIDAD_ASIGNADA',
    'ACTIVIDAD_PROXIMO_VENCER',
    'ACTIVIDAD_VENCIDA',
    'PROYECTO_PROXIMO_VENCER',
    'PROYECTO_VENCIDO',
    'PROYECTO_ESTANCADO',
    'EVIDENCIA_PENDIENTE',
    'OBSERVACION_REGISTRADA',
    'ACTIVIDAD_PENDIENTE_REVISION',
    'PROYECTO_PENDIENTE_APROBACION',
    'PROYECTO_IMPLEMENTADO',
    'PROYECTO_COMPLETADO',
    'SISTEMA'
);


ALTER TYPE public."TipoNotificacion" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Actividad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Actividad" (
    id uuid NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    proyecto_id uuid NOT NULL,
    responsable_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    prioridad public."Prioridad" DEFAULT 'Media'::public."Prioridad" NOT NULL,
    estado public."EstadoActividad" DEFAULT 'Pendiente'::public."EstadoActividad" NOT NULL,
    progreso integer DEFAULT 0 NOT NULL,
    fecha_inicio timestamp(3) without time zone,
    fecha_fin_estimada timestamp(3) without time zone,
    fecha_fin_real timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    code text,
    fase text
);


ALTER TABLE public."Actividad" OWNER TO postgres;

--
-- Name: Archivo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Archivo" (
    id uuid NOT NULL,
    nombre_original text NOT NULL,
    nombre_storage text NOT NULL,
    extension text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    storage_provider public."StorageProvider" DEFAULT 'r2'::public."StorageProvider" NOT NULL,
    storage_key text NOT NULL,
    bucket text NOT NULL,
    checksum text,
    cdn_url text,
    usuario_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public."Archivo" OWNER TO postgres;

--
-- Name: Auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Auditoria" (
    id uuid NOT NULL,
    usuario_id uuid,
    accion text NOT NULL,
    modulo text NOT NULL,
    entidad text NOT NULL,
    entidad_id text,
    descripcion text,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Auditoria" OWNER TO postgres;

--
-- Name: Cargo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Cargo" (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cargo" OWNER TO postgres;

--
-- Name: Configuracion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Configuracion" (
    id uuid NOT NULL,
    clave text NOT NULL,
    valor text NOT NULL,
    descripcion text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Configuracion" OWNER TO postgres;

--
-- Name: Dependencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dependencia" (
    id uuid NOT NULL,
    code text NOT NULL,
    nombre text NOT NULL,
    tipo public."TipoDependencia" NOT NULL,
    director text NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    parent_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public."Dependencia" OWNER TO postgres;

--
-- Name: EventoCalendario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EventoCalendario" (
    id uuid NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    todo_dia boolean DEFAULT false NOT NULL,
    color text,
    tipo public."TipoEventoCalendario" DEFAULT 'PERSONAL'::public."TipoEventoCalendario" NOT NULL,
    usuario_id uuid NOT NULL,
    proyecto_id uuid,
    actividad_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EventoCalendario" OWNER TO postgres;

--
-- Name: Evidencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Evidencia" (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    actividad_id uuid,
    proyecto_id uuid,
    archivo_id uuid,
    usuario_id uuid NOT NULL,
    estado public."EstadoEvidencia" DEFAULT 'Pendiente'::public."EstadoEvidencia" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public."Evidencia" OWNER TO postgres;

--
-- Name: HistorialProyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HistorialProyecto" (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    estado_anterior public."EstadoProyecto",
    estado_nuevo public."EstadoProyecto" NOT NULL,
    accion text NOT NULL,
    comentario text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."HistorialProyecto" OWNER TO postgres;

--
-- Name: Modulo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Modulo" (
    id uuid NOT NULL,
    slug text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Modulo" OWNER TO postgres;

--
-- Name: Notificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notificacion" (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    titulo text NOT NULL,
    mensaje text NOT NULL,
    tipo public."TipoNotificacion" DEFAULT 'SISTEMA'::public."TipoNotificacion" NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    proyecto_id uuid,
    actividad_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notificacion" OWNER TO postgres;

--
-- Name: Observacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Observacion" (
    id uuid NOT NULL,
    contenido text NOT NULL,
    evidencia_id uuid,
    actividad_id uuid,
    proyecto_id uuid,
    usuario_id uuid NOT NULL,
    parent_id uuid,
    estado public."EstadoObservacion" DEFAULT 'Abierta'::public."EstadoObservacion" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public."Observacion" OWNER TO postgres;

--
-- Name: Permiso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Permiso" (
    id uuid NOT NULL,
    modulo_id uuid NOT NULL,
    accion public."TipoAccionPermiso" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Permiso" OWNER TO postgres;

--
-- Name: Proyecto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Proyecto" (
    id uuid NOT NULL,
    code text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    owner_id uuid NOT NULL,
    coordinador_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    dependencia_id uuid NOT NULL,
    prioridad public."Prioridad" DEFAULT 'Media'::public."Prioridad" NOT NULL,
    estado public."EstadoProyecto" DEFAULT 'Pendiente'::public."EstadoProyecto" NOT NULL,
    riesgo boolean DEFAULT false NOT NULL,
    progreso integer DEFAULT 0 NOT NULL,
    fecha_inicio timestamp(3) without time zone,
    fecha_fin_estimada timestamp(3) without time zone,
    fecha_fin_real timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    objetivo text
);


ALTER TABLE public."Proyecto" OWNER TO postgres;

--
-- Name: ProyectoDependencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProyectoDependencia" (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    dependencia_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProyectoDependencia" OWNER TO postgres;

--
-- Name: ProyectoEquipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProyectoEquipo" (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProyectoEquipo" OWNER TO postgres;

--
-- Name: ProyectoResponsabilidad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProyectoResponsabilidad" (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    etapa public."EstadoProyecto" NOT NULL,
    dependencia_id uuid NOT NULL,
    responsable_id uuid,
    accion text NOT NULL,
    habilitado boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProyectoResponsabilidad" OWNER TO postgres;

--
-- Name: ProyectoWorkflow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProyectoWorkflow" (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    orden integer NOT NULL,
    estado public."EstadoWorkflow" DEFAULT 'Pendiente'::public."EstadoWorkflow" NOT NULL,
    dependencia_id uuid,
    responsable_id uuid,
    accion_requerida text,
    started_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    etapa text NOT NULL
);


ALTER TABLE public."ProyectoWorkflow" OWNER TO postgres;

--
-- Name: Rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Rol" (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    scope public."ScopeRol" DEFAULT 'DEPENDENCIA'::public."ScopeRol" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Rol" OWNER TO postgres;

--
-- Name: RolPermiso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolPermiso" (
    id uuid NOT NULL,
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RolPermiso" OWNER TO postgres;

--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Usuario" (
    id uuid NOT NULL,
    email text NOT NULL,
    nombre text NOT NULL,
    account text NOT NULL,
    initials text,
    avatar_url text,
    estado public."EstadoUsuario" DEFAULT 'Activo'::public."EstadoUsuario" NOT NULL,
    dependencia_id uuid,
    cargo_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public."Usuario" OWNER TO postgres;

--
-- Name: UsuarioCargo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UsuarioCargo" (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    cargo_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UsuarioCargo" OWNER TO postgres;

--
-- Name: UsuarioDependencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UsuarioDependencia" (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    dependencia_id uuid NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UsuarioDependencia" OWNER TO postgres;

--
-- Name: UsuarioRol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UsuarioRol" (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UsuarioRol" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Actividad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Actividad" (id, titulo, descripcion, proyecto_id, responsable_id, created_by_id, prioridad, estado, progreso, fecha_inicio, fecha_fin_estimada, fecha_fin_real, created_at, updated_at, deleted_at, code, fase) FROM stdin;
81e2b5d2-86f4-4dd2-b315-915c07afe56b	PRUEBA ACTIVIDAD	\N	969bb4ca-4808-4edf-b8ab-f844b4a5884e	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Media	Pendiente	0	\N	2026-09-16 23:51:00	\N	2026-09-15 23:51:40.235	2026-09-15 23:51:40.235	\N	ACT-2026-0008-01	\N
6e47e69c-d514-49a5-87f5-bc85e0304968	Configuración del servidor	Instalación y configuración inicial del servidor de la plataforma.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	e0304016-adf6-471f-badc-0ea2965ea4f2	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Alta	Pendiente	0	2026-09-18 14:00:00	2026-10-05 14:00:00	\N	2026-09-15 22:58:06.468	2026-09-15 22:58:06.468	\N	ACT-2026-0001-01	Implementación
a87c963a-b846-42fd-aab1-600c22962384	Pruebas técnicas	Pruebas de integración y validación de la plataforma.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	e0304016-adf6-471f-badc-0ea2965ea4f2	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Media	Pendiente	0	2026-10-06 14:00:00	2026-10-30 14:00:00	\N	2026-09-15 22:58:06.473	2026-09-15 22:58:06.473	\N	ACT-2026-0001-02	Pruebas
e63ffec6-2e82-4667-8fa7-ba98f20ff115	Definición de alcance	Definición del alcance del proyecto.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Alta	Pendiente	0	\N	\N	\N	2026-09-15 22:58:06.475	2026-09-15 22:58:06.475	\N	ACT-2026-0001-03	Planificación
26a0cff0-77a8-401b-bb46-bb71a803562c	Levantamiento de requerimientos	Levantamiento de requerimientos con las áreas.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Alta	Pendiente	0	\N	\N	\N	2026-09-15 22:58:06.477	2026-09-15 22:58:06.477	\N	ACT-2026-0001-04	Planificación
9448e6ca-b95f-41e2-b70e-62ec1a599be9	Configuración de la plataforma	Habilitación y configuración funcional de la plataforma.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	e0304016-adf6-471f-badc-0ea2965ea4f2	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Alta	Pendiente	0	2026-09-23 14:00:00	2026-10-15 14:00:00	\N	2026-09-15 22:58:06.478	2026-09-15 22:58:06.478	\N	ACT-2026-0001-05	Implementación
11c7918d-5863-4875-92f3-e5a89caacc87	Validación de entregables	Validación funcional de los entregables con el coordinador.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	e0304016-adf6-471f-badc-0ea2965ea4f2	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Media	Pendiente	0	2026-10-31 14:00:00	2026-11-14 14:00:00	\N	2026-09-15 22:58:06.479	2026-09-15 22:58:06.479	\N	ACT-2026-0001-06	Pruebas
18fa3351-97fb-440c-8502-eb5491e6bc3b	Documentación de cierre	Elaboración de la documentación de cierre.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Media	Pendiente	0	\N	\N	\N	2026-09-15 22:58:06.481	2026-09-15 22:58:06.481	\N	ACT-2026-0001-07	Cierre
e744739e-3a87-4feb-8360-4d3b97fa1b61	Entrega del resultado	Entrega formal del resultado a la institución.	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Media	Pendiente	0	\N	\N	\N	2026-09-15 22:58:06.484	2026-09-15 22:58:06.484	\N	ACT-2026-0001-08	Cierre
\.


--
-- Data for Name: Archivo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Archivo" (id, nombre_original, nombre_storage, extension, mime_type, size_bytes, storage_provider, storage_key, bucket, checksum, cdn_url, usuario_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: Auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Auditoria" (id, usuario_id, accion, modulo, entidad, entidad_id, descripcion, ip_address, user_agent, metadata, created_at) FROM stdin;
e0f6f168-4be4-4bc8-a075-896f3f234046	e0f5412c-104f-421f-b847-342b457357bf	LOGIN	AUTH	Usuario	e0f5412c-104f-421f-b847-342b457357bf	Inicio de sesión simulado.	127.0.0.1	\N	\N	2026-09-15 22:47:06.943
c98ef6a7-9850-47b9-9ac7-42c82015e477	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	ACTUALIZAR	Proyectos	Proyecto	12ecd4c4-3144-4b48-8f3d-fbc30156d295	Actualización de proyecto.	\N	\N	\N	2026-09-15 22:47:06.946
7819466e-dd94-4d58-9b85-c64ef5b23a7b	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	CREAR	Actividades	Actividad	6e47e69c-d514-49a5-87f5-bc85e0304968	Registro de actividad.	\N	\N	\N	2026-09-15 22:58:06.507
\.


--
-- Data for Name: Cargo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Cargo" (id, nombre, descripcion, created_at, updated_at) FROM stdin;
907f2fe8-ee15-409d-965c-c0319e43ccf0	Gerente General	Máxima autoridad de la institución.	2026-09-15 22:47:06.321	2026-09-15 22:47:06.321
39c65efe-45f3-4b4e-91f7-2ed12299d379	Director General de Administración	Responsable de la administración institucional.	2026-09-15 22:47:06.322	2026-09-15 22:47:06.322
a4bd696b-cc1f-48bc-816e-fcea55edb656	Presidente de la Junta General Administrativa	Preside la Junta General Administrativa.	2026-09-15 22:47:06.324	2026-09-15 22:47:06.324
d9a9c595-520d-48d6-af31-56ddd6e35a50	Jefe de Departamento de TI	Lidera el departamento de tecnología.	2026-09-15 22:47:06.325	2026-09-15 22:47:06.325
90ba360c-6608-422a-ae8d-eb7c6ad0942d	Analista de TI	Ejecuta y analiza tareas técnicas del departamento.	2026-09-15 22:47:06.326	2026-09-15 22:47:06.326
\.


--
-- Data for Name: Configuracion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Configuracion" (id, clave, valor, descripcion, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Dependencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dependencia" (id, code, nombre, tipo, director, activa, parent_id, created_at, updated_at, deleted_at) FROM stdin;
69db5ff8-c8e3-4b92-8106-867c173582d2	DEP-GERENCIA	Gerencia	Direccion	Gerente General	t	\N	2026-09-15 22:47:06.31	2026-09-15 22:47:06.31	\N
30cb74fa-f360-46b5-8180-ca67d30e5e7c	DEP-DGA	Administración General	Direccion	Director General de Administración	t	69db5ff8-c8e3-4b92-8106-867c173582d2	2026-09-15 22:47:06.314	2026-09-15 22:47:06.314	\N
0cde5221-d3f1-4404-9e3b-ca76c9b1768c	DEP-JGA	Junta General Administrativa	JGA	Presidente de la Junta General Administrativa	t	69db5ff8-c8e3-4b92-8106-867c173582d2	2026-09-15 22:47:06.316	2026-09-15 22:47:06.316	\N
68efb134-6a1b-45d2-9490-f25629f91896	DEP-TI	Departamento de TI	Oficina	Jefe de Departamento de TI	t	30cb74fa-f360-46b5-8180-ca67d30e5e7c	2026-09-15 22:47:06.318	2026-09-15 22:47:06.318	\N
f3bb8e88-1fbb-456c-9820-7fe13dd78d89	DEP-ESC	Escuela Técnica	Escuela	Director de Escuela Técnica	t	30cb74fa-f360-46b5-8180-ca67d30e5e7c	2026-09-15 22:47:06.32	2026-09-15 22:47:06.32	\N
\.


--
-- Data for Name: EventoCalendario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EventoCalendario" (id, titulo, descripcion, fecha_inicio, fecha_fin, todo_dia, color, tipo, usuario_id, proyecto_id, actividad_id, created_at, updated_at) FROM stdin;
3f536b37-6ed5-491b-8e2c-a4328dfedaab	Reunión de seguimiento	Revisión de avance de la plataforma de gestión TI.	2026-09-17 14:00:00	2026-09-17 15:00:00	f	#3C50E0	REUNION	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	12ecd4c4-3144-4b48-8f3d-fbc30156d295	\N	2026-09-15 22:47:06.93	2026-09-15 22:47:06.93
611c92e5-a940-4da5-8b76-15fa0fa46d13	Hito de proyecto	Hito programado de la plataforma de gestión TI.	2026-09-25 14:00:00	2026-09-25 14:00:00	t	#F59E0B	PROYECTO	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	12ecd4c4-3144-4b48-8f3d-fbc30156d295	\N	2026-09-15 22:47:06.935	2026-09-15 22:47:06.935
b10c8cf3-9fcf-439f-a064-8b8a7d70c056	Sesión de Junta	Revisión de avances institucionales.	2026-09-23 14:00:00	2026-09-23 14:00:00	t	#8B5CF6	REUNION	bb63efb3-cebb-43e6-898c-68851915f367	\N	\N	2026-09-15 22:47:06.938	2026-09-15 22:47:06.938
e07fadda-20b3-4503-a4d3-e84ba1e60d25	Comité de gerencia	Seguimiento de cartera de proyectos.	2026-09-18 14:00:00	2026-09-18 17:00:00	f	#3C50E0	REUNION	592a045a-e8c4-4f9c-bc9a-dc4af8e2e40d	12ecd4c4-3144-4b48-8f3d-fbc30156d295	\N	2026-09-15 22:47:06.939	2026-09-15 22:47:06.939
dcd81967-0373-449d-be2e-6f771246f7bd	Revisión de administración	Auditoría de ejecución presupuestaria.	2026-09-21 14:00:00	2026-09-21 14:00:00	t	#F59E0B	REUNION	d6f2410a-b59f-4544-b73d-376af4ca554d	33e0e8fd-850d-4066-8c26-29c5b26b7ee3	\N	2026-09-15 22:47:06.941	2026-09-15 22:47:06.941
aad62d6b-dc6e-4451-891c-8354467b2ee8	ACT-2026-0001-01 · Configuración del servidor	Configuración del servidor	2026-09-20 16:00:00	2026-09-20 17:00:00	f	#10B981	ACTIVIDAD	e0304016-adf6-471f-badc-0ea2965ea4f2	\N	6e47e69c-d514-49a5-87f5-bc85e0304968	2026-09-15 22:58:06.502	2026-09-15 22:58:06.502
\.


--
-- Data for Name: Evidencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Evidencia" (id, nombre, descripcion, actividad_id, proyecto_id, archivo_id, usuario_id, estado, created_at, updated_at, deleted_at) FROM stdin;
85ad49e0-e868-45ec-97fb-b5b581cdfbfc	Evidencia de configuración	Registro de la configuración inicial del servidor.	6e47e69c-d514-49a5-87f5-bc85e0304968	\N	\N	e0304016-adf6-471f-badc-0ea2965ea4f2	Pendiente	2026-09-15 22:58:06.487	2026-09-15 22:58:06.487	\N
1501193a-b73b-4347-bb41-b2634768e08b	Evidencia de pruebas técnicas	Resultados de las pruebas técnicas (sin archivo adjunto).	a87c963a-b846-42fd-aab1-600c22962384	\N	\N	e0304016-adf6-471f-badc-0ea2965ea4f2	EnRevision	2026-09-15 22:58:06.49	2026-09-15 22:58:06.49	\N
\.


--
-- Data for Name: HistorialProyecto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HistorialProyecto" (id, proyecto_id, usuario_id, estado_anterior, estado_nuevo, accion, comentario, created_at) FROM stdin;
1dea9a33-4775-4459-b9a6-738e307141f3	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	\N	Pendiente	Creación de proyecto	Proyecto registrado por Christ (Jefe de TI).	2026-09-15 22:47:06.883
45c2ba27-8627-4594-ae8c-8c6a67637faf	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	\N	Pendiente	Derivación a Administración General	Proyecto derivado a Administración General para su revisión y aprobación.	2026-09-15 22:47:06.885
6a1d3a2b-5eda-4ef8-9c17-49b08b2886ce	12ecd4c4-3144-4b48-8f3d-fbc30156d295	d6f2410a-b59f-4544-b73d-376af4ca554d	Pendiente	Aprobado	Aprobación de proyecto	Juan aprueba el proyecto y DASI activa el workflow con fases y actividades base.	2026-09-15 22:47:06.886
13d40ea6-4753-4585-839a-e0846d5c16a0	12ecd4c4-3144-4b48-8f3d-fbc30156d295	d6f2410a-b59f-4544-b73d-376af4ca554d	Pendiente	Aprobado	Activación de workflow	Workflow con fases y actividades base creado tras la aprobación del proyecto.	2026-09-15 22:47:06.887
b713b996-96ae-4979-9a8b-e97170d7d00c	33e0e8fd-850d-4066-8c26-29c5b26b7ee3	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	\N	Pendiente	Creación de proyecto	Proyecto registrado por Christ (Jefe de TI).	2026-09-15 22:47:06.889
964ad543-42e8-4367-ba67-597db836bb09	33e0e8fd-850d-4066-8c26-29c5b26b7ee3	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	\N	Pendiente	Derivación a Administración General	Proyecto derivado a Administración General para su revisión y aprobación.	2026-09-15 22:47:06.89
f349608e-3bf8-4cd2-bbcb-5c3cdc1ad3f9	969bb4ca-4808-4edf-b8ab-f844b4a5884e	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	\N	Pendiente	Creación de proyecto	Proyecto registrado	2026-09-15 23:50:34.58
\.


--
-- Data for Name: Modulo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Modulo" (id, slug, nombre, descripcion, activo, created_at, updated_at) FROM stdin;
a51198d0-a7d8-4de3-af0e-8632f76b9581	dashboard	Dashboard	Módulo Dashboard	t	2026-09-15 22:47:06.334	2026-09-15 22:47:06.334
86d4bcf3-1339-4850-a42c-b1a4e673a5fe	proyectos	Proyectos	Módulo Proyectos	t	2026-09-15 22:47:06.337	2026-09-15 22:47:06.337
6bbdc041-f70d-461d-b6ac-41254fba51b2	mis-proyectos	Mis proyectos	Módulo Mis proyectos	t	2026-09-15 22:47:06.339	2026-09-15 22:47:06.339
c736ae46-3767-4860-ba5c-e304de3de167	proyectos-oficina	Proyectos de mi oficina	Módulo Proyectos de mi oficina	t	2026-09-15 22:47:06.341	2026-09-15 22:47:06.341
bf90b87a-70c9-4f92-b6ae-c6056cdd07b7	proyectos-colaboracion	Proyectos donde colaboro	Módulo Proyectos donde colaboro	t	2026-09-15 22:47:06.342	2026-09-15 22:47:06.342
05b18373-d1f2-4b2c-b396-dac136b406ff	tareas	Tareas	Módulo Tareas	t	2026-09-15 22:47:06.343	2026-09-15 22:47:06.343
df673c9d-5be0-41f5-a7ea-d8f125bd856c	kanban	Kanban	Módulo Kanban	t	2026-09-15 22:47:06.344	2026-09-15 22:47:06.344
cdbb817e-7ed0-43a9-a73f-8926b940bd98	workflow	Workflow	Módulo Workflow	t	2026-09-15 22:47:06.345	2026-09-15 22:47:06.345
3f95adf3-1574-4203-8273-b643a412af72	actividades	Actividades	Módulo Actividades	t	2026-09-15 22:47:06.346	2026-09-15 22:47:06.346
95bf655f-c57f-4e39-985a-3dfb1f5a201a	observaciones	Observaciones	Módulo Observaciones	t	2026-09-15 22:47:06.347	2026-09-15 22:47:06.347
f3f05577-df10-46d7-bf98-e9e00d155b13	evidencias	Evidencias	Módulo Evidencias	t	2026-09-15 22:47:06.347	2026-09-15 22:47:06.347
88e4f704-c8f4-4c81-95de-f2d3bfda97e7	reportes	Reportes	Módulo Reportes	t	2026-09-15 22:47:06.348	2026-09-15 22:47:06.348
28e6f1ab-06cd-4868-8371-25a1b714a66a	indicadores	Indicadores	Módulo Indicadores	t	2026-09-15 22:47:06.349	2026-09-15 22:47:06.349
24686a90-2dc0-4007-a398-94de12c75d75	usuarios	Usuarios	Módulo Usuarios	t	2026-09-15 22:47:06.35	2026-09-15 22:47:06.35
9cbd4a1a-7e86-4d56-9b2d-061190e75dce	roles	Roles	Módulo Roles	t	2026-09-15 22:47:06.351	2026-09-15 22:47:06.351
026b5331-a5f0-489a-97b1-a7189b7c25d9	permisos	Permisos	Módulo Permisos	t	2026-09-15 22:47:06.352	2026-09-15 22:47:06.352
d0b29d37-87a8-451c-9f9e-618ffcd5d96b	modulos	Módulos	Módulo Módulos	t	2026-09-15 22:47:06.353	2026-09-15 22:47:06.353
445fc5c0-385f-4d75-ab0d-c288190ba739	dependencias	Dependencias	Módulo Dependencias	t	2026-09-15 22:47:06.354	2026-09-15 22:47:06.354
754ffa1c-f641-441e-93b8-e766d96aefa4	configuracion	Configuración	Módulo Configuración	t	2026-09-15 22:47:06.355	2026-09-15 22:47:06.355
213fe399-f446-4cf1-bcfa-f62065ea0245	calendar	Calendario	Módulo Calendario	t	2026-09-15 22:47:06.356	2026-09-15 22:47:06.356
2b92c4c7-a6a8-4f16-a27d-f10ca105b6fe	profile	Perfil	Módulo Perfil	t	2026-09-15 22:47:06.357	2026-09-15 22:47:06.357
99a50cff-3802-4ad1-b243-f81be8db043d	notificaciones	Notificaciones	Módulo Notificaciones	t	2026-09-15 22:47:06.358	2026-09-15 22:47:06.358
3e682fbe-88c4-4cf4-b7c9-3c4664694004	auditoria	Auditoría	Módulo Auditoría	t	2026-09-15 22:47:06.359	2026-09-15 22:47:06.359
de774cbc-57c0-4bc8-a8f8-7ad025252ada	cargos	Cargos	Módulo Cargos	t	2026-09-15 22:58:05.995	2026-09-15 22:58:05.995
23e7a2be-4d5f-4ce5-b084-c32c9b8bd185	administracion	Panel de administración	Módulo Panel de administración	t	2026-09-15 22:58:05.998	2026-09-15 22:58:05.998
\.


--
-- Data for Name: Notificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notificacion" (id, usuario_id, titulo, mensaje, tipo, leida, proyecto_id, actividad_id, created_at) FROM stdin;
56078398-2658-479b-9c0e-d4c4ac75870f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Proyecto creado	Recuerda que el proyecto está pendiente de aprobación.	PROYECTO_PENDIENTE_APROBACION	f	12ecd4c4-3144-4b48-8f3d-fbc30156d295	\N	2026-09-15 22:47:06.919
2193073d-3a5c-4082-98cf-1ad7b4d322de	d6f2410a-b59f-4544-b73d-376af4ca554d	Proyecto por revisar	El proyecto PRY-2026-0001 fue derivado para su revisión y aprobación.	PROYECTO_PENDIENTE_APROBACION	f	12ecd4c4-3144-4b48-8f3d-fbc30156d295	\N	2026-09-15 22:47:06.921
c8c900e5-e0b0-4e66-809e-33ee8fb0036b	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Workflow activado	El proyecto PRY-2026-0001 fue aprobado. Su workflow de fases y actividades base quedó activo.	PROYECTO_ASIGNADO	f	12ecd4c4-3144-4b48-8f3d-fbc30156d295	\N	2026-09-15 22:47:06.922
d2076123-e303-4880-be37-e98237da51a7	e0304016-adf6-471f-badc-0ea2965ea4f2	Actividad asignada	Se te asignó la actividad de configuración del servidor.	ACTIVIDAD_ASIGNADA	f	\N	\N	2026-09-15 22:47:06.924
625eace9-2d82-4b72-974c-d04b6c49a817	d6f2410a-b59f-4544-b73d-376af4ca554d	Evidencia pendiente	Existe una evidencia por revisar.	EVIDENCIA_PENDIENTE	t	\N	\N	2026-09-15 22:47:06.926
49e9ed6a-3c51-4310-8e46-fbb229401f74	e0304016-adf6-471f-badc-0ea2965ea4f2	Nuevo proyecto para colaborar	Christ te asignó como colaborador del proyecto PRY-S3HPV8 - Prueba Calendario.	PROYECTO_ASIGNADO	f	969bb4ca-4808-4edf-b8ab-f844b4a5884e	\N	2026-09-15 23:50:34.601
\.


--
-- Data for Name: Observacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Observacion" (id, contenido, evidencia_id, actividad_id, proyecto_id, usuario_id, parent_id, estado, created_at, updated_at, deleted_at) FROM stdin;
22849929-7915-4fe8-8472-f5ba2ccc2312	Observación general sobre la plataforma de gestión TI.	\N	\N	12ecd4c4-3144-4b48-8f3d-fbc30156d295	d6f2410a-b59f-4544-b73d-376af4ca554d	\N	Abierta	2026-09-15 22:47:06.909	2026-09-15 22:47:06.909	\N
4be8c1fa-2b16-458d-b1a9-98258bfff91c	Observación sobre la configuración del servidor.	\N	6e47e69c-d514-49a5-87f5-bc85e0304968	\N	d6f2410a-b59f-4544-b73d-376af4ca554d	\N	Abierta	2026-09-15 22:58:06.493	2026-09-15 22:58:06.493	\N
53737a66-54a4-42f4-9545-ff40925d7fc8	Observación sobre la evidencia de configuración.	85ad49e0-e868-45ec-97fb-b5b581cdfbfc	\N	\N	d6f2410a-b59f-4544-b73d-376af4ca554d	\N	Respondida	2026-09-15 22:58:06.495	2026-09-15 22:58:06.495	\N
e67e572d-2780-40cf-acaa-301c0f73062f	Respuesta a la observación anterior.	85ad49e0-e868-45ec-97fb-b5b581cdfbfc	\N	\N	e0304016-adf6-471f-badc-0ea2965ea4f2	53737a66-54a4-42f4-9545-ff40925d7fc8	Respondida	2026-09-15 22:58:06.498	2026-09-15 22:58:06.498	\N
\.


--
-- Data for Name: Permiso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permiso" (id, modulo_id, accion, created_at) FROM stdin;
48435ca2-b3ac-4093-9549-0484be2ef3d1	a51198d0-a7d8-4de3-af0e-8632f76b9581	Ver	2026-09-15 22:47:06.361
677f294c-4bcb-4740-8432-0e40e868bf28	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Ver	2026-09-15 22:47:06.363
f16e15bb-7f72-4657-ba77-d8fbb5c0a682	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Crear	2026-09-15 22:47:06.366
7b288c58-1c33-4fae-b2e8-e41315872b0e	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Editar	2026-09-15 22:47:06.368
69a70c09-6860-41a1-afa3-bfd72dc39e8f	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	CambiarEstado	2026-09-15 22:47:06.369
abdaf4fa-6f15-445f-80a2-a9b29ed8df5e	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Asignar	2026-09-15 22:47:06.371
a0bbb2f0-71e8-48e1-b188-0f490c1a9b94	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Exportar	2026-09-15 22:47:06.373
4ea263ea-5e95-4b92-9b11-0223ec585fc1	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Aprobar	2026-09-15 22:47:06.375
3510fde0-d706-42f1-a493-f137ef667ef6	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Revisar	2026-09-15 22:47:06.378
ca7d2248-51d8-4f0f-88b4-b34e67d952e8	86d4bcf3-1339-4850-a42c-b1a4e673a5fe	Completar	2026-09-15 22:47:06.38
15fc7a01-9d2b-47ae-af3a-36814764c38b	6bbdc041-f70d-461d-b6ac-41254fba51b2	Ver	2026-09-15 22:47:06.381
5b4c3f42-e057-44c1-8999-e96dbd11a921	c736ae46-3767-4860-ba5c-e304de3de167	Ver	2026-09-15 22:47:06.382
b4966f18-011a-4131-8916-4a4a5ebf6868	bf90b87a-70c9-4f92-b6ae-c6056cdd07b7	Ver	2026-09-15 22:47:06.382
c87e9074-baec-4579-a272-7d1d12f41594	05b18373-d1f2-4b2c-b396-dac136b406ff	Ver	2026-09-15 22:47:06.383
3248b5d4-f775-4182-90ff-534966f15b63	05b18373-d1f2-4b2c-b396-dac136b406ff	Crear	2026-09-15 22:47:06.384
c1defb99-00e0-40d1-8349-d1c853aa4363	05b18373-d1f2-4b2c-b396-dac136b406ff	Editar	2026-09-15 22:47:06.385
6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	05b18373-d1f2-4b2c-b396-dac136b406ff	CambiarEstado	2026-09-15 22:47:06.386
9b67c347-6057-45ff-b72a-3df20841e4b5	05b18373-d1f2-4b2c-b396-dac136b406ff	Asignar	2026-09-15 22:47:06.387
dd757290-292f-4823-9529-8756e9e6e17b	df673c9d-5be0-41f5-a7ea-d8f125bd856c	Ver	2026-09-15 22:47:06.387
48dac0ac-0651-4f65-95d7-fd59ad7148b3	df673c9d-5be0-41f5-a7ea-d8f125bd856c	CambiarEstado	2026-09-15 22:47:06.388
301d75c5-b82d-496a-b4f4-430ec0fbdb0b	cdbb817e-7ed0-43a9-a73f-8926b940bd98	Ver	2026-09-15 22:47:06.389
10f2319b-bb48-4909-b47d-241ef8e96372	cdbb817e-7ed0-43a9-a73f-8926b940bd98	CambiarEstado	2026-09-15 22:47:06.389
89bffa38-5df3-4006-bb13-bfd7c40fac5b	cdbb817e-7ed0-43a9-a73f-8926b940bd98	Aprobar	2026-09-15 22:47:06.39
fe2a205c-080d-4037-b9db-1abd0d511c90	cdbb817e-7ed0-43a9-a73f-8926b940bd98	Administrar	2026-09-15 22:47:06.393
32b806c9-c70c-4f10-98be-5ca32186d12c	3f95adf3-1574-4203-8273-b643a412af72	Ver	2026-09-15 22:47:06.394
a9cfc42d-8d98-4356-beec-9db6e05056c9	3f95adf3-1574-4203-8273-b643a412af72	Crear	2026-09-15 22:47:06.395
df9abaa4-eda5-44fe-bb02-bd2b2efb9377	3f95adf3-1574-4203-8273-b643a412af72	Editar	2026-09-15 22:47:06.396
af582657-1097-43a1-8f5e-6e8aec133a6f	3f95adf3-1574-4203-8273-b643a412af72	CambiarEstado	2026-09-15 22:47:06.397
2d7ecf70-bc34-41ec-b254-f97598c9214c	3f95adf3-1574-4203-8273-b643a412af72	Asignar	2026-09-15 22:47:06.397
d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	95bf655f-c57f-4e39-985a-3dfb1f5a201a	Ver	2026-09-15 22:47:06.398
dde5878d-6868-4a0b-975a-0b98eddda706	95bf655f-c57f-4e39-985a-3dfb1f5a201a	Crear	2026-09-15 22:47:06.399
5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	95bf655f-c57f-4e39-985a-3dfb1f5a201a	Aprobar	2026-09-15 22:47:06.4
765caa9e-e225-425d-8e25-c1366be6731f	95bf655f-c57f-4e39-985a-3dfb1f5a201a	Observar	2026-09-15 22:47:06.402
c69e5727-cabd-45d9-9d76-4759c1cb5a43	f3f05577-df10-46d7-bf98-e9e00d155b13	Ver	2026-09-15 22:47:06.403
e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	f3f05577-df10-46d7-bf98-e9e00d155b13	Crear	2026-09-15 22:47:06.405
cca4f78a-48d8-4e02-9aa6-309e70f4fc26	f3f05577-df10-46d7-bf98-e9e00d155b13	Editar	2026-09-15 22:47:06.406
84d41aea-d458-456f-9fc0-b04ce93827cd	f3f05577-df10-46d7-bf98-e9e00d155b13	Aprobar	2026-09-15 22:47:06.408
94e68de2-92ef-48e9-bf2b-6c054148612a	f3f05577-df10-46d7-bf98-e9e00d155b13	Observar	2026-09-15 22:47:06.408
f9ee6b59-460e-405f-9397-16810308c645	f3f05577-df10-46d7-bf98-e9e00d155b13	Exportar	2026-09-15 22:47:06.409
acd5685a-1b55-4c13-9f51-0d1286e06614	88e4f704-c8f4-4c81-95de-f2d3bfda97e7	Ver	2026-09-15 22:47:06.41
37d3bc7e-8143-4fea-a189-de58821558f7	88e4f704-c8f4-4c81-95de-f2d3bfda97e7	Exportar	2026-09-15 22:47:06.411
c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	28e6f1ab-06cd-4868-8371-25a1b714a66a	Ver	2026-09-15 22:47:06.411
3bb4d633-927c-4c73-85a1-fb6ad820c087	28e6f1ab-06cd-4868-8371-25a1b714a66a	Exportar	2026-09-15 22:47:06.412
a82e293b-a148-4bba-8090-61ca7551adfb	24686a90-2dc0-4007-a398-94de12c75d75	Ver	2026-09-15 22:47:06.413
5ea9ce57-f843-4720-a45d-ba12e885760a	24686a90-2dc0-4007-a398-94de12c75d75	Crear	2026-09-15 22:47:06.413
23bba934-3503-4670-8bd7-c655fb05193f	24686a90-2dc0-4007-a398-94de12c75d75	Editar	2026-09-15 22:47:06.415
ac921b38-afbd-4945-a0f4-d73f6c088439	24686a90-2dc0-4007-a398-94de12c75d75	Eliminar	2026-09-15 22:47:06.417
37f9c5e1-5a82-461e-938b-f01ad4f9fd01	24686a90-2dc0-4007-a398-94de12c75d75	Administrar	2026-09-15 22:47:06.419
c0c76066-3f60-4054-b0c2-b4f0bebf75a4	9cbd4a1a-7e86-4d56-9b2d-061190e75dce	Ver	2026-09-15 22:47:06.421
d8625a1a-70df-41be-b1a3-27d1f4bf3f7f	9cbd4a1a-7e86-4d56-9b2d-061190e75dce	Crear	2026-09-15 22:47:06.422
0b898f95-46f5-4ed7-ae5b-0cf473501c93	9cbd4a1a-7e86-4d56-9b2d-061190e75dce	Editar	2026-09-15 22:47:06.423
46834a51-59ce-49e7-ae70-88ca33d10482	9cbd4a1a-7e86-4d56-9b2d-061190e75dce	Administrar	2026-09-15 22:47:06.423
7eef209f-b6ce-48f8-9a72-8a94a851cdf8	026b5331-a5f0-489a-97b1-a7189b7c25d9	Ver	2026-09-15 22:47:06.424
873e4e94-1839-4255-aedb-1c531fa657b2	026b5331-a5f0-489a-97b1-a7189b7c25d9	Crear	2026-09-15 22:47:06.425
22370c13-3a78-4294-bec1-d1e7e06f2b85	026b5331-a5f0-489a-97b1-a7189b7c25d9	Editar	2026-09-15 22:47:06.426
db9a2d60-1b1a-4257-bea1-2bf68a3f574c	026b5331-a5f0-489a-97b1-a7189b7c25d9	Administrar	2026-09-15 22:47:06.426
1ddfbca3-ffa5-465b-a0ed-0254045b1bcf	d0b29d37-87a8-451c-9f9e-618ffcd5d96b	Ver	2026-09-15 22:47:06.427
c49e55bf-5628-4a77-a7aa-73162fccf62d	d0b29d37-87a8-451c-9f9e-618ffcd5d96b	Editar	2026-09-15 22:47:06.428
9c8c600e-9279-4a45-91a6-723dfa7194be	d0b29d37-87a8-451c-9f9e-618ffcd5d96b	Administrar	2026-09-15 22:47:06.429
9cd72aa5-125c-4d42-bf92-3601b66c6356	445fc5c0-385f-4d75-ab0d-c288190ba739	Ver	2026-09-15 22:47:06.429
590b6464-fa7c-4833-961f-ac680cf4100a	445fc5c0-385f-4d75-ab0d-c288190ba739	Editar	2026-09-15 22:47:06.431
8bddca66-db7a-4e0d-9207-22170a0ecc10	445fc5c0-385f-4d75-ab0d-c288190ba739	Administrar	2026-09-15 22:47:06.432
b052b0f1-aeb3-48cd-a5e5-089aef531d24	754ffa1c-f641-441e-93b8-e766d96aefa4	Ver	2026-09-15 22:47:06.433
1eea6b58-06c5-4ce5-8c0c-8c00ac540014	754ffa1c-f641-441e-93b8-e766d96aefa4	Editar	2026-09-15 22:47:06.434
9293bc2f-05d7-40bd-a540-15f13f24155c	754ffa1c-f641-441e-93b8-e766d96aefa4	Administrar	2026-09-15 22:47:06.435
f6febf90-32da-41d5-ae8c-17a6ef2b2b63	213fe399-f446-4cf1-bcfa-f62065ea0245	Ver	2026-09-15 22:47:06.436
15f629fc-797b-47dd-bbf0-268b3a642308	2b92c4c7-a6a8-4f16-a27d-f10ca105b6fe	Ver	2026-09-15 22:47:06.437
f73a0f55-73d1-4c4a-ba69-e9d24c208473	2b92c4c7-a6a8-4f16-a27d-f10ca105b6fe	Editar	2026-09-15 22:47:06.438
bac161ad-826d-4473-85ae-ab69cb70e3a7	99a50cff-3802-4ad1-b243-f81be8db043d	Ver	2026-09-15 22:47:06.438
c0a83812-e631-4b37-ab22-aeeda212af55	3e682fbe-88c4-4cf4-b7c9-3c4664694004	Ver	2026-09-15 22:47:06.439
46de47d5-89cd-4907-8c2f-70c66c923353	3e682fbe-88c4-4cf4-b7c9-3c4664694004	Exportar	2026-09-15 22:47:06.44
0ecd8f24-e447-4d40-86f7-198f9c694b02	de774cbc-57c0-4bc8-a8f8-7ad025252ada	Ver	2026-09-15 22:58:06.035
fb2823fa-e007-4b48-9d39-0936eeeafde0	de774cbc-57c0-4bc8-a8f8-7ad025252ada	Crear	2026-09-15 22:58:06.038
1c6c7360-d65c-46b7-b7bd-72352c7fa318	de774cbc-57c0-4bc8-a8f8-7ad025252ada	Editar	2026-09-15 22:58:06.039
075571be-f85f-4405-81f3-abd0e11c5969	de774cbc-57c0-4bc8-a8f8-7ad025252ada	Eliminar	2026-09-15 22:58:06.041
0afe315d-2eab-47a1-96f4-c35e670c3c52	de774cbc-57c0-4bc8-a8f8-7ad025252ada	Administrar	2026-09-15 22:58:06.043
e0635090-9259-4879-9551-222d4a31e6d3	23e7a2be-4d5f-4ce5-b084-c32c9b8bd185	Ver	2026-09-15 22:58:06.045
201cc912-6ca3-4c3b-a1f8-8ace220f42aa	23e7a2be-4d5f-4ce5-b084-c32c9b8bd185	Administrar	2026-09-15 22:58:06.047
\.


--
-- Data for Name: Proyecto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Proyecto" (id, code, nombre, descripcion, owner_id, coordinador_id, created_by_id, dependencia_id, prioridad, estado, riesgo, progreso, fecha_inicio, fecha_fin_estimada, fecha_fin_real, created_at, updated_at, deleted_at, objetivo) FROM stdin;
12ecd4c4-3144-4b48-8f3d-fbc30156d295	PRY-2026-0001	Implementación de plataforma de gestión TI	Proyecto institucional: implementación de la plataforma de gestión TI.	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	68efb134-6a1b-45d2-9490-f25629f91896	Alta	Aprobado	f	0	2026-09-15 14:00:00	2026-11-14 14:00:00	\N	2026-09-15 22:47:06.849	2026-09-15 22:47:06.849	\N	Proveer a la institución de una plataforma centralizada de gestión de TI.
33e0e8fd-850d-4066-8c26-29c5b26b7ee3	PRY-2026-0002	Automatización de inventario de activos	Proyecto sin participación de JHONATAN (caso de visibilidad restringida).	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	68efb134-6a1b-45d2-9490-f25629f91896	Baja	Pendiente	f	0	2026-09-20 14:00:00	2026-11-29 14:00:00	\N	2026-09-15 22:47:06.852	2026-09-15 22:47:06.852	\N	Digitalizar el inventario de activos institucionales.
969bb4ca-4808-4edf-b8ab-f844b4a5884e	PRY-S3HPV8	Prueba Calendario	\N	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	68efb134-6a1b-45d2-9490-f25629f91896	Media	Pendiente	f	0	2026-09-16 23:50:00	2026-09-30 23:50:00	\N	2026-09-15 23:50:34.58	2026-09-15 23:50:34.58	\N	\N
\.


--
-- Data for Name: ProyectoDependencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProyectoDependencia" (id, proyecto_id, dependencia_id, created_at) FROM stdin;
e00c45f9-07b0-4621-b366-e0e1de308f28	12ecd4c4-3144-4b48-8f3d-fbc30156d295	68efb134-6a1b-45d2-9490-f25629f91896	2026-09-15 22:47:06.854
6b2e6c28-82de-4d8e-9502-fce00550835c	33e0e8fd-850d-4066-8c26-29c5b26b7ee3	68efb134-6a1b-45d2-9490-f25629f91896	2026-09-15 22:47:06.856
\.


--
-- Data for Name: ProyectoEquipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProyectoEquipo" (id, proyecto_id, usuario_id, created_at) FROM stdin;
2bc3ff12-5b4e-4d08-a7c2-0bda99451867	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	2026-09-15 22:47:06.858
7346f68b-609b-4c0c-9a76-e4436edc0d7a	12ecd4c4-3144-4b48-8f3d-fbc30156d295	e0304016-adf6-471f-badc-0ea2965ea4f2	2026-09-15 22:47:06.86
8cd06ce6-e980-4cf4-832a-d68bc7f22c53	33e0e8fd-850d-4066-8c26-29c5b26b7ee3	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	2026-09-15 22:47:06.861
efdcf845-4ae9-4273-9292-b50d35c3164d	969bb4ca-4808-4edf-b8ab-f844b4a5884e	e0304016-adf6-471f-badc-0ea2965ea4f2	2026-09-15 23:50:34.58
\.


--
-- Data for Name: ProyectoResponsabilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProyectoResponsabilidad" (id, proyecto_id, etapa, dependencia_id, responsable_id, accion, habilitado, created_at, updated_at) FROM stdin;
9ece9419-0c9c-4db3-9503-8f648fc90291	12ecd4c4-3144-4b48-8f3d-fbc30156d295	Aprobado	30cb74fa-f360-46b5-8180-ca67d30e5e7c	d6f2410a-b59f-4544-b73d-376af4ca554d	Aprobar el proyecto	t	2026-09-15 22:47:06.874	2026-09-15 22:47:06.874
66e44f98-f30b-43df-bb08-9bb35580b138	12ecd4c4-3144-4b48-8f3d-fbc30156d295	EnCurso	68efb134-6a1b-45d2-9490-f25629f91896	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Ejecutar el plan	t	2026-09-15 22:47:06.877	2026-09-15 22:47:06.877
a46edcb3-9042-4f98-a283-b507a3d35608	12ecd4c4-3144-4b48-8f3d-fbc30156d295	EnRevision	30cb74fa-f360-46b5-8180-ca67d30e5e7c	d6f2410a-b59f-4544-b73d-376af4ca554d	Revisión final	t	2026-09-15 22:47:06.88	2026-09-15 22:47:06.88
\.


--
-- Data for Name: ProyectoWorkflow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProyectoWorkflow" (id, proyecto_id, orden, estado, dependencia_id, responsable_id, accion_requerida, started_at, completed_at, created_at, updated_at, etapa) FROM stdin;
145841aa-cecb-40a8-89fd-3e1a3f6f9636	12ecd4c4-3144-4b48-8f3d-fbc30156d295	1	EnCurso	68efb134-6a1b-45d2-9490-f25629f91896	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Definir alcance, requerimientos y plan de trabajo	2026-09-15 22:47:06.862	\N	2026-09-15 22:47:06.863	2026-09-15 22:47:06.863	Planificación
36d95348-9730-476f-ba64-12298ab8950c	12ecd4c4-3144-4b48-8f3d-fbc30156d295	2	Pendiente	68efb134-6a1b-45d2-9490-f25629f91896	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Ejecutar las actividades operativas del plan	\N	\N	2026-09-15 22:47:06.866	2026-09-15 22:47:06.866	Implementación
af9e2a32-082f-42b5-9a31-e04fcfb5eec9	12ecd4c4-3144-4b48-8f3d-fbc30156d295	3	Pendiente	68efb134-6a1b-45d2-9490-f25629f91896	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Validar los entregables y registrar evidencias	\N	\N	2026-09-15 22:47:06.868	2026-09-15 22:47:06.868	Pruebas
3b07119a-5abc-401e-9218-24f38ba9f6de	12ecd4c4-3144-4b48-8f3d-fbc30156d295	4	Pendiente	68efb134-6a1b-45d2-9490-f25629f91896	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	Documentar lecciones y cerrar el proyecto	\N	\N	2026-09-15 22:47:06.87	2026-09-15 22:47:06.87	Cierre
\.


--
-- Data for Name: Rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Rol" (id, nombre, descripcion, scope, created_at, updated_at) FROM stdin;
40ba94fc-6508-4518-8d09-bd801175cca2	ADMINISTRADOR	Acceso global a todos los módulos y acciones del sistema.	GLOBAL	2026-09-15 22:47:06.327	2026-09-15 22:47:06.327
7b253400-4952-4b31-9194-4170d1b33c8e	GERENCIA	Visión global de todos los proyectos de la institución.	GLOBAL	2026-09-15 22:47:06.328	2026-09-15 22:47:06.328
379218c6-67eb-4954-bfe0-f536502ffa34	JGA	Junta General Administrativa: visión global y supervisión institucional.	GLOBAL	2026-09-15 22:47:06.329	2026-09-15 22:47:06.329
40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	ADMINISTRACION_GENERAL	Administración General: revisión y aprobación de proyectos.	GLOBAL	2026-09-15 22:47:06.33	2026-09-15 22:47:06.33
fd2e9277-19a5-496f-98de-7328c2abd06f	DEPARTAMENTO_TI	Departamento de TI: gestor de dependencia y flujo técnico.	DEPENDENCIA	2026-09-15 22:47:06.331	2026-09-15 22:47:06.331
4af7b92c-24ea-4a75-a629-94575e8f35c1	COLABORADOR	Ejecuta y actualiza las actividades que le asignan.	PROPIO	2026-09-15 22:47:06.332	2026-09-15 22:47:06.332
8b9e5e16-cb18-4744-8942-f5094b2743de	CONSULTA	Solo lectura: puede ver y observar la información autorizada.	PROPIO	2026-09-15 22:47:06.333	2026-09-15 22:47:06.333
e7217a18-ba9d-498c-82e3-2e940110c861	PRUEBA	\N	PROPIO	2026-09-15 23:48:18.669	2026-09-15 23:48:18.669
\.


--
-- Data for Name: RolPermiso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolPermiso" (id, rol_id, permiso_id, created_at) FROM stdin;
b93458e6-ed71-4c79-852d-6ce5ffaf989f	40ba94fc-6508-4518-8d09-bd801175cca2	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.484
dd367e7f-5c25-4851-b274-f83603ab5606	40ba94fc-6508-4518-8d09-bd801175cca2	677f294c-4bcb-4740-8432-0e40e868bf28	2026-09-15 22:47:06.487
4dac2450-407f-43ae-93bb-ddd0605ea9ec	40ba94fc-6508-4518-8d09-bd801175cca2	f16e15bb-7f72-4657-ba77-d8fbb5c0a682	2026-09-15 22:47:06.488
70b8d4df-a405-4c9e-b9e9-90ea701bd790	40ba94fc-6508-4518-8d09-bd801175cca2	7b288c58-1c33-4fae-b2e8-e41315872b0e	2026-09-15 22:47:06.489
ae6b9965-26c9-4552-b87b-be5088ea2292	40ba94fc-6508-4518-8d09-bd801175cca2	69a70c09-6860-41a1-afa3-bfd72dc39e8f	2026-09-15 22:47:06.49
df7a5a37-de2c-4cc7-a684-ef8b45c78b2b	40ba94fc-6508-4518-8d09-bd801175cca2	abdaf4fa-6f15-445f-80a2-a9b29ed8df5e	2026-09-15 22:47:06.492
e20402ce-32cc-4867-85f8-c5c955d6cf76	40ba94fc-6508-4518-8d09-bd801175cca2	a0bbb2f0-71e8-48e1-b188-0f490c1a9b94	2026-09-15 22:47:06.493
7d7fb88f-db3d-4627-b2da-49783fc2092f	40ba94fc-6508-4518-8d09-bd801175cca2	4ea263ea-5e95-4b92-9b11-0223ec585fc1	2026-09-15 22:47:06.494
1e699c5f-7d44-4294-af2b-4f546610c92a	40ba94fc-6508-4518-8d09-bd801175cca2	3510fde0-d706-42f1-a493-f137ef667ef6	2026-09-15 22:47:06.496
ae498254-c840-4e3a-819f-4770b13a013f	40ba94fc-6508-4518-8d09-bd801175cca2	ca7d2248-51d8-4f0f-88b4-b34e67d952e8	2026-09-15 22:47:06.498
ffcc6618-4672-4e55-a548-d556aed4b4be	40ba94fc-6508-4518-8d09-bd801175cca2	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.5
bca380c2-3898-4887-97fb-1abccc1afb59	40ba94fc-6508-4518-8d09-bd801175cca2	5b4c3f42-e057-44c1-8999-e96dbd11a921	2026-09-15 22:47:06.501
126f9641-1a7d-4ff7-b3d7-f1521fa560c9	40ba94fc-6508-4518-8d09-bd801175cca2	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.502
483f9421-956d-4470-9a4d-90bdf5bce0e2	40ba94fc-6508-4518-8d09-bd801175cca2	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.503
7a9a2b3e-8087-43d2-89cd-9d3f75015f33	40ba94fc-6508-4518-8d09-bd801175cca2	3248b5d4-f775-4182-90ff-534966f15b63	2026-09-15 22:47:06.504
c4596fb2-84fe-49b3-b368-45d90aa2f66e	40ba94fc-6508-4518-8d09-bd801175cca2	c1defb99-00e0-40d1-8349-d1c853aa4363	2026-09-15 22:47:06.505
e83d05b6-3170-431b-afd8-a9d6d6a5a8c1	40ba94fc-6508-4518-8d09-bd801175cca2	6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	2026-09-15 22:47:06.506
db245b32-4eae-43f3-bb0f-992997fd2f30	40ba94fc-6508-4518-8d09-bd801175cca2	9b67c347-6057-45ff-b72a-3df20841e4b5	2026-09-15 22:47:06.507
80de0d03-54ba-4897-861f-ac4d333f7442	40ba94fc-6508-4518-8d09-bd801175cca2	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.508
c5fd5f0d-96c9-42ad-bce1-6458531ebc00	40ba94fc-6508-4518-8d09-bd801175cca2	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.51
c3c7fd3f-e0b4-45dd-8e16-68422841805a	40ba94fc-6508-4518-8d09-bd801175cca2	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.512
0b32e85a-fdeb-485d-9ea1-a8cb048f2097	40ba94fc-6508-4518-8d09-bd801175cca2	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.513
a2e060bc-48ef-46c6-9e89-a4d078f5d5c5	40ba94fc-6508-4518-8d09-bd801175cca2	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.514
a0f9dbc8-9549-4a59-9ce0-25078b09e889	40ba94fc-6508-4518-8d09-bd801175cca2	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.515
03075750-0622-4757-917f-bbaaf8189fbd	40ba94fc-6508-4518-8d09-bd801175cca2	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.517
16fbfd7a-6208-4be7-b53e-c2c700b5f4bc	40ba94fc-6508-4518-8d09-bd801175cca2	a9cfc42d-8d98-4356-beec-9db6e05056c9	2026-09-15 22:47:06.517
99538665-5c0c-4d81-803a-a669d762b2c8	40ba94fc-6508-4518-8d09-bd801175cca2	df9abaa4-eda5-44fe-bb02-bd2b2efb9377	2026-09-15 22:47:06.519
4dde937a-0274-4f8a-a254-84a544f74a2c	40ba94fc-6508-4518-8d09-bd801175cca2	af582657-1097-43a1-8f5e-6e8aec133a6f	2026-09-15 22:47:06.52
afa2a79d-2749-4cdd-aab4-bc800af6a181	40ba94fc-6508-4518-8d09-bd801175cca2	2d7ecf70-bc34-41ec-b254-f97598c9214c	2026-09-15 22:47:06.52
f1359b5e-5eec-45d3-b17e-0321999edf0a	40ba94fc-6508-4518-8d09-bd801175cca2	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.521
a003a207-64c5-4749-bb9f-a19efafe8f81	40ba94fc-6508-4518-8d09-bd801175cca2	dde5878d-6868-4a0b-975a-0b98eddda706	2026-09-15 22:47:06.522
86d3ed60-329a-47d2-b4dd-5766c6da5d5f	40ba94fc-6508-4518-8d09-bd801175cca2	5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	2026-09-15 22:47:06.523
44099315-deea-4fcb-ba57-406afb18a232	40ba94fc-6508-4518-8d09-bd801175cca2	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.525
308b0edd-5e4b-427b-b7aa-73526063d9ea	40ba94fc-6508-4518-8d09-bd801175cca2	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.527
cce3cb04-caff-49ae-94db-570c7e7a1b2a	40ba94fc-6508-4518-8d09-bd801175cca2	e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	2026-09-15 22:47:06.528
11ad2c43-a6cf-4ef6-a584-de90b9b013a4	40ba94fc-6508-4518-8d09-bd801175cca2	cca4f78a-48d8-4e02-9aa6-309e70f4fc26	2026-09-15 22:47:06.529
f647af92-2e20-49a4-b413-8e9e3a1c5543	40ba94fc-6508-4518-8d09-bd801175cca2	84d41aea-d458-456f-9fc0-b04ce93827cd	2026-09-15 22:47:06.532
210f3b25-672e-4e4d-bb1b-393a8ec6875f	40ba94fc-6508-4518-8d09-bd801175cca2	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.534
a549cae8-7bb0-4b34-9ee9-6ade20f0e8a6	40ba94fc-6508-4518-8d09-bd801175cca2	f9ee6b59-460e-405f-9397-16810308c645	2026-09-15 22:47:06.535
60d0988a-c681-4750-962d-d992f1ddfad5	40ba94fc-6508-4518-8d09-bd801175cca2	acd5685a-1b55-4c13-9f51-0d1286e06614	2026-09-15 22:47:06.536
81f4d92b-524f-47bb-b158-5fc5f2e8a8bc	40ba94fc-6508-4518-8d09-bd801175cca2	37d3bc7e-8143-4fea-a189-de58821558f7	2026-09-15 22:47:06.536
eef19fed-e3ab-4367-9094-b4be6b4b7552	40ba94fc-6508-4518-8d09-bd801175cca2	c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	2026-09-15 22:47:06.538
0d462212-0e25-4767-a7c8-631fd17c74e3	40ba94fc-6508-4518-8d09-bd801175cca2	3bb4d633-927c-4c73-85a1-fb6ad820c087	2026-09-15 22:47:06.54
6c63e643-84a4-4758-a2d3-91ff376f301a	40ba94fc-6508-4518-8d09-bd801175cca2	a82e293b-a148-4bba-8090-61ca7551adfb	2026-09-15 22:47:06.541
a98135ca-449f-44c4-b2fe-33ee1e55b9eb	40ba94fc-6508-4518-8d09-bd801175cca2	5ea9ce57-f843-4720-a45d-ba12e885760a	2026-09-15 22:47:06.543
a696edc1-a65f-4ea9-bcf5-25c9e5aed691	40ba94fc-6508-4518-8d09-bd801175cca2	23bba934-3503-4670-8bd7-c655fb05193f	2026-09-15 22:47:06.545
5a79f5db-00d4-4d2f-861b-680c35109e49	40ba94fc-6508-4518-8d09-bd801175cca2	ac921b38-afbd-4945-a0f4-d73f6c088439	2026-09-15 22:47:06.546
8a04d008-3d87-4d68-b4dc-e889df863c2b	40ba94fc-6508-4518-8d09-bd801175cca2	37f9c5e1-5a82-461e-938b-f01ad4f9fd01	2026-09-15 22:47:06.547
b0a373a3-f6aa-45cc-9942-743d2f0a7c64	40ba94fc-6508-4518-8d09-bd801175cca2	c0c76066-3f60-4054-b0c2-b4f0bebf75a4	2026-09-15 22:47:06.548
3d443b5f-0bbc-4959-a532-6c1aebc6aa8a	40ba94fc-6508-4518-8d09-bd801175cca2	d8625a1a-70df-41be-b1a3-27d1f4bf3f7f	2026-09-15 22:47:06.549
343fe033-9f70-474e-8d7d-b10859d2a1e8	40ba94fc-6508-4518-8d09-bd801175cca2	0b898f95-46f5-4ed7-ae5b-0cf473501c93	2026-09-15 22:47:06.551
4cf33a7f-1093-4660-abc4-22119b150572	40ba94fc-6508-4518-8d09-bd801175cca2	46834a51-59ce-49e7-ae70-88ca33d10482	2026-09-15 22:47:06.554
b7326ebd-6114-416d-8e9b-e22e03802bf8	40ba94fc-6508-4518-8d09-bd801175cca2	7eef209f-b6ce-48f8-9a72-8a94a851cdf8	2026-09-15 22:47:06.558
29d44d11-3cd5-40cd-8f2f-6051a04bbc75	40ba94fc-6508-4518-8d09-bd801175cca2	873e4e94-1839-4255-aedb-1c531fa657b2	2026-09-15 22:47:06.562
4c8b1e2d-8a1a-4139-8e72-0e6a1cc7d640	40ba94fc-6508-4518-8d09-bd801175cca2	22370c13-3a78-4294-bec1-d1e7e06f2b85	2026-09-15 22:47:06.564
11415ada-5137-45b0-8ba7-36f9b43a5130	40ba94fc-6508-4518-8d09-bd801175cca2	db9a2d60-1b1a-4257-bea1-2bf68a3f574c	2026-09-15 22:47:06.565
3a7addf4-546f-4e79-9e14-92adc9b22724	40ba94fc-6508-4518-8d09-bd801175cca2	1ddfbca3-ffa5-465b-a0ed-0254045b1bcf	2026-09-15 22:47:06.567
384e3aa8-8ad6-4213-95fd-1c0f10a84330	40ba94fc-6508-4518-8d09-bd801175cca2	c49e55bf-5628-4a77-a7aa-73162fccf62d	2026-09-15 22:47:06.569
a6411036-08bb-408b-9fc2-b7c625dca51b	40ba94fc-6508-4518-8d09-bd801175cca2	9c8c600e-9279-4a45-91a6-723dfa7194be	2026-09-15 22:47:06.57
741afb83-7fbd-45b4-bfe6-a68a21cebdae	40ba94fc-6508-4518-8d09-bd801175cca2	9cd72aa5-125c-4d42-bf92-3601b66c6356	2026-09-15 22:47:06.572
f077427e-70d7-45e4-a258-1dd99e336ab8	40ba94fc-6508-4518-8d09-bd801175cca2	590b6464-fa7c-4833-961f-ac680cf4100a	2026-09-15 22:47:06.574
126f7100-e2b6-4dfd-9585-b1ac523932f0	40ba94fc-6508-4518-8d09-bd801175cca2	8bddca66-db7a-4e0d-9207-22170a0ecc10	2026-09-15 22:47:06.575
3d07d2b3-e63c-4200-89d9-67a5c52f073e	40ba94fc-6508-4518-8d09-bd801175cca2	b052b0f1-aeb3-48cd-a5e5-089aef531d24	2026-09-15 22:47:06.576
4da5f27a-fc38-4bce-b053-37d58a39ef25	40ba94fc-6508-4518-8d09-bd801175cca2	1eea6b58-06c5-4ce5-8c0c-8c00ac540014	2026-09-15 22:47:06.577
002932e6-1799-44d1-bb43-97d0819b9a93	40ba94fc-6508-4518-8d09-bd801175cca2	9293bc2f-05d7-40bd-a540-15f13f24155c	2026-09-15 22:47:06.578
d42f4ac2-a907-447f-b2ee-64e5ac751dbb	40ba94fc-6508-4518-8d09-bd801175cca2	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.58
9e91e6f2-067f-42f4-b3bb-db24e52f08f1	40ba94fc-6508-4518-8d09-bd801175cca2	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.581
695e1925-d6f7-4c55-91d5-dee587ea2d37	40ba94fc-6508-4518-8d09-bd801175cca2	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.581
bc8aa5e9-4beb-46b8-b7d2-31bf81bd7d89	40ba94fc-6508-4518-8d09-bd801175cca2	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.582
106610a1-eefa-47c0-9d34-541ba33257b0	40ba94fc-6508-4518-8d09-bd801175cca2	c0a83812-e631-4b37-ab22-aeeda212af55	2026-09-15 22:47:06.583
390190b7-1f9e-4e54-b57f-a02c0f68e51b	40ba94fc-6508-4518-8d09-bd801175cca2	46de47d5-89cd-4907-8c2f-70c66c923353	2026-09-15 22:47:06.585
de55c13c-c600-4492-9948-d39f8ca8c272	7b253400-4952-4b31-9194-4170d1b33c8e	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.586
c1917de6-0320-4355-a376-36ce08bd5d6a	7b253400-4952-4b31-9194-4170d1b33c8e	677f294c-4bcb-4740-8432-0e40e868bf28	2026-09-15 22:47:06.588
dc2ad3cc-c084-412b-a4dd-8303dd41f01a	7b253400-4952-4b31-9194-4170d1b33c8e	f16e15bb-7f72-4657-ba77-d8fbb5c0a682	2026-09-15 22:47:06.589
964b1a73-5ec2-434d-be70-22916032feb8	7b253400-4952-4b31-9194-4170d1b33c8e	7b288c58-1c33-4fae-b2e8-e41315872b0e	2026-09-15 22:47:06.591
16a0e663-df7c-4d68-97e6-d80fd378f59a	7b253400-4952-4b31-9194-4170d1b33c8e	69a70c09-6860-41a1-afa3-bfd72dc39e8f	2026-09-15 22:47:06.592
45ae9876-d759-4252-a5fd-5dce9b4270b0	7b253400-4952-4b31-9194-4170d1b33c8e	abdaf4fa-6f15-445f-80a2-a9b29ed8df5e	2026-09-15 22:47:06.594
45a2014c-890a-4f6a-ade1-711850668474	7b253400-4952-4b31-9194-4170d1b33c8e	a0bbb2f0-71e8-48e1-b188-0f490c1a9b94	2026-09-15 22:47:06.595
19b35d71-a218-4a3f-a751-90e5c967a291	7b253400-4952-4b31-9194-4170d1b33c8e	4ea263ea-5e95-4b92-9b11-0223ec585fc1	2026-09-15 22:47:06.596
ef8b6702-3ab6-47cd-83af-f411c78d16a5	7b253400-4952-4b31-9194-4170d1b33c8e	3510fde0-d706-42f1-a493-f137ef667ef6	2026-09-15 22:47:06.597
bbe966ab-8a8f-44af-ae6b-32d82ca6eafc	7b253400-4952-4b31-9194-4170d1b33c8e	ca7d2248-51d8-4f0f-88b4-b34e67d952e8	2026-09-15 22:47:06.598
8eb73a57-6c0d-45ce-ba85-671d62fb3b2e	7b253400-4952-4b31-9194-4170d1b33c8e	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.599
23b36514-6c15-409e-a9cb-fcbb924f60a3	7b253400-4952-4b31-9194-4170d1b33c8e	5b4c3f42-e057-44c1-8999-e96dbd11a921	2026-09-15 22:47:06.6
bc890cbf-74e1-465a-8761-6034948099c2	7b253400-4952-4b31-9194-4170d1b33c8e	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.601
674de608-9afc-4fef-8a0f-7c63200c4721	7b253400-4952-4b31-9194-4170d1b33c8e	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.602
219f7647-d5dd-45b9-a434-328812bae456	7b253400-4952-4b31-9194-4170d1b33c8e	3248b5d4-f775-4182-90ff-534966f15b63	2026-09-15 22:47:06.604
fa55aa7f-e654-48b8-a6c0-50445d382cdb	7b253400-4952-4b31-9194-4170d1b33c8e	c1defb99-00e0-40d1-8349-d1c853aa4363	2026-09-15 22:47:06.606
fdf1ea8e-19fa-48e2-ac59-551b53b1579a	7b253400-4952-4b31-9194-4170d1b33c8e	6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	2026-09-15 22:47:06.607
84b0e519-7db6-4fa2-a224-bee09ce4c8cd	7b253400-4952-4b31-9194-4170d1b33c8e	9b67c347-6057-45ff-b72a-3df20841e4b5	2026-09-15 22:47:06.608
00b793e1-2edf-444c-a64f-e128a8c8498d	7b253400-4952-4b31-9194-4170d1b33c8e	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.609
0f4fa7f5-c87a-4e43-bba7-dedfe3c3cda9	7b253400-4952-4b31-9194-4170d1b33c8e	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.61
2fdbc358-e31d-40e0-933f-dbb79b2c184d	7b253400-4952-4b31-9194-4170d1b33c8e	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.611
65c70e59-0169-4e5c-b537-b12932020df3	7b253400-4952-4b31-9194-4170d1b33c8e	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.612
2859b23e-13d8-4956-8c30-db3aea5206fe	7b253400-4952-4b31-9194-4170d1b33c8e	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.613
5af81caa-bb00-4ee8-b4be-36fc16abb741	7b253400-4952-4b31-9194-4170d1b33c8e	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.613
e58949a8-f47b-4551-86d8-bae165e2dfb3	40ba94fc-6508-4518-8d09-bd801175cca2	0ecd8f24-e447-4d40-86f7-198f9c694b02	2026-09-15 22:58:06.155
5bdf6b71-9a6b-4974-94a0-00b312fa1154	40ba94fc-6508-4518-8d09-bd801175cca2	fb2823fa-e007-4b48-9d39-0936eeeafde0	2026-09-15 22:58:06.157
f0c78917-645f-4619-9294-3c1cb4072e66	40ba94fc-6508-4518-8d09-bd801175cca2	1c6c7360-d65c-46b7-b7bd-72352c7fa318	2026-09-15 22:58:06.158
3afae5f0-1ffd-48a0-9751-b97155782ad4	40ba94fc-6508-4518-8d09-bd801175cca2	075571be-f85f-4405-81f3-abd0e11c5969	2026-09-15 22:58:06.159
a291dd32-0263-496e-a134-119224542d75	40ba94fc-6508-4518-8d09-bd801175cca2	0afe315d-2eab-47a1-96f4-c35e670c3c52	2026-09-15 22:58:06.161
c4d25e74-f6d5-40c6-938d-077638398a49	40ba94fc-6508-4518-8d09-bd801175cca2	e0635090-9259-4879-9551-222d4a31e6d3	2026-09-15 22:58:06.163
cbfec6d2-0416-458d-87cb-5cc318ede5c6	40ba94fc-6508-4518-8d09-bd801175cca2	201cc912-6ca3-4c3b-a1f8-8ace220f42aa	2026-09-15 22:58:06.164
310884f0-09f0-4f96-a2e9-b7c09d3ba618	e7217a18-ba9d-498c-82e3-2e940110c861	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 23:48:49.895
6a7db295-9098-42b1-aa68-e7ff7fd16c06	e7217a18-ba9d-498c-82e3-2e940110c861	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 23:48:49.895
1a22a483-af47-41a5-9acb-bec1f8d484c3	e7217a18-ba9d-498c-82e3-2e940110c861	37f9c5e1-5a82-461e-938b-f01ad4f9fd01	2026-09-15 23:48:49.895
9c4d4351-febd-4f82-ba3f-47a2abfbbc51	e7217a18-ba9d-498c-82e3-2e940110c861	ac921b38-afbd-4945-a0f4-d73f6c088439	2026-09-15 23:48:49.895
247c895a-16ae-48ba-8166-2f4e84df4cd6	e7217a18-ba9d-498c-82e3-2e940110c861	23bba934-3503-4670-8bd7-c655fb05193f	2026-09-15 23:48:49.895
128cfd12-d096-4e91-b2d0-d9e4271aed2a	e7217a18-ba9d-498c-82e3-2e940110c861	a82e293b-a148-4bba-8090-61ca7551adfb	2026-09-15 23:48:49.895
97406f84-3506-4651-b5a3-6a6576fab29c	e7217a18-ba9d-498c-82e3-2e940110c861	5ea9ce57-f843-4720-a45d-ba12e885760a	2026-09-15 23:48:49.895
63881fa7-9bab-4e51-92a9-7937ecf1a295	7b253400-4952-4b31-9194-4170d1b33c8e	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.614
bfeefda7-969a-4b45-b281-49e22c124a39	7b253400-4952-4b31-9194-4170d1b33c8e	a9cfc42d-8d98-4356-beec-9db6e05056c9	2026-09-15 22:47:06.616
54ce6705-39dc-4c5d-ae4c-0cd997f1a062	7b253400-4952-4b31-9194-4170d1b33c8e	df9abaa4-eda5-44fe-bb02-bd2b2efb9377	2026-09-15 22:47:06.617
2bf7628c-f3d6-405b-993c-e6aa551af5e9	7b253400-4952-4b31-9194-4170d1b33c8e	af582657-1097-43a1-8f5e-6e8aec133a6f	2026-09-15 22:47:06.618
9e41402e-1e2a-48ad-8be3-892e4c17370f	7b253400-4952-4b31-9194-4170d1b33c8e	2d7ecf70-bc34-41ec-b254-f97598c9214c	2026-09-15 22:47:06.62
292257e8-2a7b-4f9c-832d-8124ce43c0d4	7b253400-4952-4b31-9194-4170d1b33c8e	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.621
b6e40718-c5c1-44f1-adc9-00e8de366304	7b253400-4952-4b31-9194-4170d1b33c8e	dde5878d-6868-4a0b-975a-0b98eddda706	2026-09-15 22:47:06.621
dc702aff-5fe8-4581-9748-0c542c181cfc	7b253400-4952-4b31-9194-4170d1b33c8e	5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	2026-09-15 22:47:06.622
e47ae30a-40f5-43d6-9e13-32d582090cb6	7b253400-4952-4b31-9194-4170d1b33c8e	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.623
f27b0d75-1d3b-4f2d-a46c-a51680c37325	7b253400-4952-4b31-9194-4170d1b33c8e	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.624
0b4265a7-a02d-4f22-b189-d16164efc47b	7b253400-4952-4b31-9194-4170d1b33c8e	e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	2026-09-15 22:47:06.625
88db1297-2adc-4137-abdd-12a2dafb72e9	7b253400-4952-4b31-9194-4170d1b33c8e	cca4f78a-48d8-4e02-9aa6-309e70f4fc26	2026-09-15 22:47:06.626
8d5343cf-dacf-4fba-a4dd-df8afe9aeef9	7b253400-4952-4b31-9194-4170d1b33c8e	84d41aea-d458-456f-9fc0-b04ce93827cd	2026-09-15 22:47:06.626
1b6ecaf6-05e9-4613-a773-8939025ec722	7b253400-4952-4b31-9194-4170d1b33c8e	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.627
20fd4b56-e534-41de-a958-f33ab6462aa6	7b253400-4952-4b31-9194-4170d1b33c8e	f9ee6b59-460e-405f-9397-16810308c645	2026-09-15 22:47:06.628
67e2d1c0-5c9e-4a24-a318-50097813781d	7b253400-4952-4b31-9194-4170d1b33c8e	acd5685a-1b55-4c13-9f51-0d1286e06614	2026-09-15 22:47:06.629
6f83c646-25a8-46cb-9e26-115875e41517	7b253400-4952-4b31-9194-4170d1b33c8e	37d3bc7e-8143-4fea-a189-de58821558f7	2026-09-15 22:47:06.632
294e66a3-8d2e-4fe1-bb42-dcf0eb3ee57e	7b253400-4952-4b31-9194-4170d1b33c8e	c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	2026-09-15 22:47:06.633
12251f02-ac39-4419-b6f5-ff6f9923f9d0	7b253400-4952-4b31-9194-4170d1b33c8e	3bb4d633-927c-4c73-85a1-fb6ad820c087	2026-09-15 22:47:06.635
9505e63f-5c7a-4ed4-a22d-6610ca857c10	7b253400-4952-4b31-9194-4170d1b33c8e	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.636
d5a5a785-90f9-45fe-a201-549297b1bf46	7b253400-4952-4b31-9194-4170d1b33c8e	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.637
012cb536-9dc1-4fee-9a7f-2bc31df64010	7b253400-4952-4b31-9194-4170d1b33c8e	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.638
e7fcd566-90c5-472a-8c0c-8e39577ef042	7b253400-4952-4b31-9194-4170d1b33c8e	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.639
d7064a52-8f54-4b04-8f64-a4bb30ca2695	7b253400-4952-4b31-9194-4170d1b33c8e	c0a83812-e631-4b37-ab22-aeeda212af55	2026-09-15 22:47:06.64
fb8bd97e-b4fa-47e9-a400-a09d919c2d16	7b253400-4952-4b31-9194-4170d1b33c8e	46de47d5-89cd-4907-8c2f-70c66c923353	2026-09-15 22:47:06.64
1d888d1f-c92c-4c8b-ba22-1ac1256323d0	379218c6-67eb-4954-bfe0-f536502ffa34	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.641
57055642-5039-4a83-a505-59fc83263f6c	379218c6-67eb-4954-bfe0-f536502ffa34	677f294c-4bcb-4740-8432-0e40e868bf28	2026-09-15 22:47:06.642
29efb2bc-12b8-46ac-b161-211ef2ed9f54	379218c6-67eb-4954-bfe0-f536502ffa34	f16e15bb-7f72-4657-ba77-d8fbb5c0a682	2026-09-15 22:47:06.643
8f960136-cc29-436f-9db8-3bc81b64ef56	379218c6-67eb-4954-bfe0-f536502ffa34	7b288c58-1c33-4fae-b2e8-e41315872b0e	2026-09-15 22:47:06.644
508c5a04-1de3-4114-a218-e99db42fdd34	379218c6-67eb-4954-bfe0-f536502ffa34	69a70c09-6860-41a1-afa3-bfd72dc39e8f	2026-09-15 22:47:06.645
74843993-d797-468a-8736-a8072dd291e1	379218c6-67eb-4954-bfe0-f536502ffa34	abdaf4fa-6f15-445f-80a2-a9b29ed8df5e	2026-09-15 22:47:06.646
f7ea8489-6720-44fb-b15a-7cc2b1cdcfc1	379218c6-67eb-4954-bfe0-f536502ffa34	a0bbb2f0-71e8-48e1-b188-0f490c1a9b94	2026-09-15 22:47:06.647
9808d2fa-f3f4-4078-a342-af14ea1f515f	379218c6-67eb-4954-bfe0-f536502ffa34	4ea263ea-5e95-4b92-9b11-0223ec585fc1	2026-09-15 22:47:06.648
134418b2-bed0-4b2f-bb77-6c88548ac505	379218c6-67eb-4954-bfe0-f536502ffa34	3510fde0-d706-42f1-a493-f137ef667ef6	2026-09-15 22:47:06.649
163679fd-d1b4-4228-a927-8d67581af4bc	379218c6-67eb-4954-bfe0-f536502ffa34	ca7d2248-51d8-4f0f-88b4-b34e67d952e8	2026-09-15 22:47:06.65
448459f9-9461-4a61-baf6-4aa8c58c4714	379218c6-67eb-4954-bfe0-f536502ffa34	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.651
b93a6dda-3793-42eb-af0a-072053a29a65	379218c6-67eb-4954-bfe0-f536502ffa34	5b4c3f42-e057-44c1-8999-e96dbd11a921	2026-09-15 22:47:06.652
6ada23ee-2ba2-4cd3-9660-82214fc9f6f8	379218c6-67eb-4954-bfe0-f536502ffa34	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.653
01fd2dbc-f071-4a82-8897-1c9b22889bd9	379218c6-67eb-4954-bfe0-f536502ffa34	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.654
071f8ecf-ccc7-487f-9840-c84a46548833	379218c6-67eb-4954-bfe0-f536502ffa34	3248b5d4-f775-4182-90ff-534966f15b63	2026-09-15 22:47:06.655
f20ed935-11c3-4abc-b66d-7ae78a32f093	379218c6-67eb-4954-bfe0-f536502ffa34	c1defb99-00e0-40d1-8349-d1c853aa4363	2026-09-15 22:47:06.656
4c33ce33-3cb7-4a4a-b55a-fa8d03968128	379218c6-67eb-4954-bfe0-f536502ffa34	6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	2026-09-15 22:47:06.657
437c2ec5-afaa-47cf-9179-9287cd19bb19	379218c6-67eb-4954-bfe0-f536502ffa34	9b67c347-6057-45ff-b72a-3df20841e4b5	2026-09-15 22:47:06.658
d7123366-b74a-4fd4-b6b3-c087c22e572c	379218c6-67eb-4954-bfe0-f536502ffa34	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.659
2a31d883-d7dc-4f65-af14-99cb37486345	379218c6-67eb-4954-bfe0-f536502ffa34	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.66
43be73f8-2536-4173-bde8-db95691d4d3d	379218c6-67eb-4954-bfe0-f536502ffa34	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.661
967446a1-ce68-4d54-89fd-47cc19dafda2	379218c6-67eb-4954-bfe0-f536502ffa34	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.662
0fe5842e-67f6-4229-8a11-380024ed9540	379218c6-67eb-4954-bfe0-f536502ffa34	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.663
6b712487-4b23-48f4-bbc7-5fc6b4883b3d	379218c6-67eb-4954-bfe0-f536502ffa34	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.664
4ae604a2-ea28-464e-bdf8-d48e68b673a8	379218c6-67eb-4954-bfe0-f536502ffa34	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.665
0f53f4dd-32f2-4379-bbd6-2bded6396266	379218c6-67eb-4954-bfe0-f536502ffa34	a9cfc42d-8d98-4356-beec-9db6e05056c9	2026-09-15 22:47:06.666
aa93cb5e-fd57-4479-a106-d53fe015ce22	379218c6-67eb-4954-bfe0-f536502ffa34	df9abaa4-eda5-44fe-bb02-bd2b2efb9377	2026-09-15 22:47:06.667
7ae10b9d-8bc2-4a47-97e7-27f9c1b2e347	379218c6-67eb-4954-bfe0-f536502ffa34	af582657-1097-43a1-8f5e-6e8aec133a6f	2026-09-15 22:47:06.668
3ff4d64d-e5d6-4efb-9057-c68f819b0348	379218c6-67eb-4954-bfe0-f536502ffa34	2d7ecf70-bc34-41ec-b254-f97598c9214c	2026-09-15 22:47:06.669
0991645a-b25f-41bf-aebc-1327260231ad	379218c6-67eb-4954-bfe0-f536502ffa34	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.67
b5de5cdb-0abf-4cf6-a8ff-501fdfdba748	379218c6-67eb-4954-bfe0-f536502ffa34	dde5878d-6868-4a0b-975a-0b98eddda706	2026-09-15 22:47:06.671
b5e90a4b-dc23-4d83-8e38-76ff0448fb17	379218c6-67eb-4954-bfe0-f536502ffa34	5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	2026-09-15 22:47:06.672
b9d11e3a-5a01-4fa4-9660-88a4aa49c9b7	379218c6-67eb-4954-bfe0-f536502ffa34	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.673
06cc3334-7a8d-48b4-9872-3403737a90ff	379218c6-67eb-4954-bfe0-f536502ffa34	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.674
0991e1be-5fba-40b2-b515-ed56ec77daeb	379218c6-67eb-4954-bfe0-f536502ffa34	e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	2026-09-15 22:47:06.675
62d38b05-c043-492f-9880-4cac29c56a91	379218c6-67eb-4954-bfe0-f536502ffa34	cca4f78a-48d8-4e02-9aa6-309e70f4fc26	2026-09-15 22:47:06.676
ac123334-291e-49c0-be7e-d92e4d171312	379218c6-67eb-4954-bfe0-f536502ffa34	84d41aea-d458-456f-9fc0-b04ce93827cd	2026-09-15 22:47:06.677
e6a37422-50a3-4593-8a86-33a29501ffe3	379218c6-67eb-4954-bfe0-f536502ffa34	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.678
72d4ea7d-b456-4bb2-a9b7-2b0ac8a7ef29	379218c6-67eb-4954-bfe0-f536502ffa34	f9ee6b59-460e-405f-9397-16810308c645	2026-09-15 22:47:06.678
554f4484-ab92-4daf-b885-53d2d0a1dc8f	379218c6-67eb-4954-bfe0-f536502ffa34	acd5685a-1b55-4c13-9f51-0d1286e06614	2026-09-15 22:47:06.679
af83b1a5-2c77-4a75-a724-8657a3ccd121	379218c6-67eb-4954-bfe0-f536502ffa34	37d3bc7e-8143-4fea-a189-de58821558f7	2026-09-15 22:47:06.681
2f4f301c-6a79-42a5-9940-3cc81ef78a34	379218c6-67eb-4954-bfe0-f536502ffa34	c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	2026-09-15 22:47:06.682
5902ca66-cfe7-420b-b088-32fb74c42c57	379218c6-67eb-4954-bfe0-f536502ffa34	3bb4d633-927c-4c73-85a1-fb6ad820c087	2026-09-15 22:47:06.683
a17cdc39-6959-45eb-b6cd-aa51d79a5d29	379218c6-67eb-4954-bfe0-f536502ffa34	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.685
dd175d19-5f9a-4809-9633-4eaf66a03205	379218c6-67eb-4954-bfe0-f536502ffa34	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.686
059460fe-9791-46b8-ae6d-a929dcf33d83	379218c6-67eb-4954-bfe0-f536502ffa34	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.687
875bb607-bfd5-41e6-93a9-7b6ae4922c90	379218c6-67eb-4954-bfe0-f536502ffa34	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.688
d8a28835-f6a7-4355-ae2b-22db5bd5075f	379218c6-67eb-4954-bfe0-f536502ffa34	c0a83812-e631-4b37-ab22-aeeda212af55	2026-09-15 22:47:06.689
91566f15-a185-4ec2-9e30-682e112f83c4	379218c6-67eb-4954-bfe0-f536502ffa34	46de47d5-89cd-4907-8c2f-70c66c923353	2026-09-15 22:47:06.69
0888938e-bbd5-4985-8051-1377f4f3a90a	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.691
ab0cdc39-5178-48bd-aaba-e7e18b5026b0	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	677f294c-4bcb-4740-8432-0e40e868bf28	2026-09-15 22:47:06.692
c1addaae-a26a-40c1-9311-517e0c3dfd0a	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	f16e15bb-7f72-4657-ba77-d8fbb5c0a682	2026-09-15 22:47:06.692
988423a7-a497-4138-887e-b6246464578a	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	7b288c58-1c33-4fae-b2e8-e41315872b0e	2026-09-15 22:47:06.693
d9790ef5-d31a-4cef-b581-c01bee828a42	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	69a70c09-6860-41a1-afa3-bfd72dc39e8f	2026-09-15 22:47:06.694
1d8c353d-3eb8-4ee7-9a79-5fb1a490c89c	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	4ea263ea-5e95-4b92-9b11-0223ec585fc1	2026-09-15 22:47:06.695
930f6fbe-1a0e-4b33-9cc8-5e95f59aaf6e	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	3510fde0-d706-42f1-a493-f137ef667ef6	2026-09-15 22:47:06.696
f0529162-e35d-41c6-9d8c-4d1768bda650	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.699
42b1c3eb-8325-4f64-9808-9dce99277aaa	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	5b4c3f42-e057-44c1-8999-e96dbd11a921	2026-09-15 22:47:06.7
ae77be1c-1adc-44b1-b3ea-0c910dac0bbe	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.701
21bfd593-8ce3-4419-8e6d-1ad1d4c5ac37	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.702
60b394a7-483d-4de2-9dc7-a7b3c96b089c	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	3248b5d4-f775-4182-90ff-534966f15b63	2026-09-15 22:47:06.703
32d63e6a-8e57-4a51-b101-336194e19025	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	c1defb99-00e0-40d1-8349-d1c853aa4363	2026-09-15 22:47:06.704
067d2366-4b72-41df-b330-de6f34078402	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	2026-09-15 22:47:06.704
e2ee6383-390e-45a4-abef-0799e90e9f84	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	9b67c347-6057-45ff-b72a-3df20841e4b5	2026-09-15 22:47:06.706
85554c57-b3c3-4465-9ac2-fe69c3930ae1	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.706
9f4e62f1-c96a-42b4-9283-054e3ac181fb	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.707
2be9a236-beef-4aa8-8a72-a239f5c73343	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.709
a5fd7a54-1402-4618-b97b-c3a3a5e65737	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.711
cf332b12-21f8-4f3c-9b65-0f2258d3d8a8	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.712
85906f78-43b2-4160-98fb-ee842de38ef5	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.713
4af8a7bf-4db9-4b67-9b66-a493fdc94897	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.714
865a368c-1912-4bcc-92e8-090a15acdfd0	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	a9cfc42d-8d98-4356-beec-9db6e05056c9	2026-09-15 22:47:06.715
c0323d73-a3b0-4c86-9b57-6eb95ce99263	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	df9abaa4-eda5-44fe-bb02-bd2b2efb9377	2026-09-15 22:47:06.716
bfd1a241-2dcf-4b48-a826-44f035c1ef37	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	af582657-1097-43a1-8f5e-6e8aec133a6f	2026-09-15 22:47:06.717
1ab0d24a-e726-4c43-8dd6-4875fbe8dfa5	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	2d7ecf70-bc34-41ec-b254-f97598c9214c	2026-09-15 22:47:06.718
37a2a084-70dd-4faf-a138-eccf6f26eb7e	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.719
a9b067fa-bf0a-4166-b454-202f43b77471	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	dde5878d-6868-4a0b-975a-0b98eddda706	2026-09-15 22:47:06.72
78006560-d5f6-4760-a7d5-3918100d5eb7	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	2026-09-15 22:47:06.721
dcd55378-878b-4adb-82ec-ce4464b16fb2	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.721
4a51be51-2d8e-4b90-b175-9dec27f93790	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.722
60659ac2-5485-43c6-8401-8fecf7c749c1	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	2026-09-15 22:47:06.723
53c046fd-dffe-4c58-aec4-7fb54a5c0d05	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	cca4f78a-48d8-4e02-9aa6-309e70f4fc26	2026-09-15 22:47:06.724
c7a9e589-7ccc-48ca-a5d8-76a891f01241	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	84d41aea-d458-456f-9fc0-b04ce93827cd	2026-09-15 22:47:06.725
869847a3-c363-4b25-b221-164f08549357	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.726
ac068617-bdb8-4e97-b05b-483dda399abd	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	acd5685a-1b55-4c13-9f51-0d1286e06614	2026-09-15 22:47:06.728
55309ff8-10fb-4d3c-85ba-52b9fb474448	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	37d3bc7e-8143-4fea-a189-de58821558f7	2026-09-15 22:47:06.73
4a968b16-63f2-4989-914b-7df553786234	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	2026-09-15 22:47:06.731
d7057d83-5edf-448e-8ea5-6235afeb303f	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	3bb4d633-927c-4c73-85a1-fb6ad820c087	2026-09-15 22:47:06.732
da23cfc0-70a7-4a8f-949c-71605a897598	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.733
b37c6f72-8b10-4128-8f67-267caebf2429	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.734
536430ed-0862-4aac-8100-d35659a10d4f	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.735
8f285280-6432-4ba3-8687-ef0031cba58f	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.735
962195f5-4bb4-41c7-a5f2-58cee49076a3	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	c0a83812-e631-4b37-ab22-aeeda212af55	2026-09-15 22:47:06.736
3a82d067-5c85-4397-bbfb-605bbc61c096	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	46de47d5-89cd-4907-8c2f-70c66c923353	2026-09-15 22:47:06.738
f625b071-90db-4bbb-b24f-0464d8510e67	fd2e9277-19a5-496f-98de-7328c2abd06f	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.739
9b13d263-0f75-4ccb-b247-9d6991912e22	fd2e9277-19a5-496f-98de-7328c2abd06f	677f294c-4bcb-4740-8432-0e40e868bf28	2026-09-15 22:47:06.74
4247e9b9-062c-406f-a73b-f2bf8bdc4e9a	fd2e9277-19a5-496f-98de-7328c2abd06f	f16e15bb-7f72-4657-ba77-d8fbb5c0a682	2026-09-15 22:47:06.741
3209e34e-2e20-43c3-abfb-dea94becd68b	fd2e9277-19a5-496f-98de-7328c2abd06f	7b288c58-1c33-4fae-b2e8-e41315872b0e	2026-09-15 22:47:06.742
26e5a2f7-1e9e-4fed-800a-f88dd2047800	fd2e9277-19a5-496f-98de-7328c2abd06f	69a70c09-6860-41a1-afa3-bfd72dc39e8f	2026-09-15 22:47:06.742
f9f1bad5-c08c-4a5e-9470-06fc9398959a	fd2e9277-19a5-496f-98de-7328c2abd06f	abdaf4fa-6f15-445f-80a2-a9b29ed8df5e	2026-09-15 22:47:06.744
a6d9f573-5d97-40de-adb2-5b8e23cbc127	fd2e9277-19a5-496f-98de-7328c2abd06f	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.745
67f425b1-a493-48a8-964b-04f2a85ab572	fd2e9277-19a5-496f-98de-7328c2abd06f	5b4c3f42-e057-44c1-8999-e96dbd11a921	2026-09-15 22:47:06.746
aea0074e-ddc5-4968-9492-3a56a5857d7d	fd2e9277-19a5-496f-98de-7328c2abd06f	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.747
dad43728-0d4c-47d9-b5a1-50fea11e0893	fd2e9277-19a5-496f-98de-7328c2abd06f	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.748
8baf7d94-b2e9-48cc-a418-1e934302702a	fd2e9277-19a5-496f-98de-7328c2abd06f	3248b5d4-f775-4182-90ff-534966f15b63	2026-09-15 22:47:06.749
e4cd63a7-1008-4f36-b294-db9611fb8ce0	fd2e9277-19a5-496f-98de-7328c2abd06f	c1defb99-00e0-40d1-8349-d1c853aa4363	2026-09-15 22:47:06.75
db015f80-1db9-433a-9f66-83f51b218c12	fd2e9277-19a5-496f-98de-7328c2abd06f	6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	2026-09-15 22:47:06.751
5e288fd7-26b6-40ca-b48b-ba79ce671304	fd2e9277-19a5-496f-98de-7328c2abd06f	9b67c347-6057-45ff-b72a-3df20841e4b5	2026-09-15 22:47:06.752
5961b744-f76d-4904-9c77-a1522d5db79d	fd2e9277-19a5-496f-98de-7328c2abd06f	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.753
569f723c-cc8a-4e27-9f91-2ced2757d6d9	fd2e9277-19a5-496f-98de-7328c2abd06f	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.754
2d1466e3-984f-4fc8-9143-d8b5193f044c	fd2e9277-19a5-496f-98de-7328c2abd06f	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.755
48fc86d2-2f4c-4aa3-9ffd-281f7099fb33	fd2e9277-19a5-496f-98de-7328c2abd06f	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.756
c745a399-1da0-4897-b0c4-0b8c1183ed97	fd2e9277-19a5-496f-98de-7328c2abd06f	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.758
30e801f9-fa0c-4751-a233-4ed31ea94202	fd2e9277-19a5-496f-98de-7328c2abd06f	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.759
913ae297-91d6-45fb-841d-cf0daede90ae	fd2e9277-19a5-496f-98de-7328c2abd06f	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.761
928b2f39-7972-4352-a3c8-00a3cced8a93	fd2e9277-19a5-496f-98de-7328c2abd06f	a9cfc42d-8d98-4356-beec-9db6e05056c9	2026-09-15 22:47:06.762
b6bf1ff1-a785-4df7-9e60-e87b1211852d	fd2e9277-19a5-496f-98de-7328c2abd06f	df9abaa4-eda5-44fe-bb02-bd2b2efb9377	2026-09-15 22:47:06.763
8359c1ac-e764-48a9-bf6e-d7af89486f98	fd2e9277-19a5-496f-98de-7328c2abd06f	af582657-1097-43a1-8f5e-6e8aec133a6f	2026-09-15 22:47:06.765
eafda39f-0663-4b9c-b03c-7cc69b7c8190	fd2e9277-19a5-496f-98de-7328c2abd06f	2d7ecf70-bc34-41ec-b254-f97598c9214c	2026-09-15 22:47:06.766
4e8bb7fb-f501-469e-8618-6ab47138c8c5	fd2e9277-19a5-496f-98de-7328c2abd06f	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.767
c39f29cf-2a62-432b-b80b-01ae5cc8bb0c	fd2e9277-19a5-496f-98de-7328c2abd06f	dde5878d-6868-4a0b-975a-0b98eddda706	2026-09-15 22:47:06.768
8ab5170b-7d1f-4040-a7a3-4eb34fe335b1	fd2e9277-19a5-496f-98de-7328c2abd06f	5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	2026-09-15 22:47:06.769
0b989c8c-76c7-45fa-8eac-3e3e7f963a8b	fd2e9277-19a5-496f-98de-7328c2abd06f	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.77
1ab6f20b-d192-471c-ad47-00c8b2d0eef5	fd2e9277-19a5-496f-98de-7328c2abd06f	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.77
90e231d9-be63-48f1-9e90-74c33572e7c7	fd2e9277-19a5-496f-98de-7328c2abd06f	e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	2026-09-15 22:47:06.771
183b938a-deaf-4dee-9a5a-455492d1c452	fd2e9277-19a5-496f-98de-7328c2abd06f	cca4f78a-48d8-4e02-9aa6-309e70f4fc26	2026-09-15 22:47:06.772
ed73e639-a56c-49d0-9bda-86059b9643f6	fd2e9277-19a5-496f-98de-7328c2abd06f	84d41aea-d458-456f-9fc0-b04ce93827cd	2026-09-15 22:47:06.773
15f98b34-d7d0-41d9-ada4-c2ee5f407df8	fd2e9277-19a5-496f-98de-7328c2abd06f	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.775
41eb931f-2246-48a2-997d-868b759b89ec	fd2e9277-19a5-496f-98de-7328c2abd06f	f9ee6b59-460e-405f-9397-16810308c645	2026-09-15 22:47:06.776
f0519d68-75b1-4c47-8e51-6e9800badcfd	fd2e9277-19a5-496f-98de-7328c2abd06f	acd5685a-1b55-4c13-9f51-0d1286e06614	2026-09-15 22:47:06.778
b673628d-fdc7-4630-9612-931c9134c8ac	fd2e9277-19a5-496f-98de-7328c2abd06f	37d3bc7e-8143-4fea-a189-de58821558f7	2026-09-15 22:47:06.779
21eb6e70-439f-45fc-91a2-be21f4931106	fd2e9277-19a5-496f-98de-7328c2abd06f	c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	2026-09-15 22:47:06.78
1c1b4d97-36c3-402d-97da-5035a147dcc5	fd2e9277-19a5-496f-98de-7328c2abd06f	3bb4d633-927c-4c73-85a1-fb6ad820c087	2026-09-15 22:47:06.781
c4bf1706-d296-413b-b92f-ca3f54c4d8a8	fd2e9277-19a5-496f-98de-7328c2abd06f	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.782
7ba298a4-03c0-4311-b791-430ec7ab89b1	fd2e9277-19a5-496f-98de-7328c2abd06f	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.783
0036ac7c-7b4c-4d98-81b5-bec8b77ce298	fd2e9277-19a5-496f-98de-7328c2abd06f	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.784
45663a6d-1dbd-48ea-9115-939a6f1b83ca	fd2e9277-19a5-496f-98de-7328c2abd06f	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.785
57f17c15-9602-413f-9bbf-f4ef59040d5e	fd2e9277-19a5-496f-98de-7328c2abd06f	c0a83812-e631-4b37-ab22-aeeda212af55	2026-09-15 22:47:06.786
338fdd20-2185-4f84-b8d5-edb1e1c47f69	fd2e9277-19a5-496f-98de-7328c2abd06f	46de47d5-89cd-4907-8c2f-70c66c923353	2026-09-15 22:47:06.786
5b031de6-10f7-4219-8b55-c075bf6a8f97	4af7b92c-24ea-4a75-a629-94575e8f35c1	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.787
e8281c03-ca5d-4b91-82a1-88a1bd89b247	4af7b92c-24ea-4a75-a629-94575e8f35c1	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.788
35dabcfd-e80f-4b03-945c-87ed46110eda	4af7b92c-24ea-4a75-a629-94575e8f35c1	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.791
5ef3343b-9467-427b-b9a0-faee4075ea85	4af7b92c-24ea-4a75-a629-94575e8f35c1	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.793
c2cd179e-8c40-476f-808d-064a09f08562	4af7b92c-24ea-4a75-a629-94575e8f35c1	3248b5d4-f775-4182-90ff-534966f15b63	2026-09-15 22:47:06.794
2f39153d-e8a9-4779-a902-9d7cc1ee1dff	4af7b92c-24ea-4a75-a629-94575e8f35c1	c1defb99-00e0-40d1-8349-d1c853aa4363	2026-09-15 22:47:06.795
fe6e8d16-ace5-4638-9cc5-977d15804888	4af7b92c-24ea-4a75-a629-94575e8f35c1	6a1878a3-39ca-4d5c-93c7-bf87ed2a2982	2026-09-15 22:47:06.796
bc04baa1-72a6-4f5f-b832-46ae19ab3086	4af7b92c-24ea-4a75-a629-94575e8f35c1	9b67c347-6057-45ff-b72a-3df20841e4b5	2026-09-15 22:47:06.797
90e1c29c-bb07-401d-ab0a-9db1ed49e058	4af7b92c-24ea-4a75-a629-94575e8f35c1	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.798
2f280ddf-5d5f-49f7-b03d-6c8991aad775	4af7b92c-24ea-4a75-a629-94575e8f35c1	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.799
7f0cd8cc-8f6f-436f-88d1-d8d38a50866f	4af7b92c-24ea-4a75-a629-94575e8f35c1	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.8
69a1b59a-cc22-4cda-aebf-d34dfd63b17e	4af7b92c-24ea-4a75-a629-94575e8f35c1	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.8
30c4c636-bd14-47be-bdd7-3a01e0f2dc99	4af7b92c-24ea-4a75-a629-94575e8f35c1	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.801
23745609-5ec1-4d74-b368-4bdfec6b36b7	4af7b92c-24ea-4a75-a629-94575e8f35c1	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.802
f54bed95-ea48-499d-ab29-eaa69162ca97	4af7b92c-24ea-4a75-a629-94575e8f35c1	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.803
c152a672-6473-4ede-ae48-313718dd5b74	4af7b92c-24ea-4a75-a629-94575e8f35c1	a9cfc42d-8d98-4356-beec-9db6e05056c9	2026-09-15 22:47:06.804
ec77bbf5-fc3e-4226-bd6f-e45f49ac0776	4af7b92c-24ea-4a75-a629-94575e8f35c1	df9abaa4-eda5-44fe-bb02-bd2b2efb9377	2026-09-15 22:47:06.805
0012cffa-d018-42f3-8fdc-7d0b2cff734b	4af7b92c-24ea-4a75-a629-94575e8f35c1	af582657-1097-43a1-8f5e-6e8aec133a6f	2026-09-15 22:47:06.807
604c58a0-adc3-49f8-b106-0faa27620b98	4af7b92c-24ea-4a75-a629-94575e8f35c1	2d7ecf70-bc34-41ec-b254-f97598c9214c	2026-09-15 22:47:06.808
66c5935c-190b-48d4-a759-d57f5a34a025	4af7b92c-24ea-4a75-a629-94575e8f35c1	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.808
572b9a04-e2e2-48b2-aaf9-8dc4856eda55	4af7b92c-24ea-4a75-a629-94575e8f35c1	dde5878d-6868-4a0b-975a-0b98eddda706	2026-09-15 22:47:06.809
76c3eda6-4b7e-44da-9f51-cb5b58df0c81	4af7b92c-24ea-4a75-a629-94575e8f35c1	5447ff1f-5ec0-4a50-8fe9-da8d95e450bb	2026-09-15 22:47:06.81
2e6c2f79-583f-4300-bbc4-b785ba1cf03a	4af7b92c-24ea-4a75-a629-94575e8f35c1	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.811
bbddca37-de8d-401a-bfd5-e93b3ebfca63	4af7b92c-24ea-4a75-a629-94575e8f35c1	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.813
2afa8abe-7ebf-4d26-9cf2-b03cf578cb44	4af7b92c-24ea-4a75-a629-94575e8f35c1	e91bc2c8-a2b4-4ad2-abb2-ca6946feeff6	2026-09-15 22:47:06.813
22f7334d-74a4-409e-88c0-724ec133bfab	4af7b92c-24ea-4a75-a629-94575e8f35c1	cca4f78a-48d8-4e02-9aa6-309e70f4fc26	2026-09-15 22:47:06.814
ac3e51f2-e527-4bce-b2d2-db8ed7aa62d1	4af7b92c-24ea-4a75-a629-94575e8f35c1	84d41aea-d458-456f-9fc0-b04ce93827cd	2026-09-15 22:47:06.815
89241228-6774-4834-b34c-cedbbeeb42cf	4af7b92c-24ea-4a75-a629-94575e8f35c1	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.816
b0e4f6d5-6d89-4ac7-85e6-b4f5c0836e6f	4af7b92c-24ea-4a75-a629-94575e8f35c1	f9ee6b59-460e-405f-9397-16810308c645	2026-09-15 22:47:06.817
cf5de0da-2882-4c04-ae05-ff50a1a0de15	4af7b92c-24ea-4a75-a629-94575e8f35c1	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.818
a4c22009-3fc3-4b2a-8eff-43a60ebfff99	4af7b92c-24ea-4a75-a629-94575e8f35c1	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.819
0d7bc076-c3b2-4dbd-8ee7-b145ee88929c	4af7b92c-24ea-4a75-a629-94575e8f35c1	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.82
23c92cc3-6e97-433b-877d-baa429a1125c	4af7b92c-24ea-4a75-a629-94575e8f35c1	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.822
7fb99e22-df38-4904-8730-fb1a662c9573	8b9e5e16-cb18-4744-8942-f5094b2743de	48435ca2-b3ac-4093-9549-0484be2ef3d1	2026-09-15 22:47:06.823
c524ec10-56ae-439f-92e0-29e115ad253d	8b9e5e16-cb18-4744-8942-f5094b2743de	15fc7a01-9d2b-47ae-af3a-36814764c38b	2026-09-15 22:47:06.824
bf2264bf-1a0b-4ebd-a8f1-ca9f2cfc8b44	8b9e5e16-cb18-4744-8942-f5094b2743de	b4966f18-011a-4131-8916-4a4a5ebf6868	2026-09-15 22:47:06.825
e23f68b4-3b55-4740-91bd-754a6fd525d4	8b9e5e16-cb18-4744-8942-f5094b2743de	c87e9074-baec-4579-a272-7d1d12f41594	2026-09-15 22:47:06.826
9258872b-19d4-484f-8062-88a00c9ab2d3	8b9e5e16-cb18-4744-8942-f5094b2743de	dd757290-292f-4823-9529-8756e9e6e17b	2026-09-15 22:47:06.827
a8fade51-bf44-4a41-8811-9e1b99dd5bff	8b9e5e16-cb18-4744-8942-f5094b2743de	48dac0ac-0651-4f65-95d7-fd59ad7148b3	2026-09-15 22:47:06.828
aa45181f-a177-4f18-a37f-65749b176d1e	8b9e5e16-cb18-4744-8942-f5094b2743de	301d75c5-b82d-496a-b4f4-430ec0fbdb0b	2026-09-15 22:47:06.828
de4f8ab7-9b79-4045-bd50-0457260520cb	8b9e5e16-cb18-4744-8942-f5094b2743de	10f2319b-bb48-4909-b47d-241ef8e96372	2026-09-15 22:47:06.829
6cea3162-b7f3-4ff9-b009-cb3cb8bda72f	8b9e5e16-cb18-4744-8942-f5094b2743de	89bffa38-5df3-4006-bb13-bfd7c40fac5b	2026-09-15 22:47:06.83
d496f396-31b5-4055-8c7b-ca78077f60a7	8b9e5e16-cb18-4744-8942-f5094b2743de	fe2a205c-080d-4037-b9db-1abd0d511c90	2026-09-15 22:47:06.832
6a17857f-4b83-438e-9bc7-fd44f769b29c	8b9e5e16-cb18-4744-8942-f5094b2743de	32b806c9-c70c-4f10-98be-5ca32186d12c	2026-09-15 22:47:06.833
3256fe01-b07a-4ffc-8d5e-91951ab9bdd2	8b9e5e16-cb18-4744-8942-f5094b2743de	d2bc2062-455e-4dd8-8f3f-39927d4ed7bd	2026-09-15 22:47:06.834
884c4577-a649-48b1-8ba8-76d703df3682	8b9e5e16-cb18-4744-8942-f5094b2743de	765caa9e-e225-425d-8e25-c1366be6731f	2026-09-15 22:47:06.835
fbcbbb89-d2c3-4e2b-8a6b-4ca97b58755a	8b9e5e16-cb18-4744-8942-f5094b2743de	c69e5727-cabd-45d9-9d76-4759c1cb5a43	2026-09-15 22:47:06.836
04dcd62c-39df-41a5-9ef9-48b38f0cadce	8b9e5e16-cb18-4744-8942-f5094b2743de	94e68de2-92ef-48e9-bf2b-6c054148612a	2026-09-15 22:47:06.837
afccf193-7ca2-442a-b886-3d4fc84ee221	8b9e5e16-cb18-4744-8942-f5094b2743de	acd5685a-1b55-4c13-9f51-0d1286e06614	2026-09-15 22:47:06.838
f21106b5-1462-47f6-bcda-6ae982d2bd4c	8b9e5e16-cb18-4744-8942-f5094b2743de	37d3bc7e-8143-4fea-a189-de58821558f7	2026-09-15 22:47:06.838
06fec94d-88c1-4664-a17c-5426a77dd901	8b9e5e16-cb18-4744-8942-f5094b2743de	c6bfc7c2-d920-4539-91c9-3d601e1bc0ad	2026-09-15 22:47:06.839
7cd462b6-7b58-4a67-85c5-c3eba7c2ee8f	8b9e5e16-cb18-4744-8942-f5094b2743de	3bb4d633-927c-4c73-85a1-fb6ad820c087	2026-09-15 22:47:06.84
01f9185e-0218-4820-bc52-8d19869c2541	8b9e5e16-cb18-4744-8942-f5094b2743de	f6febf90-32da-41d5-ae8c-17a6ef2b2b63	2026-09-15 22:47:06.841
4430e1ec-ce42-43c8-a9bf-ddcdbd9fb8fc	8b9e5e16-cb18-4744-8942-f5094b2743de	15f629fc-797b-47dd-bbf0-268b3a642308	2026-09-15 22:47:06.842
ce48fa2a-592f-43c6-a100-37cdb5885867	8b9e5e16-cb18-4744-8942-f5094b2743de	f73a0f55-73d1-4c4a-ba69-e9d24c208473	2026-09-15 22:47:06.842
e4fa6330-aac7-4fd8-b37f-d9a5b0b64724	8b9e5e16-cb18-4744-8942-f5094b2743de	bac161ad-826d-4473-85ae-ab69cb70e3a7	2026-09-15 22:47:06.843
26088765-aaa0-4142-a3ad-3175d458e589	8b9e5e16-cb18-4744-8942-f5094b2743de	c0a83812-e631-4b37-ab22-aeeda212af55	2026-09-15 22:47:06.845
7abe53ac-c9b5-4e15-8ea1-4ed818177082	8b9e5e16-cb18-4744-8942-f5094b2743de	46de47d5-89cd-4907-8c2f-70c66c923353	2026-09-15 22:47:06.846
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Usuario" (id, email, nombre, account, initials, avatar_url, estado, dependencia_id, cargo_id, created_at, updated_at, deleted_at) FROM stdin;
e0f5412c-104f-421f-b847-342b457357bf	administrador@dasi.local	Administrador	administrador	AD	\N	Activo	69db5ff8-c8e3-4b92-8106-867c173582d2	907f2fe8-ee15-409d-965c-c0319e43ccf0	2026-09-15 22:47:06.442	2026-09-15 22:47:06.442	\N
592a045a-e8c4-4f9c-bc9a-dc4af8e2e40d	gerencia@dasi.local	Gerencia	gerencia	GE	\N	Activo	69db5ff8-c8e3-4b92-8106-867c173582d2	907f2fe8-ee15-409d-965c-c0319e43ccf0	2026-09-15 22:47:06.445	2026-09-15 22:47:06.445	\N
bb63efb3-cebb-43e6-898c-68851915f367	jga@dasi.local	Junta General Administrativa	jga	JG	\N	Activo	0cde5221-d3f1-4404-9e3b-ca76c9b1768c	a4bd696b-cc1f-48bc-816e-fcea55edb656	2026-09-15 22:47:06.447	2026-09-15 22:47:06.447	\N
d6f2410a-b59f-4544-b73d-376af4ca554d	juan@dasi.local	Juan	juan	JU	\N	Activo	30cb74fa-f360-46b5-8180-ca67d30e5e7c	39c65efe-45f3-4b4e-91f7-2ed12299d379	2026-09-15 22:47:06.449	2026-09-15 22:47:06.449	\N
1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	christ@dasi.local	Christ	cristh	CH	\N	Activo	68efb134-6a1b-45d2-9490-f25629f91896	d9a9c595-520d-48d6-af31-56ddd6e35a50	2026-09-15 22:47:06.451	2026-09-15 22:47:06.451	\N
e0304016-adf6-471f-badc-0ea2965ea4f2	jhonatan@dasi.local	JHONATAN	jhonatan	JH	\N	Activo	68efb134-6a1b-45d2-9490-f25629f91896	90ba360c-6608-422a-ae8d-eb7c6ad0942d	2026-09-15 22:47:06.453	2026-09-15 22:47:06.453	\N
\.


--
-- Data for Name: UsuarioCargo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UsuarioCargo" (id, usuario_id, cargo_id, created_at) FROM stdin;
\.


--
-- Data for Name: UsuarioDependencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UsuarioDependencia" (id, usuario_id, dependencia_id, es_principal, created_at) FROM stdin;
e7234649-1220-42a5-9506-f77e67d77e4b	e0f5412c-104f-421f-b847-342b457357bf	69db5ff8-c8e3-4b92-8106-867c173582d2	t	2026-09-15 22:47:06.472
a29ad37e-b392-4dad-9ffe-52ddbcd43d09	592a045a-e8c4-4f9c-bc9a-dc4af8e2e40d	69db5ff8-c8e3-4b92-8106-867c173582d2	t	2026-09-15 22:47:06.475
31dd4d41-690e-448c-8dd5-031da6bb5978	bb63efb3-cebb-43e6-898c-68851915f367	0cde5221-d3f1-4404-9e3b-ca76c9b1768c	t	2026-09-15 22:47:06.476
4bee3e1d-e6b4-4d92-a497-f5e30a4b497a	d6f2410a-b59f-4544-b73d-376af4ca554d	30cb74fa-f360-46b5-8180-ca67d30e5e7c	t	2026-09-15 22:47:06.478
256dcbd4-3c42-45b5-87a1-a1657b7adf3a	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	68efb134-6a1b-45d2-9490-f25629f91896	t	2026-09-15 22:47:06.48
bd15292e-bbd5-45e1-86fe-40336739fc2c	e0304016-adf6-471f-badc-0ea2965ea4f2	68efb134-6a1b-45d2-9490-f25629f91896	t	2026-09-15 22:47:06.481
\.


--
-- Data for Name: UsuarioRol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UsuarioRol" (id, usuario_id, rol_id, created_at) FROM stdin;
ffec50cb-eae9-4a11-b90b-a077a02acace	e0f5412c-104f-421f-b847-342b457357bf	40ba94fc-6508-4518-8d09-bd801175cca2	2026-09-15 22:47:06.46
1ef53588-01cf-4598-b743-178100938b2d	592a045a-e8c4-4f9c-bc9a-dc4af8e2e40d	7b253400-4952-4b31-9194-4170d1b33c8e	2026-09-15 22:47:06.462
c77cf53d-afaa-4004-abb0-659d181e6b47	bb63efb3-cebb-43e6-898c-68851915f367	379218c6-67eb-4954-bfe0-f536502ffa34	2026-09-15 22:47:06.464
429a5e36-42c5-4c8c-9277-3aa9ec767751	d6f2410a-b59f-4544-b73d-376af4ca554d	40b1ec90-503b-4c27-8fdd-8f3fb91ad28d	2026-09-15 22:47:06.466
a36b7685-5e11-432c-adcc-d3580224d43f	1359bef7-5e8e-4a2d-9d8b-2b18f9bb685f	fd2e9277-19a5-496f-98de-7328c2abd06f	2026-09-15 22:47:06.468
10231c4c-2059-4695-9274-858d51905ea4	e0304016-adf6-471f-badc-0ea2965ea4f2	4af7b92c-24ea-4a75-a629-94575e8f35c1	2026-09-15 22:47:06.469
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fbfb5584-b248-47d1-9535-a138f4c6cae1	eb84a77edf2d2d8eb5255b60a0ac70acf122f822f5c8dde8e2d199bcd0ced22b	2026-09-10 10:21:33.865545-05	20260910152133_init	\N	\N	2026-09-10 10:21:33.677698-05	1
\.


--
-- Name: Actividad Actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actividad"
    ADD CONSTRAINT "Actividad_pkey" PRIMARY KEY (id);


--
-- Name: Archivo Archivo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Archivo"
    ADD CONSTRAINT "Archivo_pkey" PRIMARY KEY (id);


--
-- Name: Auditoria Auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Auditoria"
    ADD CONSTRAINT "Auditoria_pkey" PRIMARY KEY (id);


--
-- Name: Cargo Cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cargo"
    ADD CONSTRAINT "Cargo_pkey" PRIMARY KEY (id);


--
-- Name: Configuracion Configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Configuracion"
    ADD CONSTRAINT "Configuracion_pkey" PRIMARY KEY (id);


--
-- Name: Dependencia Dependencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dependencia"
    ADD CONSTRAINT "Dependencia_pkey" PRIMARY KEY (id);


--
-- Name: EventoCalendario EventoCalendario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EventoCalendario"
    ADD CONSTRAINT "EventoCalendario_pkey" PRIMARY KEY (id);


--
-- Name: Evidencia Evidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_pkey" PRIMARY KEY (id);


--
-- Name: HistorialProyecto HistorialProyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistorialProyecto"
    ADD CONSTRAINT "HistorialProyecto_pkey" PRIMARY KEY (id);


--
-- Name: Modulo Modulo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Modulo"
    ADD CONSTRAINT "Modulo_pkey" PRIMARY KEY (id);


--
-- Name: Notificacion Notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_pkey" PRIMARY KEY (id);


--
-- Name: Observacion Observacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Observacion"
    ADD CONSTRAINT "Observacion_pkey" PRIMARY KEY (id);


--
-- Name: Permiso Permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permiso"
    ADD CONSTRAINT "Permiso_pkey" PRIMARY KEY (id);


--
-- Name: ProyectoDependencia ProyectoDependencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoDependencia"
    ADD CONSTRAINT "ProyectoDependencia_pkey" PRIMARY KEY (id);


--
-- Name: ProyectoEquipo ProyectoEquipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoEquipo"
    ADD CONSTRAINT "ProyectoEquipo_pkey" PRIMARY KEY (id);


--
-- Name: ProyectoResponsabilidad ProyectoResponsabilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoResponsabilidad"
    ADD CONSTRAINT "ProyectoResponsabilidad_pkey" PRIMARY KEY (id);


--
-- Name: ProyectoWorkflow ProyectoWorkflow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoWorkflow"
    ADD CONSTRAINT "ProyectoWorkflow_pkey" PRIMARY KEY (id);


--
-- Name: Proyecto Proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proyecto"
    ADD CONSTRAINT "Proyecto_pkey" PRIMARY KEY (id);


--
-- Name: RolPermiso RolPermiso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolPermiso"
    ADD CONSTRAINT "RolPermiso_pkey" PRIMARY KEY (id);


--
-- Name: Rol Rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rol"
    ADD CONSTRAINT "Rol_pkey" PRIMARY KEY (id);


--
-- Name: UsuarioCargo UsuarioCargo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioCargo"
    ADD CONSTRAINT "UsuarioCargo_pkey" PRIMARY KEY (id);


--
-- Name: UsuarioDependencia UsuarioDependencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioDependencia"
    ADD CONSTRAINT "UsuarioDependencia_pkey" PRIMARY KEY (id);


--
-- Name: UsuarioRol UsuarioRol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioRol"
    ADD CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Actividad_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Actividad_created_at_idx" ON public."Actividad" USING btree (created_at);


--
-- Name: Actividad_created_by_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Actividad_created_by_id_idx" ON public."Actividad" USING btree (created_by_id);


--
-- Name: Actividad_prioridad_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Actividad_prioridad_idx" ON public."Actividad" USING btree (prioridad);


--
-- Name: Actividad_proyecto_id_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Actividad_proyecto_id_estado_idx" ON public."Actividad" USING btree (proyecto_id, estado);


--
-- Name: Actividad_responsable_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Actividad_responsable_id_idx" ON public."Actividad" USING btree (responsable_id);


--
-- Name: Archivo_bucket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Archivo_bucket_idx" ON public."Archivo" USING btree (bucket);


--
-- Name: Archivo_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Archivo_created_at_idx" ON public."Archivo" USING btree (created_at);


--
-- Name: Archivo_nombre_storage_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Archivo_nombre_storage_key" ON public."Archivo" USING btree (nombre_storage);


--
-- Name: Archivo_storage_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Archivo_storage_key_idx" ON public."Archivo" USING btree (storage_key);


--
-- Name: Archivo_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Archivo_usuario_id_idx" ON public."Archivo" USING btree (usuario_id);


--
-- Name: Auditoria_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Auditoria_created_at_idx" ON public."Auditoria" USING btree (created_at);


--
-- Name: Auditoria_entidad_entidad_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Auditoria_entidad_entidad_id_idx" ON public."Auditoria" USING btree (entidad, entidad_id);


--
-- Name: Auditoria_modulo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Auditoria_modulo_idx" ON public."Auditoria" USING btree (modulo);


--
-- Name: Auditoria_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Auditoria_usuario_id_idx" ON public."Auditoria" USING btree (usuario_id);


--
-- Name: Cargo_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Cargo_nombre_key" ON public."Cargo" USING btree (nombre);


--
-- Name: Configuracion_clave_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Configuracion_clave_key" ON public."Configuracion" USING btree (clave);


--
-- Name: Dependencia_activa_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Dependencia_activa_idx" ON public."Dependencia" USING btree (activa);


--
-- Name: Dependencia_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Dependencia_code_key" ON public."Dependencia" USING btree (code);


--
-- Name: Dependencia_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Dependencia_parent_id_idx" ON public."Dependencia" USING btree (parent_id);


--
-- Name: Dependencia_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Dependencia_tipo_idx" ON public."Dependencia" USING btree (tipo);


--
-- Name: EventoCalendario_actividad_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EventoCalendario_actividad_id_idx" ON public."EventoCalendario" USING btree (actividad_id);


--
-- Name: EventoCalendario_fecha_fin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EventoCalendario_fecha_fin_idx" ON public."EventoCalendario" USING btree (fecha_fin);


--
-- Name: EventoCalendario_fecha_inicio_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EventoCalendario_fecha_inicio_idx" ON public."EventoCalendario" USING btree (fecha_inicio);


--
-- Name: EventoCalendario_proyecto_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EventoCalendario_proyecto_id_idx" ON public."EventoCalendario" USING btree (proyecto_id);


--
-- Name: EventoCalendario_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EventoCalendario_tipo_idx" ON public."EventoCalendario" USING btree (tipo);


--
-- Name: EventoCalendario_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EventoCalendario_usuario_id_idx" ON public."EventoCalendario" USING btree (usuario_id);


--
-- Name: Evidencia_actividad_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_actividad_id_idx" ON public."Evidencia" USING btree (actividad_id);


--
-- Name: Evidencia_archivo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_archivo_id_idx" ON public."Evidencia" USING btree (archivo_id);


--
-- Name: Evidencia_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_created_at_idx" ON public."Evidencia" USING btree (created_at);


--
-- Name: Evidencia_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_estado_idx" ON public."Evidencia" USING btree (estado);


--
-- Name: Evidencia_proyecto_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_proyecto_id_idx" ON public."Evidencia" USING btree (proyecto_id);


--
-- Name: Evidencia_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Evidencia_usuario_id_idx" ON public."Evidencia" USING btree (usuario_id);


--
-- Name: HistorialProyecto_estado_nuevo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HistorialProyecto_estado_nuevo_idx" ON public."HistorialProyecto" USING btree (estado_nuevo);


--
-- Name: HistorialProyecto_proyecto_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HistorialProyecto_proyecto_id_created_at_idx" ON public."HistorialProyecto" USING btree (proyecto_id, created_at);


--
-- Name: HistorialProyecto_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HistorialProyecto_usuario_id_idx" ON public."HistorialProyecto" USING btree (usuario_id);


--
-- Name: Modulo_activo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Modulo_activo_idx" ON public."Modulo" USING btree (activo);


--
-- Name: Modulo_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Modulo_slug_key" ON public."Modulo" USING btree (slug);


--
-- Name: Notificacion_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacion_created_at_idx" ON public."Notificacion" USING btree (created_at);


--
-- Name: Notificacion_leida_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacion_leida_idx" ON public."Notificacion" USING btree (leida);


--
-- Name: Notificacion_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacion_tipo_idx" ON public."Notificacion" USING btree (tipo);


--
-- Name: Notificacion_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacion_usuario_id_idx" ON public."Notificacion" USING btree (usuario_id);


--
-- Name: Notificacion_usuario_id_leida_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacion_usuario_id_leida_idx" ON public."Notificacion" USING btree (usuario_id, leida);


--
-- Name: Observacion_actividad_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_actividad_id_idx" ON public."Observacion" USING btree (actividad_id);


--
-- Name: Observacion_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_created_at_idx" ON public."Observacion" USING btree (created_at);


--
-- Name: Observacion_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_estado_idx" ON public."Observacion" USING btree (estado);


--
-- Name: Observacion_evidencia_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_evidencia_id_idx" ON public."Observacion" USING btree (evidencia_id);


--
-- Name: Observacion_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_parent_id_idx" ON public."Observacion" USING btree (parent_id);


--
-- Name: Observacion_proyecto_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_proyecto_id_idx" ON public."Observacion" USING btree (proyecto_id);


--
-- Name: Observacion_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Observacion_usuario_id_idx" ON public."Observacion" USING btree (usuario_id);


--
-- Name: Permiso_modulo_id_accion_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Permiso_modulo_id_accion_key" ON public."Permiso" USING btree (modulo_id, accion);


--
-- Name: Permiso_modulo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Permiso_modulo_id_idx" ON public."Permiso" USING btree (modulo_id);


--
-- Name: ProyectoDependencia_dependencia_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoDependencia_dependencia_id_idx" ON public."ProyectoDependencia" USING btree (dependencia_id);


--
-- Name: ProyectoDependencia_proyecto_id_dependencia_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProyectoDependencia_proyecto_id_dependencia_id_key" ON public."ProyectoDependencia" USING btree (proyecto_id, dependencia_id);


--
-- Name: ProyectoEquipo_proyecto_id_usuario_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProyectoEquipo_proyecto_id_usuario_id_key" ON public."ProyectoEquipo" USING btree (proyecto_id, usuario_id);


--
-- Name: ProyectoEquipo_usuario_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoEquipo_usuario_id_idx" ON public."ProyectoEquipo" USING btree (usuario_id);


--
-- Name: ProyectoResponsabilidad_dependencia_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoResponsabilidad_dependencia_id_idx" ON public."ProyectoResponsabilidad" USING btree (dependencia_id);


--
-- Name: ProyectoResponsabilidad_proyecto_id_etapa_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProyectoResponsabilidad_proyecto_id_etapa_key" ON public."ProyectoResponsabilidad" USING btree (proyecto_id, etapa);


--
-- Name: ProyectoResponsabilidad_proyecto_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoResponsabilidad_proyecto_id_idx" ON public."ProyectoResponsabilidad" USING btree (proyecto_id);


--
-- Name: ProyectoResponsabilidad_responsable_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoResponsabilidad_responsable_id_idx" ON public."ProyectoResponsabilidad" USING btree (responsable_id);


--
-- Name: ProyectoWorkflow_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoWorkflow_estado_idx" ON public."ProyectoWorkflow" USING btree (estado);


--
-- Name: ProyectoWorkflow_etapa_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoWorkflow_etapa_idx" ON public."ProyectoWorkflow" USING btree (etapa);


--
-- Name: ProyectoWorkflow_orden_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoWorkflow_orden_idx" ON public."ProyectoWorkflow" USING btree (orden);


--
-- Name: ProyectoWorkflow_proyecto_id_etapa_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProyectoWorkflow_proyecto_id_etapa_key" ON public."ProyectoWorkflow" USING btree (proyecto_id, etapa);


--
-- Name: ProyectoWorkflow_proyecto_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProyectoWorkflow_proyecto_id_idx" ON public."ProyectoWorkflow" USING btree (proyecto_id);


--
-- Name: Proyecto_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Proyecto_code_key" ON public."Proyecto" USING btree (code);


--
-- Name: Proyecto_coordinador_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_coordinador_id_idx" ON public."Proyecto" USING btree (coordinador_id);


--
-- Name: Proyecto_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_created_at_idx" ON public."Proyecto" USING btree (created_at);


--
-- Name: Proyecto_created_by_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_created_by_id_idx" ON public."Proyecto" USING btree (created_by_id);


--
-- Name: Proyecto_dependencia_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_dependencia_id_idx" ON public."Proyecto" USING btree (dependencia_id);


--
-- Name: Proyecto_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_estado_idx" ON public."Proyecto" USING btree (estado);


--
-- Name: Proyecto_owner_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_owner_id_idx" ON public."Proyecto" USING btree (owner_id);


--
-- Name: Proyecto_prioridad_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Proyecto_prioridad_idx" ON public."Proyecto" USING btree (prioridad);


--
-- Name: RolPermiso_permiso_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RolPermiso_permiso_id_idx" ON public."RolPermiso" USING btree (permiso_id);


--
-- Name: RolPermiso_rol_id_permiso_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RolPermiso_rol_id_permiso_id_key" ON public."RolPermiso" USING btree (rol_id, permiso_id);


--
-- Name: Rol_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Rol_nombre_key" ON public."Rol" USING btree (nombre);


--
-- Name: UsuarioCargo_cargo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsuarioCargo_cargo_id_idx" ON public."UsuarioCargo" USING btree (cargo_id);


--
-- Name: UsuarioCargo_usuario_id_cargo_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UsuarioCargo_usuario_id_cargo_id_key" ON public."UsuarioCargo" USING btree (usuario_id, cargo_id);


--
-- Name: UsuarioDependencia_dependencia_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsuarioDependencia_dependencia_id_idx" ON public."UsuarioDependencia" USING btree (dependencia_id);


--
-- Name: UsuarioDependencia_usuario_id_dependencia_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UsuarioDependencia_usuario_id_dependencia_id_key" ON public."UsuarioDependencia" USING btree (usuario_id, dependencia_id);


--
-- Name: UsuarioRol_rol_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsuarioRol_rol_id_idx" ON public."UsuarioRol" USING btree (rol_id);


--
-- Name: UsuarioRol_usuario_id_rol_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UsuarioRol_usuario_id_rol_id_key" ON public."UsuarioRol" USING btree (usuario_id, rol_id);


--
-- Name: Usuario_account_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Usuario_account_key" ON public."Usuario" USING btree (account);


--
-- Name: Usuario_cargo_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Usuario_cargo_id_idx" ON public."Usuario" USING btree (cargo_id);


--
-- Name: Usuario_dependencia_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Usuario_dependencia_id_idx" ON public."Usuario" USING btree (dependencia_id);


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: Usuario_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Usuario_estado_idx" ON public."Usuario" USING btree (estado);


--
-- Name: Actividad Actividad_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actividad"
    ADD CONSTRAINT "Actividad_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Actividad Actividad_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actividad"
    ADD CONSTRAINT "Actividad_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: Actividad Actividad_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Actividad"
    ADD CONSTRAINT "Actividad_responsable_id_fkey" FOREIGN KEY (responsable_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Archivo Archivo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Archivo"
    ADD CONSTRAINT "Archivo_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Auditoria Auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Auditoria"
    ADD CONSTRAINT "Auditoria_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Dependencia Dependencia_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dependencia"
    ADD CONSTRAINT "Dependencia_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: EventoCalendario EventoCalendario_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EventoCalendario"
    ADD CONSTRAINT "EventoCalendario_actividad_id_fkey" FOREIGN KEY (actividad_id) REFERENCES public."Actividad"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: EventoCalendario EventoCalendario_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EventoCalendario"
    ADD CONSTRAINT "EventoCalendario_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: EventoCalendario EventoCalendario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EventoCalendario"
    ADD CONSTRAINT "EventoCalendario_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Evidencia Evidencia_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_actividad_id_fkey" FOREIGN KEY (actividad_id) REFERENCES public."Actividad"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Evidencia Evidencia_archivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_archivo_id_fkey" FOREIGN KEY (archivo_id) REFERENCES public."Archivo"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Evidencia Evidencia_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: Evidencia Evidencia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Evidencia"
    ADD CONSTRAINT "Evidencia_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: HistorialProyecto HistorialProyecto_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistorialProyecto"
    ADD CONSTRAINT "HistorialProyecto_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HistorialProyecto HistorialProyecto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistorialProyecto"
    ADD CONSTRAINT "HistorialProyecto_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Notificacion Notificacion_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_actividad_id_fkey" FOREIGN KEY (actividad_id) REFERENCES public."Actividad"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Notificacion Notificacion_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Notificacion Notificacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacion"
    ADD CONSTRAINT "Notificacion_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Observacion Observacion_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Observacion"
    ADD CONSTRAINT "Observacion_actividad_id_fkey" FOREIGN KEY (actividad_id) REFERENCES public."Actividad"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Observacion Observacion_evidencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Observacion"
    ADD CONSTRAINT "Observacion_evidencia_id_fkey" FOREIGN KEY (evidencia_id) REFERENCES public."Evidencia"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Observacion Observacion_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Observacion"
    ADD CONSTRAINT "Observacion_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Observacion"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Observacion Observacion_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Observacion"
    ADD CONSTRAINT "Observacion_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: Observacion Observacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Observacion"
    ADD CONSTRAINT "Observacion_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Permiso Permiso_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permiso"
    ADD CONSTRAINT "Permiso_modulo_id_fkey" FOREIGN KEY (modulo_id) REFERENCES public."Modulo"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: ProyectoDependencia ProyectoDependencia_dependencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoDependencia"
    ADD CONSTRAINT "ProyectoDependencia_dependencia_id_fkey" FOREIGN KEY (dependencia_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: ProyectoDependencia ProyectoDependencia_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoDependencia"
    ADD CONSTRAINT "ProyectoDependencia_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProyectoEquipo ProyectoEquipo_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoEquipo"
    ADD CONSTRAINT "ProyectoEquipo_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProyectoEquipo ProyectoEquipo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoEquipo"
    ADD CONSTRAINT "ProyectoEquipo_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProyectoResponsabilidad ProyectoResponsabilidad_dependencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoResponsabilidad"
    ADD CONSTRAINT "ProyectoResponsabilidad_dependencia_id_fkey" FOREIGN KEY (dependencia_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: ProyectoResponsabilidad ProyectoResponsabilidad_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoResponsabilidad"
    ADD CONSTRAINT "ProyectoResponsabilidad_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProyectoResponsabilidad ProyectoResponsabilidad_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoResponsabilidad"
    ADD CONSTRAINT "ProyectoResponsabilidad_responsable_id_fkey" FOREIGN KEY (responsable_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: ProyectoWorkflow ProyectoWorkflow_dependencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoWorkflow"
    ADD CONSTRAINT "ProyectoWorkflow_dependencia_id_fkey" FOREIGN KEY (dependencia_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: ProyectoWorkflow ProyectoWorkflow_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoWorkflow"
    ADD CONSTRAINT "ProyectoWorkflow_proyecto_id_fkey" FOREIGN KEY (proyecto_id) REFERENCES public."Proyecto"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProyectoWorkflow ProyectoWorkflow_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProyectoWorkflow"
    ADD CONSTRAINT "ProyectoWorkflow_responsable_id_fkey" FOREIGN KEY (responsable_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Proyecto Proyecto_coordinador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proyecto"
    ADD CONSTRAINT "Proyecto_coordinador_id_fkey" FOREIGN KEY (coordinador_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Proyecto Proyecto_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proyecto"
    ADD CONSTRAINT "Proyecto_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Proyecto Proyecto_dependencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proyecto"
    ADD CONSTRAINT "Proyecto_dependencia_id_fkey" FOREIGN KEY (dependencia_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Proyecto Proyecto_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Proyecto"
    ADD CONSTRAINT "Proyecto_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public."Usuario"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: RolPermiso RolPermiso_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolPermiso"
    ADD CONSTRAINT "RolPermiso_permiso_id_fkey" FOREIGN KEY (permiso_id) REFERENCES public."Permiso"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: RolPermiso RolPermiso_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolPermiso"
    ADD CONSTRAINT "RolPermiso_rol_id_fkey" FOREIGN KEY (rol_id) REFERENCES public."Rol"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: UsuarioCargo UsuarioCargo_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioCargo"
    ADD CONSTRAINT "UsuarioCargo_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES public."Cargo"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: UsuarioCargo UsuarioCargo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioCargo"
    ADD CONSTRAINT "UsuarioCargo_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UsuarioDependencia UsuarioDependencia_dependencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioDependencia"
    ADD CONSTRAINT "UsuarioDependencia_dependencia_id_fkey" FOREIGN KEY (dependencia_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: UsuarioDependencia UsuarioDependencia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioDependencia"
    ADD CONSTRAINT "UsuarioDependencia_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UsuarioRol UsuarioRol_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioRol"
    ADD CONSTRAINT "UsuarioRol_rol_id_fkey" FOREIGN KEY (rol_id) REFERENCES public."Rol"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: UsuarioRol UsuarioRol_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsuarioRol"
    ADD CONSTRAINT "UsuarioRol_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Usuario Usuario_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES public."Cargo"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- Name: Usuario Usuario_dependencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_dependencia_id_fkey" FOREIGN KEY (dependencia_id) REFERENCES public."Dependencia"(id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict fVkGhoKlkYctf4fU1hZpxPlXO2oVvoICLNyqBefRt2hei1mIePXrweGqwJJaN56

