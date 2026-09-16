import { IsString } from 'class-validator';

export class CrearSesionDto {
  @IsString()
  account!: string;
}