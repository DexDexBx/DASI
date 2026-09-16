export interface Cargo {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  _count: { usuarios: number; usuario_cargos: number };
}

export interface CreateCargo {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCargo {
  nombre?: string;
  descripcion?: string;
}

export interface CargoQuery {
  page?: number;
  limit?: number;
  search?: string;
}