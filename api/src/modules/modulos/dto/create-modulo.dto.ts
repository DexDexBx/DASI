import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateModuloDto {
  @IsString()
  slug!: string;

  @IsString()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}