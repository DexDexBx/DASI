import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEvidenciasDto {
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
  actividad_id?: string;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  usuario_id?: string;

  @IsEnum(['Pendiente', 'EnRevision', 'Aprobada', 'Observada'] as const)
  @IsOptional()
  estado?: string;
}