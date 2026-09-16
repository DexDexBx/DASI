import { Prioridad, UsuarioReferencia } from './proyecto.model';

export type EstadoActividad =
  | 'Pendiente'
  | 'Aprobado'
  | 'EnCurso'
  | 'Terminado'
  | 'EnRevision'
  | 'Completado';

export interface ActividadProyectoRef {
  id: string;
  code: string;
  nombre: string;
  estado: string;
}

export interface Actividad {
  id: string;
  titulo: string;
  code: string | null;
  fase: string | null;
  descripcion: string | null;
  proyecto_id: string;
  proyecto: ActividadProyectoRef;
  responsable_id: string;
  responsable: UsuarioReferencia;
  created_by_id: string;
  created_by: UsuarioReferencia;
  prioridad: Prioridad;
  estado: EstadoActividad;
  progreso: number;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  fecha_fin_real: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  _count: { evidencias: number; observaciones: number };
}

export interface CreateActividad {
  titulo: string;
  code?: string;
  fase?: string;
  descripcion?: string;
  proyecto_id: string;
  responsable_id: string;
  created_by_id: string;
  prioridad?: Prioridad;
  estado?: EstadoActividad;
  progreso?: number;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
}

export interface UpdateActividad {
  titulo?: string;
  code?: string;
  fase?: string;
  descripcion?: string;
  responsable_id?: string;
  prioridad?: Prioridad;
  estado?: EstadoActividad;
  progreso?: number;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
}

export interface ActividadQuery {
  page?: number;
  limit?: number;
  search?: string;
  proyecto_id?: string;
  responsable_id?: string;
  created_by_id?: string;
  estado?: EstadoActividad;
  prioridad?: Prioridad;
  usuario_id?: string;
}