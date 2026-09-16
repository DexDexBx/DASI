import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateModuloDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}