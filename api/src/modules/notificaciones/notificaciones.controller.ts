import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { CreateNotificacionDto } from './dto/create-notificacion.dto.js';
import { QueryNotificacionesDto } from './dto/query-notificaciones.dto.js';
import { MarcarLeidaDto } from './dto/marcar-leida.dto.js';
import { MarcarTodasLeidasDto } from './dto/marcar-todas-leidas.dto.js';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post()
  create(@Body() dto: CreateNotificacionDto) {
    return this.notificacionesService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryNotificacionesDto) {
    return this.notificacionesService.findAll(query);
  }

  @Patch('marcar-todas-leidas')
  marcarTodasLeidas(@Body() dto: MarcarTodasLeidasDto) {
    return this.notificacionesService.marcarTodasLeidas(dto.usuario_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificacionesService.findOne(id);
  }

  @Patch(':id/leida')
  marcarLeida(@Param('id') id: string, @Body() dto: MarcarLeidaDto) {
    return this.notificacionesService.marcarLeida(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificacionesService.remove(id);
  }
}