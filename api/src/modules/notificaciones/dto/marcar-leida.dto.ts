import { IsBoolean } from 'class-validator';

export class MarcarLeidaDto {
  @IsBoolean()
  leida!: boolean;
}