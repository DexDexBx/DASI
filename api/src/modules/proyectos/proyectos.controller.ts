import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProyectosService } from './proyectos.service.js';
import { CreateProyectoDto } from './dto/create-proyecto.dto.js';
import { UpdateProyectoDto } from './dto/update-proyecto.dto.js';
import { QueryProyectosDto } from './dto/query-proyectos.dto.js';
import { CambioEstadoProyectoDto } from './dto/cambio-estado-proyecto.dto.js';
import { UpdateWorkflowDto } from './dto/update-workflow.dto.js';
import { UpdateResponsabilidadDto } from './dto/update-responsabilidad.dto.js';
import { DerivarProyectoDto } from './dto/derivar-proyecto.dto.js';
import { ActivarWorkflowDto } from './dto/activar-workflow.dto.js';
import { AgregarEtapaDto } from './dto/agregar-etapa.dto.js';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  create(@Body() dto: CreateProyectoDto) {
    return this.proyectosService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryProyectosDto) {
    return this.proyectosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('usuario_id') usuarioId?: string) {
    return this.proyectosService.findOne(id, usuarioId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProyectoDto) {
    return this.proyectosService.update(id, dto, dto.usuario_id);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambioEstadoProyectoDto) {
    return this.proyectosService.cambiarEstado(id, dto);
  }

  @Post(':id/derivar')
  derivar(@Param('id') id: string, @Body() dto: DerivarProyectoDto) {
    return this.proyectosService.derivar(id, dto);
  }

  @Post(':id/activar-workflow')
  activarWorkflow(@Param('id') id: string, @Body() dto: ActivarWorkflowDto) {
    return this.proyectosService.activarWorkflow(id, dto);
  }

  @Post(':id/workflow')
  agregarEtapa(@Param('id') id: string, @Body() dto: AgregarEtapaDto) {
    return this.proyectosService.agregarEtapa(id, dto);
  }

  @Patch(':id/workflow/:etapa')
  updateWorkflow(
    @Param('id') id: string,
    @Param('etapa') etapa: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.proyectosService.updateWorkflow(id, etapa, dto);
  }

  @Patch(':id/responsabilidades/:etapa')
  updateResponsabilidad(
    @Param('id') id: string,
    @Param('etapa') etapa: string,
    @Body() dto: UpdateResponsabilidadDto,
  ) {
    return this.proyectosService.updateResponsabilidad(id, etapa, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('usuario_id') usuarioId?: string) {
    return this.proyectosService.remove(id, usuarioId);
  }
}