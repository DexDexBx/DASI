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
import { RolesService } from './roles.service.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { UpdateRolPermisosDto } from './dto/update-rol-permisos.dto.js';
import { QueryRolesDto } from './dto/query-roles.dto.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@Query() query: QueryRolesDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/permisos')
  updatePermisos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRolPermisosDto,
  ) {
    return this.rolesService.setPermisos(id, dto.permiso_ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
