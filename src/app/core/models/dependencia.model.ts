export type TipoDependencia = 'Oficina' | 'Escuela' | 'JGA' | 'Direccion';

export interface Dependencia {
  id: string;
  code: string;
  nombre: string;
  tipo: TipoDependencia;
  director: string;
  activa: boolean;
  parent_id: string | null;
  parent: Dependencia | null;
  children: Dependencia[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  _count?: { children: number };
}

export interface CreateDependencia {
  code: string;
  nombre: string;
  tipo: TipoDependencia;
  director: string;
  activa?: boolean;
  parent_id?: string;
}

export interface UpdateDependencia {
  code?: string;
  nombre?: string;
  tipo?: TipoDependencia;
  director?: string;
  activa?: boolean;
  parent_id?: string;
}

export interface DependenciaQuery {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: string;
  activa?: string;
}