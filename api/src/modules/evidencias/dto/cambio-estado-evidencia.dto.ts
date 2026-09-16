import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CambioEstadoEvidenciaDto {
  @IsEnum(['Pendiente', 'EnRevision', 'Aprobada', 'Observada'] as const)
  estado!: 'Pendiente' | 'EnRevision' | 'Aprobada' | 'Observada';

  @IsString()
  @IsOptional()
  comentario?: string;
}