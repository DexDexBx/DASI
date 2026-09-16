export interface Modulo {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  _count: { permisos: number };
}

export interface CreateModulo {
  slug: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateModulo {
  slug?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface ModuloQuery {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean | string;
}