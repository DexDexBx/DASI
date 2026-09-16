import { Module } from '@nestjs/common';
import { ProyectosService } from './proyectos.service.js';
import { ProyectosController } from './proyectos.controller.js';

@Module({
  controllers: [ProyectosController],
  providers: [ProyectosService],
  exports: [ProyectosService],
})
export class ProyectosModule {}