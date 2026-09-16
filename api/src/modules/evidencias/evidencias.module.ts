import { Module } from '@nestjs/common';
import { EvidenciasService } from './evidencias.service.js';
import { EvidenciasController } from './evidencias.controller.js';

@Module({
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
  exports: [EvidenciasService],
})
export class EvidenciasModule {}