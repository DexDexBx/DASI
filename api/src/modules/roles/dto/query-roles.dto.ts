import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRolesDto {
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

  @IsEnum(['GLOBAL', 'DEPENDENCIA', 'PROPIO', 'ASIGNADO'] as const)
  @IsOptional()
  scope?: 'GLOBAL' | 'DEPENDENCIA' | 'PROPIO' | 'ASIGNADO';
}
