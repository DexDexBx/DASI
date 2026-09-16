import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class UpdateEvidenciaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  archivo_id?: string;

  @IsEnum(['Pendiente', 'EnRevision', 'Aprobada', 'Observada'] as const)
  @IsOptional()
  estado?: 'Pendiente' | 'EnRevision' | 'Aprobada' | 'Observada';
}