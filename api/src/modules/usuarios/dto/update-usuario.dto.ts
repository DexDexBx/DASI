import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';

export class UpdateUsuarioDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  account?: string;

  @IsString()
  @IsOptional()
  initials?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsEnum(['Activo', 'Inactivo'] as const)
  @IsOptional()
  estado?: 'Activo' | 'Inactivo';

  @IsUUID()
  @IsOptional()
  dependencia_id?: string;

  @IsUUID()
  @IsOptional()
  cargo_id?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  dependencias?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  cargos?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roles?: string[];
}
