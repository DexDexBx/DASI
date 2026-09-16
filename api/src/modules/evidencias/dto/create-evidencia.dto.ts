import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateEvidenciaDto {
  @IsString()
  nombre!: string;

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

  @IsUUID()
  usuario_id!: string;

  @IsEnum(['Pendiente', 'EnRevision', 'Aprobada', 'Observada'] as const)
  @IsOptional()
  estado?: 'Pendiente' | 'EnRevision' | 'Aprobada' | 'Observada';
}