import { IsString, IsOptional } from 'class-validator';

export class UpdateObservacionDto {
  @IsString()
  @IsOptional()
  contenido?: string;
}