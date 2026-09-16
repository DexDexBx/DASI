import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class UpdateDependenciaDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nombre?: string;

  @IsEnum(['Oficina', 'Escuela', 'JGA', 'Direccion'] as const)
  @IsOptional()
  tipo?: 'Oficina' | 'Escuela' | 'JGA' | 'Direccion';

  @IsString()
  @IsOptional()
  @MaxLength(200)
  director?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsUUID()
  @IsOptional()
  parent_id?: string;
}