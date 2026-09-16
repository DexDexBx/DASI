import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

const ESTADOS_OFICIALES = ['Pendiente', 'Aprobado', 'EnCurso', 'Implementado', 'EnRevision', 'Completado'] as const;

export class CambioEstadoProyectoDto {
  @IsEnum(ESTADOS_OFICIALES)
  estado!: 'Pendiente' | 'Aprobado' | 'EnCurso' | 'Implementado' | 'EnRevision' | 'Completado';

  @IsUUID()
  usuario_id!: string;

  @IsString()
  @IsOptional()
  comentario?: string;
}