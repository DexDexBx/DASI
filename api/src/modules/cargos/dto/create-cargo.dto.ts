import { IsString, IsOptional } from 'class-validator';

export class CreateCargoDto {
  @IsString()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}