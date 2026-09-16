import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class UpdateRolPermisosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  permiso_ids!: string[];
}