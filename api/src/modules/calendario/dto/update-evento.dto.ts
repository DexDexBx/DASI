import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum, IsUUID } from 'class-validator';

export class UpdateEventoDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  @IsOptional()
  fecha_inicio?: string;

  @IsDateString()
  @IsOptional()
  fecha_fin?: string;

  @IsBoolean()
  @IsOptional()
  todo_dia?: boolean;

  @IsString()
  @IsOptional()
  color?: string;

  @IsEnum(['PROYECTO', 'ACTIVIDAD', 'PERSONAL', 'REUNION'] as const)
  @IsOptional()
  tipo?: 'PROYECTO' | 'ACTIVIDAD' | 'PERSONAL' | 'REUNION';

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;
}