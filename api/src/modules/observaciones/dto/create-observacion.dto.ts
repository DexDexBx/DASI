import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateObservacionDto {
  @IsString()
  contenido!: string;

  @IsUUID()
  @IsOptional()
  evidencia_id?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  usuario_id!: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsEnum(['Abierta', 'Respondida', 'Resuelta'] as const)
  @IsOptional()
  estado?: 'Abierta' | 'Respondida' | 'Resuelta';
}