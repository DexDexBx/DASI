export type ScopeRol = 'GLOBAL' | 'DEPENDENCIA' | 'PROPIO' | 'ASIGNADO';

export interface RolModulo {
  id: string;
  nombre: string;
}

export interface RolPermiso {
  id: string;
  permiso_id: string;
  permiso: {
    id: string;
    modulo_id: string;
    accion: string;
    modulo: RolModulo;
  };
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  scope: ScopeRol;
  created_at: string;
  updated_at: string;
  rol_permisos: RolPermiso[];
  _count: { usuario_roles: number };
}

export interface CreateRol {
  nombre: string;
  descripcion?: string;
  scope?: ScopeRol;
}

export interface UpdateRol {
  nombre?: string;
  descripcion?: string;
  scope?: ScopeRol;
}

export interface RolQuery {
  page?: number;
  limit?: number;
  search?: string;
  scope?: ScopeRol;
}