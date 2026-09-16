export interface PlantillaFase {
  nombre: string;
  accion: string;
  actividades: string[];
}

export interface PlantillaWorkflow {
  nombre: string;
  descripcion: string;
  fases: PlantillaFase[];
}

export const PLANTILLA_WORKFLOW_DEFAULT: PlantillaWorkflow = {
  nombre: 'Proyecto base estándar',
  descripcion:
    'Plantilla por defecto que DASI instancia al aprobar un proyecto o al activar su workflow: 4 fases operacionales con sus actividades base.',
  fases: [
    {
      nombre: 'Planificación',
      accion: 'Definir alcance, requerimientos y plan de trabajo',
      actividades: ['Definición de alcance', 'Levantamiento de requerimientos'],
    },
    {
      nombre: 'Implementación',
      accion: 'Ejecutar las actividades operativas del plan',
      actividades: ['Configuración del servidor', 'Configuración de la plataforma'],
    },
    {
      nombre: 'Pruebas',
      accion: 'Validar los entregables y registrar evidencias',
      actividades: ['Pruebas técnicas', 'Validación de entregables'],
    },
    {
      nombre: 'Cierre',
      accion: 'Documentar lecciones y cerrar el proyecto',
      actividades: ['Documentación de cierre', 'Entrega del resultado'],
    },
  ],
};