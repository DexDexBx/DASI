import { IsString, IsOptional, IsUUID } from 'class-validator';

export class DerivarProyectoDto {
  @IsUUID()
  usuario_id!: string;

  @IsString()
  @IsOptional()
  comentario?: string;
}