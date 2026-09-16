import { IsString, IsOptional, IsUUID } from 'class-validator';

export class ActivarWorkflowDto {
  @IsUUID()
  usuario_id!: string;

  @IsString()
  @IsOptional()
  comentario?: string;
}