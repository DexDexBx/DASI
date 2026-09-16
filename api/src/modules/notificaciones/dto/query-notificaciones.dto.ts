import { IsOptional, IsUUID, IsInt, Min, Max, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificacionesDto {
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

  @IsUUID()
  usuario_id!: string;

  @IsBooleanString()
  @IsOptional()
  leida?: string;

  @IsBooleanString()
  @IsOptional()
  no_leidas?: string;
}