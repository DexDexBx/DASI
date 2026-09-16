export type TipoEventoCalendario = 'PROYECTO' | 'ACTIVIDAD' | 'PERSONAL' | 'REUNION';

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  todo_dia: boolean;
  color: string | null;
  tipo: TipoEventoCalendario;
  usuario_id: string;
  proyecto_id: string | null;
  proyecto: { id: string; code: string; nombre: string } | null;
  actividad_id: string | null;
  actividad: { id: string; titulo: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEvento {
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  todo_dia?: boolean;
  color?: string;
  tipo?: TipoEventoCalendario;
  usuario_id: string;
  proyecto_id?: string;
  actividad_id?: string;
}

export interface UpdateEvento {
  titulo?: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  todo_dia?: boolean;
  color?: string;
  tipo?: TipoEventoCalendario;
  proyecto_id?: string;
  actividad_id?: string;
}

export interface EventoQuery {
  page?: number;
  limit?: number;
  usuario_id?: string;
  proyecto_id?: string;
  actividad_id?: string;
  desde?: string;
  hasta?: string;
  tipo?: string;
}