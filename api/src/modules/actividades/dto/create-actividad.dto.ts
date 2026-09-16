import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsUUID, IsDateString } from 'class-validator';

export class CreateActividadDto {
  @IsString()
  titulo!: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  fase?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsUUID()
  proyecto_id!: string;

  @IsUUID()
  responsable_id!: string;

  @IsUUID()
  created_by_id!: string;

  @IsEnum(['Alta', 'Media', 'Baja'] as const)
  @IsOptional()
  prioridad?: 'Alta' | 'Media' | 'Baja';

  @IsEnum(['Pendiente', 'Aprobado', 'EnCurso', 'Terminado', 'EnRevision', 'Completado'] as const)
  @IsOptional()
  estado?: 'Pendiente' | 'Aprobado' | 'EnCurso' | 'Terminado' | 'EnRevision' | 'Completado';

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progreso?: number;

  @IsDateString()
  @IsOptional()
  fecha_inicio?: string;

  @IsDateString()
  @IsOptional()
  fecha_fin_estimada?: string;

  @IsDateString()
  @IsOptional()
  fecha_fin_real?: string;
}