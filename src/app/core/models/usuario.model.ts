export type EstadoUsuario = 'Activo' | 'Inactivo';

export interface RolLigero {
  id: string;
  nombre: string;
  scope: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioRol {
  id: string;
  usuario_id: string;
  rol_id: string;
  rol: RolLigero;
}

export interface UsuarioDependencia {
  id: string;
  usuario_id: string;
  dependencia_id: string;
  es_principal: boolean;
}

export interface UsuarioCargo {
  id: string;
  usuario_id: string;
  cargo_id: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  account: string;
  initials: string | null;
  avatar_url: string | null;
  estado: EstadoUsuario;
  dependencia_id: string | null;
  cargo_id: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  dependencia: { id: string; code: string; nombre: string } | null;
  cargo: { id: string; nombre: string } | null;
  usuario_roles: UsuarioRol[];
  usuario_dependencias: UsuarioDependencia[];
  usuario_cargos: UsuarioCargo[];
}

export interface CreateUsuario {
  email: string;
  nombre: string;
  account: string;
  initials?: string;
  avatar_url?: string;
  estado?: EstadoUsuario;
  dependencia_id?: string;
  cargo_id?: string;
  dependencias?: string[];
  cargos?: string[];
  roles?: string[];
}

export interface UpdateUsuario {
  email?: string;
  nombre?: string;
  account?: string;
  initials?: string;
  avatar_url?: string;
  estado?: EstadoUsuario;
  dependencia_id?: string;
  cargo_id?: string;
  dependencias?: string[];
  cargos?: string[];
  roles?: string[];
}

export interface UsuarioQuery {
  page?: number;
  limit?: number;
  search?: string;
  estado?: EstadoUsuario;
  dependencia_id?: string;
  cargo_id?: string;
  rol_id?: string;
}