import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';

export class CreateNotificacionDto {
  @IsUUID()
  usuario_id!: string;

  @IsString()
  titulo!: string;

  @IsString()
  mensaje!: string;

  @IsEnum([
    'PROYECTO_CREADO', 'PROYECTO_ASIGNADO', 'ACTIVIDAD_ASIGNADA',
    'ACTIVIDAD_PROXIMO_VENCER', 'ACTIVIDAD_VENCIDA',
    'PROYECTO_PROXIMO_VENCER', 'PROYECTO_VENCIDO', 'PROYECTO_ESTANCADO',
    'EVIDENCIA_PENDIENTE', 'OBSERVACION_REGISTRADA',
    'ACTIVIDAD_PENDIENTE_REVISION', 'PROYECTO_PENDIENTE_APROBACION',
    'PROYECTO_IMPLEMENTADO', 'PROYECTO_COMPLETADO', 'SISTEMA',
  ] as const)
  @IsOptional()
  tipo?: string;

  @IsBoolean()
  @IsOptional()
  leida?: boolean;

  @IsUUID()
  @IsOptional()
  proyecto_id?: string;

  @IsUUID()
  @IsOptional()
  actividad_id?: string;
}