export type TipoNotificacion =
  | 'PROYECTO_CREADO'
  | 'PROYECTO_ASIGNADO'
  | 'ACTIVIDAD_ASIGNADA'
  | 'ACTIVIDAD_PROXIMO_VENCER'
  | 'ACTIVIDAD_VENCIDA'
  | 'PROYECTO_PROXIMO_VENCER'
  | 'PROYECTO_VENCIDO'
  | 'PROYECTO_ESTANCADO'
  | 'EVIDENCIA_PENDIENTE'
  | 'OBSERVACION_REGISTRADA'
  | 'ACTIVIDAD_PENDIENTE_REVISION'
  | 'PROYECTO_PENDIENTE_APROBACION'
  | 'PROYECTO_IMPLEMENTADO'
  | 'PROYECTO_COMPLETADO'
  | 'SISTEMA';

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  proyecto_id: string | null;
  proyecto: { id: string; code: string; nombre: string } | null;
  actividad_id: string | null;
  actividad: { id: string; titulo: string } | null;
  created_at: string;
}

export interface NotificacionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  noLeidas: number;
}

export interface NotificacionList {
  data: Notificacion[];
  meta: NotificacionMeta;
}

export interface CreateNotificacion {
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo?: TipoNotificacion;
  leida?: boolean;
  proyecto_id?: string;
  actividad_id?: string;
}

export interface NotificacionQuery {
  page?: number;
  limit?: number;
  usuario_id: string;
  leida?: string;
  no_leidas?: string;
}