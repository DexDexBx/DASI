export type AccionPermiso =
  | 'Ver'
  | 'Crear'
  | 'Editar'
  | 'CambiarEstado'
  | 'Eliminar'
  | 'Aprobar'
  | 'Observar'
  | 'Asignar'
  | 'Exportar'
  | 'Administrar';

export interface PermisoModulo {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
}

export interface Permiso {
  id: string;
  modulo_id: string;
  accion: AccionPermiso;
  created_at: string;
  modulo: PermisoModulo;
  _count: { rol_permisos: number };
}

export interface CreatePermiso {
  modulo_id: string;
  accion: AccionPermiso;
}

export interface UpdatePermiso {
  modulo_id?: string;
  accion?: AccionPermiso;
}

export interface PermisoQuery {
  page?: number;
  limit?: number;
  search?: string;
  modulo_id?: string;
  accion?: AccionPermiso;
}