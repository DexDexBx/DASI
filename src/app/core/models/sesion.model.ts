import { Cargo } from './cargo.model';
import { Dependencia } from './dependencia.model';

export interface SesionRol {
  id: string;
  nombre: string;
  scope: string;
}

export interface SesionPermiso {
  modulo_slug: string;
  accion: string;
}

export interface SesionModulo {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Sesion {
  user: {
    id: string;
    nombre: string;
    email: string;
    account: string;
    initials: string | null;
    avatar_url: string | null;
    estado: 'Activo' | 'Inactivo';
    dependencia_id: string | null;
    cargo_id: string | null;
    last_login_at?: string | null;
  };
  dependencia: Dependencia | null;
  cargo: Cargo | null;
  roles: SesionRol[];
  permisos: SesionPermiso[];
  modulos: SesionModulo[];
}