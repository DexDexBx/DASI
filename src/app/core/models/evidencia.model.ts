import { ActividadProyectoRef } from './actividad.model';
import { ProyectoRef, UsuarioReferencia } from './proyecto.model';

export type EstadoEvidencia = 'Pendiente' | 'EnRevision' | 'Aprobada' | 'Observada';

export interface EvidenciaActividadRef {
  id: string;
  titulo: string;
  proyecto: ProyectoRef | null;
}

export interface Evidencia {
  id: string;
  nombre: string;
  descripcion: string | null;
  actividad_id: string | null;
  actividad: EvidenciaActividadRef | null;
  proyecto_id: string | null;
  proyecto: ProyectoRef | null;
  archivo_id: string | null;
  archivo: null | {
    id: string;
    nombre_original: string;
    cdn_url: string | null;
    mime_type: string;
    size_bytes: string;
  };
  usuario_id: string;
  usuario: UsuarioReferencia;
  estado: EstadoEvidencia;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  _count: { observaciones: number };
}

export interface CreateEvidencia {
  nombre: string;
  descripcion?: string;
  actividad_id?: string;
  proyecto_id?: string;
  archivo_id?: string;
  usuario_id: string;
  estado?: EstadoEvidencia;
}

export interface UpdateEvidencia {
  nombre?: string;
  descripcion?: string;
  actividad_id?: string;
  proyecto_id?: string;
  archivo_id?: string;
  estado?: EstadoEvidencia;
}

export interface EvidenciaQuery {
  page?: number;
  limit?: number;
  search?: string;
  actividad_id?: string;
  proyecto_id?: string;
  usuario_id?: string;
  estado?: EstadoEvidencia;
}