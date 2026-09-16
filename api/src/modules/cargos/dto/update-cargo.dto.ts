import { IsString, IsOptional } from 'class-validator';

export class UpdateCargoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}