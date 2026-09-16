# DASI — Seed de datos reales institucionales

El seed `prisma/seed.mjs` carga datos institucionales reales en la base
`dasi` (PostgreSQL) mediante Prisma, replicando la estructura de la
institución para la fase de diseño: dependencias, cargos, roles,
módulos, permisos, usuarios y un proyecto de demostración con flujo
completo.

**Reemplaza** al antiguo seed de datos TEST (`TEST_DASI_`). Al inicio,
el script elimina cualquier resto de datos `TEST_DASI_`/`test_dasi`
que quede en la base.

## Ejecutar el seed

Desde la carpeta `api/`:

```bash
node prisma/seed.mjs
```

El script es **idempotente**: si un registro ya existe se reutiliza y no
duplica nada.

## Qué se crea

| Entidad             | Cantidad | Descripción                                   |
| ------------------- | -------- | --------------------------------------------- |
| Dependencias        | 5        | Gerencia, JGA, Administración General, Dpto. TI, Escuela Técnica |
| Cargos              | 5        | asociados a las dependencias                  |
| Roles               | 7        | ADMINISTRADOR, GERENCIA, JGA, ADMINISTRACION_GENERAL, DEPARTAMENTO_TI, COLABORADOR, CONSULTA |
| Módulos             | 23       | catálogo real de módulos                      |
| Permisos            | 71       | acciones por módulo                          |
| Usuarios            | 6        | cuentas reales (ver abajo)                    |
| Proyectos           | 2        | PRY-2026-0001 (flujo completo) y PRY-2026-0002 (pendiente) |
| Actividades         | 8        | plan de trabajo base + asignaciones por stakeholder |
| Evidencias          | 2        | solo texto (sin archivos, R2 pendiente)       |
| Observaciones       | 4        | incluye un hilo padre/hijo                    |
| Notificaciones      | 5        | notificaciones del flujo                      |
| Eventos calendario  | 6        | eventos de reuniones e hitos                  |
| Auditoría           | 3        | registro de acciones del seed                  |
| Fases (workflow)    | 4        | activadas en PRY-2026-0001                    |

## Cuentas de acceso

- `administrador` — rol ADMINISTRADOR, acceso global
- `gerencia` — rol GERENCIA
- `jga` — rol JGA (Junta General Administrativa)
- `juan` — Administración General (aprueba y activa workflow)
- `cristh` — Departamento de TI (crea, deriva y asigna)
- `jhonatan` — colaborador TI (ejecuta lo asignado)

Jerarquía: Gerencia → (JGA, Administración General → Departamento de TI).
Flujo: Cristh crea PRY-2026-0001 → lo deriva → Juan aprueba y DASI activa
workflow + actividades base → Cristh asigna a JHONATAN → JHONATAN ejecuta.
PRY-2026-0002 queda pendiente y derivado.

## Eliminar datos TEST viejos

Desde la carpeta `api/` (solo si aún existieran):

```bash
node prisma/clean-test.mjs
```

Elimina **solo** registros con prefijo `TEST_DASI_`/`test_dasi`,
respetando el orden de dependencias y verificando que no queden restos.

## Reglas

- No se usa SQL manual: los scripts interactúan con la base mediante
  Prisma exclusivamente.
- No se modifica `prisma/schema.prisma` ni se crean migraciones.
- No se suben archivos: la tabla `Archivo` está preparada para
  Cloudflare R2 y no recibe datos falsos.