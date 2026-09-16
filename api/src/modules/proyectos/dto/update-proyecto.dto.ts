import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max, IsArray, IsUUID, IsDateString } from 'class-validator';

export class UpdateProyectoDto {
  @IsUUID()
  @IsOptional()
  usuario_id?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  objetivo?: string;

  @IsUUID()
  @IsOptional()
  owner_id?: string;

  @IsUUID()
  @IsOptional()
  coordinador_id?: string;

  @IsUUID()
  @IsOptional()
  dependencia_id?: string;

  @IsEnum(['Alta', 'Media', 'Baja'] as const)
  @IsOptional()
  prioridad?: 'Alta' | 'Media' | 'Baja';

  @IsEnum(['Pendiente', 'Aprobado', 'EnCurso', 'Implementado', 'EnRevision', 'Completado'] as const)
  @IsOptional()
  estado?: 'Pendiente' | 'Aprobado' | 'EnCurso' | 'Implementado' | 'EnRevision' | 'Completado';

  @IsBoolean()
  @IsOptional()
  riesgo?: boolean;

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

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  equipo?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  dependencias?: string[];
}