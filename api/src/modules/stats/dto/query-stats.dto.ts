import { IsOptional, IsUUID } from 'class-validator';

export class QueryStatsDto {
  @IsUUID()
  @IsOptional()
  usuario_id?: string;
}