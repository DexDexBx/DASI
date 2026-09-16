import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAuditoriaDto {
  @IsUUID()
  @IsOptional()
  usuario_id?: string;

  @IsString()
  accion!: string;

  @IsString()
  modulo!: string;

  @IsString()
  entidad!: string;

  @IsUUID()
  @IsOptional()
  entidad_id?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  ip_address?: string;

  @IsString()
  @IsOptional()
  user_agent?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}