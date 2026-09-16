import { IsOptional, IsString, IsInt, Min, Max, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryModulosDto {
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

  @IsBooleanString()
  @IsOptional()
  activo?: string;
}