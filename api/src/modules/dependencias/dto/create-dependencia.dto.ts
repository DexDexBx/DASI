import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class CreateDependenciaDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsString()
  @MaxLength(200)
  nombre!: string;

  @IsEnum(['Oficina', 'Escuela', 'JGA', 'Direccion'] as const)
  tipo!: 'Oficina' | 'Escuela' | 'JGA' | 'Direccion';

  @IsString()
  @MaxLength(200)
  director!: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsUUID()
  @IsOptional()
  parent_id?: string;
}