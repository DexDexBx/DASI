import { Module } from '@nestjs/common';
import { ModulosService } from './modulos.service.js';
import { ModulosController } from './modulos.controller.js';

@Module({
  controllers: [ModulosController],
  providers: [ModulosService],
  exports: [ModulosService],
})
export class ModulosModule {}