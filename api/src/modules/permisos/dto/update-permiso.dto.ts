import { IsUUID, IsEnum, IsOptional } from 'class-validator';

export class UpdatePermisoDto {
  @IsUUID()
  @IsOptional()
  modulo_id?: string;

  @IsEnum(['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Eliminar', 'Aprobar', 'Observar', 'Asignar', 'Exportar', 'Administrar'] as const)
  @IsOptional()
  accion?: 'Ver' | 'Crear' | 'Editar' | 'CambiarEstado' | 'Eliminar' | 'Aprobar' | 'Observar' | 'Asignar' | 'Exportar' | 'Administrar';
}