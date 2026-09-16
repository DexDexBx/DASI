import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max, IsArray, IsUUID, IsDateString } from 'class-validator';

export class CreateProyectoDto {
  @IsString()
  code!: string;

  @IsString()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  objetivo?: string;

  @IsUUID()
  owner_id!: string;

  @IsUUID()
  coordinador_id!: string;

  @IsUUID()
  created_by_id!: string;

  @IsUUID()
  dependencia_id!: string;

  @IsEnum(['Alta', 'Media', 'Baja'] as const)
  @IsOptional()
  prioridad?: 'Alta' | 'Media' | 'Baja';

  @IsEnum(['Pendiente'] as const)
  @IsOptional()
  estado?: 'Pendiente';

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