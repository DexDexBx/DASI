import { IsUUID, IsEnum } from 'class-validator';

export class CreatePermisoDto {
  @IsUUID()
  modulo_id!: string;

  @IsEnum(['Ver', 'Crear', 'Editar', 'CambiarEstado', 'Eliminar', 'Aprobar', 'Observar', 'Asignar', 'Exportar', 'Administrar'] as const)
  accion!: 'Ver' | 'Crear' | 'Editar' | 'CambiarEstado' | 'Eliminar' | 'Aprobar' | 'Observar' | 'Asignar' | 'Exportar' | 'Administrar';
}