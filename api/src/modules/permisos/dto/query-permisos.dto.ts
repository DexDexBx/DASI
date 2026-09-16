import { IsOptional, IsEnum, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPermisosDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  modulo_id?: string;

  @IsEnum(['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Eliminar', 'Aprobar', 'Observar', 'Asignar', 'Exportar', 'Administrar'] as const)
  @IsOptional()
  accion?: 'Ver' | 'Crear' | 'Editar' | 'CambiarEstado' | 'Eliminar' | 'Aprobar' | 'Observar' | 'Asignar' | 'Exportar' | 'Administrar';
}