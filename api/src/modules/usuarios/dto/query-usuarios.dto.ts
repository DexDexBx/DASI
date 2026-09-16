import { IsOptional, IsEnum, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUsuariosDto {
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

  @IsEnum(['Activo', 'Inactivo'] as const)
  @IsOptional()
  estado?: 'Activo' | 'Inactivo';

  @IsUUID()
  @IsOptional()
  dependencia_id?: string;

  @IsUUID()
  @IsOptional()
  cargo_id?: string;

  @IsUUID()
  @IsOptional()
  rol_id?: string;
}
