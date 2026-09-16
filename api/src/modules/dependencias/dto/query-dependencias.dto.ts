import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDependenciasDto {
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

  @IsEnum(['Oficina', 'Escuela', 'JGA', 'Direccion'] as const)
  @IsOptional()
  tipo?: 'Oficina' | 'Escuela' | 'JGA' | 'Direccion';

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  activa?: boolean;

  @IsUUID()
  @IsOptional()
  parent_id?: string;
}