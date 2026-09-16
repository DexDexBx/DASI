import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DependenciasService } from './dependencias.service.js';
import { CreateDependenciaDto } from './dto/create-dependencia.dto.js';
import { UpdateDependenciaDto } from './dto/update-dependencia.dto.js';
import { QueryDependenciasDto } from './dto/query-dependencias.dto.js';

@Controller('dependencias')
export class DependenciasController {
  constructor(private readonly dependenciasService: DependenciasService) {}

  @Get()
  findAll(@Query() query: QueryDependenciasDto) {
    return this.dependenciasService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dependenciasService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDependenciaDto) {
    return this.dependenciasService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDependenciaDto) {
    return this.dependenciasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dependenciasService.remove(id);
  }
}