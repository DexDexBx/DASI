import { Module } from '@nestjs/common';
import { ActividadesService } from './actividades.service.js';
import { ActividadesController } from './actividades.controller.js';

@Module({
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService],
})
export class ActividadesModule {}