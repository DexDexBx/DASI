import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { NotificacionesController } from './notificaciones.controller.js';

@Module({
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}