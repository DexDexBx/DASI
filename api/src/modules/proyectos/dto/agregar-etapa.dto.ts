import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class AgregarEtapaDto {
  @IsUUID()
  usuario_id!: string;

  @IsString()
  @MinLength(1)
  etapa!: string;

  @IsString()
  @IsOptional()
  accion_requerida?: string;

  @IsUUID()
  @IsOptional()
  responsable_id?: string;
}