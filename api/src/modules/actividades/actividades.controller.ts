import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ActividadesService } from './actividades.service.js';
import { CreateActividadDto } from './dto/create-actividad.dto.js';
import { UpdateActividadDto } from './dto/update-actividad.dto.js';
import { QueryActividadesDto } from './dto/query-actividades.dto.js';
import { CambioEstadoActividadDto } from './dto/cambio-estado-actividad.dto.js';

@Controller('actividades')
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  create(@Body() dto: CreateActividadDto) {
    return this.actividadesService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryActividadesDto) {
    return this.actividadesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actividadesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActividadDto) {
    return this.actividadesService.update(id, dto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambioEstadoActividadDto) {
    return this.actividadesService.cambiarEstado(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actividadesService.remove(id);
  }
}