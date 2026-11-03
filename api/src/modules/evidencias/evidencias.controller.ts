import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EvidenciasService } from './evidencias.service.js';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto.js';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto.js';
import { QueryEvidenciasDto } from './dto/query-evidencias.dto.js';
import { CambioEstadoEvidenciaDto } from './dto/cambio-estado-evidencia.dto.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';

@Controller('evidencias')
export class EvidenciasController {
  constructor(private readonly evidenciasService: EvidenciasService) {}

  @Post()
  create(@Body() dto: CreateEvidenciaDto) {
    return this.evidenciasService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryEvidenciasDto, @CurrentUser('sub') usuarioId: string) {
    return this.evidenciasService.findAll(query, usuarioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') usuarioId: string) {
    return this.evidenciasService.findOne(id, usuarioId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEvidenciaDto, @CurrentUser('sub') usuarioId: string) {
    return this.evidenciasService.update(id, dto, usuarioId);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambioEstadoEvidenciaDto, @CurrentUser('sub') usuarioId: string) {
    return this.evidenciasService.cambiarEstado(id, dto, usuarioId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') usuarioId: string) {
    return this.evidenciasService.remove(id, usuarioId);
  }
}