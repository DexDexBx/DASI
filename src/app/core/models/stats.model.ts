export interface ConteoPorEstado {
  estado: string;
  count: number;
}

export interface ConteoPorPrioridad {
  prioridad: string;
  count: number;
}

export interface StatsDashboard {
  proyectos: number;
  proyectos_por_estado: ConteoPorEstado[];
  proyectos_por_prioridad: ConteoPorPrioridad[];
  actividades: number;
  actividades_por_estado: ConteoPorEstado[];
  actividades_por_prioridad: ConteoPorPrioridad[];
  evidencias: number;
  evidencias_por_estado: ConteoPorEstado[];
  observaciones_abiertas: number;
  notificaciones_no_leidas: number;
  usuarios: number;
  dependencias: number;
}