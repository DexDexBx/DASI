import { IsUUID } from 'class-validator';

export class MarcarTodasLeidasDto {
  @IsUUID()
  usuario_id!: string;
}