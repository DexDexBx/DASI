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
import { PermisosService } from './permisos.service.js';
import { CreatePermisoDto } from './dto/create-permiso.dto.js';
import { UpdatePermisoDto } from './dto/update-permiso.dto.js';
import { QueryPermisosDto } from './dto/query-permisos.dto.js';

@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  findAll(@Query() query: QueryPermisosDto) {
    return this.permisosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisosService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePermisoDto) {
    return this.permisosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePermisoDto) {
    return this.permisosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisosService.remove(id);
  }
}