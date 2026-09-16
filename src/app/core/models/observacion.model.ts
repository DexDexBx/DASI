import { ProyectoRef, UsuarioReferencia } from './proyecto.model';

export type EstadoObservacion = 'Abierta' | 'Respondida' | 'Resuelta';

export interface ObservacionEvidenciaRef {
  id: string;
  nombre: string;
  estado: string;
}

export interface ObservacionActividadRef {
  id: string;
  titulo: string;
}

export interface Observacion {
  id: string;
  contenido: string;
  evidencia_id: string | null;
  evidencia: ObservacionEvidenciaRef | null;
  actividad_id: string | null;
  actividad: ObservacionActividadRef | null;
  proyecto_id: string | null;
  proyecto: ProyectoRef | null;
  usuario_id: string;
  usuario: UsuarioReferencia;
  parent_id: string | null;
  replies: Observacion[];
  estado: EstadoObservacion;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateObservacion {
  contenido: string;
  evidencia_id?: string;
  actividad_id?: string;
  proyecto_id?: string;
  usuario_id: string;
  parent_id?: string;
  estado?: EstadoObservacion;
}

export interface UpdateObservacion {
  contenido?: string;
}

export interface ObservacionQuery {
  page?: number;
  limit?: number;
  search?: string;
  evidencia_id?: string;
  actividad_id?: string;
  proyecto_id?: string;
  usuario_id?: string;
  estado?: EstadoObservacion;
  solo_raiz?: string;
}