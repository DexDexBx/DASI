import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ModulosService } from './modulos.service.js';
import { CreateModuloDto } from './dto/create-modulo.dto.js';
import { UpdateModuloDto } from './dto/update-modulo.dto.js';
import { QueryModulosDto } from './dto/query-modulos.dto.js';

@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Post()
  create(@Body() dto: CreateModuloDto) {
    return this.modulosService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryModulosDto) {
    return this.modulosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuloDto) {
    return this.modulosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modulosService.remove(id);
  }
}