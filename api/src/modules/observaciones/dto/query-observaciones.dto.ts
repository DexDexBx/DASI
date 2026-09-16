import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryObservacionesDto {
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
  evidencia_id?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  usuario_id?: string;

  @IsEnum(['Abierta', 'Respondida', 'Resuelta'] as const)
  @IsOptional()
  estado?: string;

  @IsBooleanString()
  @IsOptional()
  solo_raiz?: string;
}