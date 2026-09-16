import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CargosService } from './cargos.service.js';
import { CreateCargoDto } from './dto/create-cargo.dto.js';
import { UpdateCargoDto } from './dto/update-cargo.dto.js';
import { QueryCargosDto } from './dto/query-cargos.dto.js';

@Controller('cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Post()
  create(@Body() dto: CreateCargoDto) {
    return this.cargosService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryCargosDto) {
    return this.cargosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cargosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCargoDto) {
    return this.cargosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cargosService.remove(id);
  }
}