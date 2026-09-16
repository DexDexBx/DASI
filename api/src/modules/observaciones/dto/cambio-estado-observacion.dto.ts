import { IsEnum } from 'class-validator';

export class CambioEstadoObservacionDto {
  @IsEnum(['Abierta', 'Respondida', 'Resuelta'] as const)
  estado!: 'Abierta' | 'Respondida' | 'Resuelta';
}