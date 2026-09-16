import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditoriaDto {
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

  @IsString()
  @IsOptional()
  modulo?: string;

  @IsString()
  @IsOptional()
  entidad?: string;

  @IsUUID()
  @IsOptional()
  usuario_id?: string;

  @IsUUID()
  @IsOptional()
  entidad_id?: string;
}