export interface Auditoria {
  id: string;
  usuario_id: string | null;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    account: string;
    initials: string | null;
    avatar_url: string | null;
  } | null;
  accion: string;
  modulo: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  created_at: string;
}

export interface CreateAuditoria {
  usuario_id?: string;
  accion: string;
  modulo: string;
  entidad: string;
  entidad_id?: string;
  descripcion?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditoriaQuery {
  page?: number;
  limit?: number;
  search?: string;
  modulo?: string;
  entidad?: string;
  usuario_id?: string;
  entidad_id?: string;
}