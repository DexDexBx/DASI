import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class UpdateResponsabilidadDto {
  @IsUUID()
  @IsOptional()
  responsable_id?: string;

  @IsString()
  @IsOptional()
  accion?: string;

  @IsBoolean()
  @IsOptional()
  habilitado?: boolean;
}