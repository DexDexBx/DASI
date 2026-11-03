/**
 * Usuario DASI autenticado por Firebase y resuelto desde PostgreSQL.
 * Los roles y permisos se leen de la base de datos en cada petición;
 * no provienen del token.
 */
export interface DasiUser {
  sub: string;
  account: string;
  email: string;
  nombre: string;
  roles: string[];
  /** Formato "modulo_slug:Accion", por ejemplo "proyectos:Ver". */
  permisos: string[];
}
