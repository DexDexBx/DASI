import { Module } from '@nestjs/common';
import { DependenciasController } from './dependencias.controller.js';
import { DependenciasService } from './dependencias.service.js';

@Module({
  controllers: [DependenciasController],
  providers: [DependenciasService],
  exports: [DependenciasService],
})
export class DependenciasModule {}