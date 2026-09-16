import { Controller, Get, Post, Param, Delete, Query, Body } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service.js';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto.js';
import { QueryAuditoriaDto } from './dto/query-auditoria.dto.js';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post()
  registrar(@Body() dto: CreateAuditoriaDto) {
    return this.auditoriaService.registrar(dto);
  }

  @Get()
  findAll(@Query() query: QueryAuditoriaDto) {
    return this.auditoriaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditoriaService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditoriaService.remove(id);
  }
}