import { Module } from '@nestjs/common';
import { CargosService } from './cargos.service.js';
import { CargosController } from './cargos.controller.js';

@Module({
  controllers: [CargosController],
  providers: [CargosService],
  exports: [CargosService],
})
export class CargosModule {}