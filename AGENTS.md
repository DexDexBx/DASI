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

- Usuarios
- Roles
- Permisos
- Módulos
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

## Git

Git es obligatorio para controlar los cambios.

Antes de realizar cambios importantes:

```bash
git status