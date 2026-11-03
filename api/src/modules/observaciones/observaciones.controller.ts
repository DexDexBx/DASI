import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ObservacionesService } from './observaciones.service.js';
import { CreateObservacionDto } from './dto/create-observacion.dto.js';
import { UpdateObservacionDto } from './dto/update-observacion.dto.js';
import { QueryObservacionesDto } from './dto/query-observaciones.dto.js';
import { CambioEstadoObservacionDto } from './dto/cambio-estado-observacion.dto.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';

@Controller('observaciones')
export class ObservacionesController {
  constructor(private readonly observacionesService: ObservacionesService) {}

  @Post()
  create(@Body() dto: CreateObservacionDto) {
    return this.observacionesService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryObservacionesDto, @CurrentUser('sub') usuarioId: string) {
    return this.observacionesService.findAll(query, usuarioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') usuarioId: string) {
    return this.observacionesService.findOne(id, usuarioId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateObservacionDto, @CurrentUser('sub') usuarioId: string) {
    return this.observacionesService.update(id, dto, usuarioId);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambioEstadoObservacionDto, @CurrentUser('sub') usuarioId: string) {
    return this.observacionesService.cambiarEstado(id, dto, usuarioId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') usuarioId: string) {
    return this.observacionesService.remove(id, usuarioId);
  }
}