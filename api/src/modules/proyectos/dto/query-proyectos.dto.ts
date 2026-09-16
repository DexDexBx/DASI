import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProyectosDto {
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

  @IsEnum(['Pendiente', 'Aprobado', 'EnCurso', 'Implementado', 'EnRevision', 'Completado'] as const)
  @IsOptional()
  estado?: string;

  @IsEnum(['Alta', 'Media', 'Baja'] as const)
  @IsOptional()
  prioridad?: 'Alta' | 'Media' | 'Baja';

  @IsUUID()
  @IsOptional()
  dependencia_id?: string;

  @IsUUID()
  @IsOptional()
  owner_id?: string;

  @IsUUID()
  @IsOptional()
  coordinador_id?: string;

  @IsUUID()
  @IsOptional()
  created_by_id?: string;

  @IsBooleanString()
  @IsOptional()
  mis?: string;

  @IsBooleanString()
  @IsOptional()
  oficina?: string;

  @IsBooleanString()
  @IsOptional()
  colaboro?: string;

  @IsUUID()
  @IsOptional()
  usuario_id?: string;
}