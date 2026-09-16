import { Module } from '@nestjs/common';
import { ObservacionesService } from './observaciones.service.js';
import { ObservacionesController } from './observaciones.controller.js';

@Module({
  controllers: [ObservacionesController],
  providers: [ObservacionesService],
  exports: [ObservacionesService],
})
export class ObservacionesModule {}