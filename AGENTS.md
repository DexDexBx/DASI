# Repository Guidelines

## Proyecto

DASI significa **Digitalización, Administración y Seguimiento Institucional**.

Este repositorio contiene el frontend de DASI V.01, construido sobre TailAdmin Angular Free.

## Stack

- Angular
- TypeScript
- Tailwind CSS v4
- Componentes Angular Standalone
- RxJS
- ApexCharts y librerías existentes del proyecto
- Git

No agregar nuevas dependencias sin autorización explícita.

## Fase actual: UI/UX

Actualmente el proyecto se encuentra en la fase de diseño, navegación y validación visual.

La metodología obligatoria es:

**Diseño visual → navegación → estados visuales → revisión del usuario → aprobación → funcionalidad**

El desarrollo debe realizarse **módulo por módulo**.

No implementar lógica empresarial hasta que el usuario haya aprobado previamente la propuesta visual del módulo.

Durante esta fase utilizar datos ficticios.

## No implementar todavía

No implementar:

- Backend
- NestJS
- PostgreSQL
- APIs
- Autenticación real
- Roles y permisos reales
- Lógica empresarial
- Integraciones externas

Estas funcionalidades pertenecen a fases posteriores.

## Diseño visual

Mantener el sistema visual actual de TailAdmin:

- Colores actuales
- Tipografía existente
- Componentes existentes
- Tailwind CSS v4
- Dark mode
- Diseño responsive
- Estilos y patrones visuales de TailAdmin

**No cambiar los colores actuales de TailAdmin por colores institucionales de Roosevelt**, salvo solicitud explícita del usuario.

Evitar rediseñar componentes existentes innecesariamente.

## Navegación DASI

### INICIO

- Dashboard

### GESTIÓN

- Proyectos
- Mis proyectos
- Tareas
- Kanban

### SEGUIMIENTO

- Workflow
- Actividades
- Observaciones
- Evidencias

### INFORMACIÓN

- Reportes
- Indicadores

### ADMINISTRACIÓN

- Panel de administración
- Usuarios
- Roles
- Permisos
- Módulos
- Dependencias
- Cargos
- Configuración

### AUDITORÍA

- Registro y trazabilidad

La navegación debe evolucionar posteriormente hacia una configuración basada en módulos y permisos.

## Arquitectura futura

El backend futuro utilizará:

- NestJS
- TypeScript
- PostgreSQL
- Arquitectura modular

La implementación de esta arquitectura queda para fases posteriores.

## Angular y código

- Utilizar componentes Standalone.
- Utilizar el control flow moderno de Angular: `@if`, `@for`, `@switch`.
- Evitar `*ngIf`, `*ngFor` y `*ngSwitch`.
- Mantener TypeScript estrictamente tipado.
- Mantener compatibilidad con Tailwind CSS v4.
- Mantener soporte para dark mode y RTL cuando corresponda.
- Reutilizar componentes existentes antes de crear nuevos.

## Comandos

- Servidor de desarrollo: `npm start` (http://localhost:4200)
- Build: `npm run build`
- Tests (Karma/Chrome): `npm test`
- No hay script de lint ni typecheck separado; `npm run build` valida tipos y templates.

## Estructura del código DASI

- Páginas: `src/app/pages/dasi/` (dashboard, list-demo, kanban, workflow, insights, admin-demo, audit, evidence, observations, project-detail).
- Componentes DASI compartidos: `src/app/shared/components/dasi/` (module-header, detail-modal, activity-modal, confirm-modal).
- Datos ficticios: `src/app/shared/data/dasi-demo-data.service.ts`. El estado demo se persiste en `localStorage` bajo la clave `dasi_demo_state`; `reset()` lo restaura.
- Rutas: `src/app/app.routes.ts`. Varias rutas reutilizan el mismo componente y cambian su contenido según `data: { kind: '...' }`. La administración usa `AdminDemoComponent` con `kind`: `administracion` (panel), `users`, `roles`, `permissions`, `modules`, `dependencias`, `cargos`, `settings`. Los usuarios se crean desde `/usuarios` con roles, cargos y **una o varias** dependencias (una marcada como principal).
- Sidebar: la navegación se define como datos en `src/app/shared/layout/app-sidebar/app-sidebar.component.ts`. Al añadir una ruta, reflejarla también ahí (modulo slug en `MODULE_BY_PATH` y subitem del menú).
- La ruta `/` renderiza el Dashboard DASI (`DasiDashboardComponent`) conectado al Store; el resto de la navegación también es DASI.
- Seed de datos: `api/prisma/seed.mjs` carga datos institucionales reales (dependencias, cargos, roles, módulos, permisos, usuarios y proyectos demo). Los módulos creados en el seed deben también mapearse en `MODULE_BY_PATH` para que la sesión los muestre en el menú.

## Git

Git es obligatorio para controlar los cambios.

Antes de realizar cambios importantes:

```bash
git status
git diff
git log --oneline -10
```

Mantener los mensajes de commit en español con conventional commits (estilo ya usado en el log: `feat(dasi): ...`, `docs(dasi): ...`).