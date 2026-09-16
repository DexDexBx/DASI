export type Prioridad = 'Alta' | 'Media' | 'Baja';

export type EstadoProyecto =
  | 'Pendiente'
  | 'Aprobado'
  | 'EnCurso'
  | 'Implementado'
  | 'EnRevision'
  | 'Completado';

export type EstadoWorkflow = 'Pendiente' | 'EnCurso' | 'Completado';

export interface UsuarioReferencia {
  id: string;
  nombre: string;
  email: string;
  account: string;
  initials: string | null;
  avatar_url: string | null;
  dependencia?: { id: string; nombre: string } | null;
}

export interface ProyectoRef {
  id: string;
  code: string;
  nombre: string;
}

export interface DependenciaReferencia {
  id: string;
  code: string;
  nombre: string;
  tipo: string;
  director: string;
}

export interface ProyectoEquipo {
  id: string;
  usuario_id: string;
  usuario: UsuarioReferencia;
}

export interface ProyectoDependenciaRef {
  id: string;
  dependencia_id: string;
  dependencia: DependenciaReferencia;
}

export interface WorkflowEtapa {
  id: string;
  proyecto_id: string;
  etapa: string;
  orden: number;
  estado: EstadoWorkflow;
  dependencia_id: string | null;
  dependencia: DependenciaReferencia | null;
  responsable_id: string | null;
  responsable: UsuarioReferencia | null;
  accion_requerida: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ResponsabilidadEtapa {
  id: string;
  proyecto_id: string;
  etapa: EstadoProyecto;
  dependencia_id: string;
  dependencia: DependenciaReferencia;
  responsable_id: string | null;
  responsable: UsuarioReferencia | null;
  accion: string;
  habilitado: boolean;
}

export interface HistorialProyecto {
  id: string;
  proyecto_id: string;
  usuario_id: string;
  usuario: UsuarioReferencia;
  estado_anterior: EstadoProyecto | null;
  estado_nuevo: EstadoProyecto;
  accion: string;
  comentario: string | null;
  created_at: string;
}

export interface Proyecto {
  id: string;
  code: string;
  nombre: string;
  descripcion: string | null;
  objetivo: string | null;
  owner_id: string;
  owner: UsuarioReferencia;
  coordinador_id: string;
  coordinador: UsuarioReferencia;
  created_by_id: string;
  created_by: UsuarioReferencia;
  dependencia_id: string;
  dependencia: DependenciaReferencia;
  prioridad: Prioridad;
  estado: EstadoProyecto;
  riesgo: boolean;
  progreso: number;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  fecha_fin_real: string | null;
  created_at: string;
  updated_at: string;
  proyecto_equipo: ProyectoEquipo[];
  proyecto_dependencias: ProyectoDependenciaRef[];
  proyecto_workflow: WorkflowEtapa[];
  proyecto_responsabilidades: ResponsabilidadEtapa[];
  historial?: HistorialProyecto[];
  actividades?: unknown[];
  evidencias?: unknown[];
  _count: {
    actividades: number;
    evidencias: number;
    observaciones: number;
    proyecto_equipo: number;
  };
}

export interface CreateProyecto {
  code: string;
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  owner_id: string;
  coordinador_id: string;
  created_by_id: string;
  dependencia_id: string;
  prioridad?: Prioridad;
  estado?: EstadoProyecto;
  riesgo?: boolean;
  progreso?: number;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  equipo?: string[];
  dependencias?: string[];
}

export interface UpdateProyecto {
  usuario_id?: string;
  code?: string;
  nombre?: string;
  descripcion?: string;
  objetivo?: string;
  owner_id?: string;
  coordinador_id?: string;
  dependencia_id?: string;
  prioridad?: Prioridad;
  estado?: EstadoProyecto;
  riesgo?: boolean;
  progreso?: number;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  equipo?: string[];
  dependencias?: string[];
}

export interface ProyectoQuery {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  prioridad?: Prioridad;
  dependencia_id?: string;
  owner_id?: string;
  coordinador_id?: string;
  created_by_id?: string;
  mis?: string;
  oficina?: string;
  colaboro?: string;
  usuario_id?: string;
}