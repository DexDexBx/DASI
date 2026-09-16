import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum, IsUUID } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  titulo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  fecha_inicio!: string;

  @IsDateString()
  fecha_fin!: string;

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
  usuario_id!: string;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;
}