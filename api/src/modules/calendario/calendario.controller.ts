import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CalendarioService } from './calendario.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';
import { QueryEventosDto } from './dto/query-eventos.dto.js';

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendarioService: CalendarioService) {}

  @Post()
  create(@Body() dto: CreateEventoDto) {
    return this.calendarioService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryEventosDto) {
    return this.calendarioService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventoDto) {
    return this.calendarioService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarioService.remove(id);
  }
}