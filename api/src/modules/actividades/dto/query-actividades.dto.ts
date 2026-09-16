import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryActividadesDto {
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
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  responsable_id?: string;

  @IsUUID()
  @IsOptional()
  created_by_id?: string;

  @IsEnum(['Pendiente', 'Aprobado', 'EnCurso', 'Terminado', 'EnRevision', 'Completado'] as const)
  @IsOptional()
  estado?: string;

  @IsEnum(['Alta', 'Media', 'Baja'] as const)
  @IsOptional()
  prioridad?: 'Alta' | 'Media' | 'Baja';

  @IsUUID()
  @IsOptional()
  usuario_id?: string;
}