import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class UpdateRolDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;

  @IsEnum(['GLOBAL', 'DEPENDENCIA', 'PROPIO', 'ASIGNADO'] as const)
  @IsOptional()
  scope?: 'GLOBAL' | 'DEPENDENCIA' | 'PROPIO' | 'ASIGNADO';
}
