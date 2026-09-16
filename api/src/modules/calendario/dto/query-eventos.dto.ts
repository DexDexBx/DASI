import { IsOptional, IsString, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEventosDto {
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
  @IsOptional()
  usuario_id?: string;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;

  @IsDateString()
  @IsOptional()
  desde?: string;

  @IsDateString()
  @IsOptional()
  hasta?: string;

  @IsString()
  @IsOptional()
  tipo?: string;
}