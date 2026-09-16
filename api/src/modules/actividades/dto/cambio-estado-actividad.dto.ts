import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CambioEstadoActividadDto {
  @IsEnum(['Pendiente', 'Aprobado', 'EnCurso', 'Terminado', 'EnRevision', 'Completado'] as const)
  estado!: 'Pendiente' | 'Aprobado' | 'EnCurso' | 'Terminado' | 'EnRevision' | 'Completado';

  @IsString()
  @IsOptional()
  comentario?: string;
}