import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class UpdateWorkflowDto {
  @IsEnum(['Pendiente', 'EnCurso', 'Completado'] as const)
  @IsOptional()
  estado?: 'Pendiente' | 'EnCurso' | 'Completado';

  @IsUUID()
  @IsOptional()
  dependencia_id?: string;

  @IsUUID()
  @IsOptional()
  responsable_id?: string;

  @IsString()
  @IsOptional()
  accion_requerida?: string;

  @IsDateString()
  @IsOptional()
  started_at?: string;

  @IsDateString()
  @IsOptional()
  completed_at?: string;

  @IsUUID()
  @IsOptional()
  usuario_id?: string;
}