import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto.js';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto.js';
import { QueryEvidenciasDto } from './dto/query-evidencias.dto.js';
import { CambioEstadoEvidenciaDto } from './dto/cambio-estado-evidencia.dto.js';
import { Prisma } from '@prisma/client';
import { buildAlcanceEvidencias } from '../../common/auth/alcance.js';

const USER = {
  id: true,
  nombre: true,
  email: true,
  account: true,
  initials: true,
  avatar_url: true,
} satisfies Prisma.UsuarioSelect;

const INCLUDE = {
  actividad: {
    include: {
      proyecto: { select: { id: true, code: true, nombre: true } },
    },
  },
  proyecto: { select: { id: true, code: true, nombre: true } },
  archivo: true,
  usuario: { select: USER },
  _count: { select: { observaciones: true } },
} satisfies Prisma.EvidenciaInclude;

type EvidenciaPayload = Prisma.EvidenciaGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class EvidenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryEvidenciasDto,
    usuarioAutenticadoId: string,
  ): Promise<{ data: EvidenciaPayload[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, search, actividad_id, proyecto_id, usuario_id, estado } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EvidenciaWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (actividad_id) where.actividad_id = actividad_id;
    if (proyecto_id) where.proyecto_id = proyecto_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (estado) where.estado = estado as Prisma.EvidenciaWhereInput['estado'];

    const alcance = await buildAlcanceEvidencias(this.prisma, usuarioAutenticadoId);
    if (alcance) where.AND = [alcance];

    const [data, total] = await Promise.all([
      this.prisma.evidencia.findMany({
        where,
        include: INCLUDE,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.evidencia.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, usuarioAutenticadoId: string): Promise<EvidenciaPayload> {
    const alcance = await buildAlcanceEvidencias(this.prisma, usuarioAutenticadoId);
    const evidencia = await this.prisma.evidencia.findFirst({
      where: {
        id,
        deleted_at: null,
        ...(alcance ? { AND: [alcance] } : {}),
      },
      include: INCLUDE,
    });

    if (!evidencia) {
      throw new NotFoundException(`Evidencia con id ${id} no encontrada`);
    }

    return evidencia;
  }

  async create(dto: CreateEvidenciaDto): Promise<EvidenciaPayload> {
    if (!dto.actividad_id && !dto.proyecto_id) {
      throw new BadRequestException(
        'Debe indicarse al menos una actividad o un proyecto para la evidencia',
      );
    }

    await this.validateUsuario(dto.usuario_id);

    if (dto.actividad_id) await this.validateActividad(dto.actividad_id);
    if (dto.proyecto_id) await this.validateProyecto(dto.proyecto_id);
    if (dto.archivo_id) await this.validateArchivo(dto.archivo_id);

    const proyectoId = await this.scopeProyecto(dto.actividad_id, dto.proyecto_id);
    if (proyectoId) await this.assertParticipa(proyectoId, dto.usuario_id);

    return this.prisma.evidencia.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        estado: dto.estado,
        usuario: { connect: { id: dto.usuario_id } },
        actividad: dto.actividad_id ? { connect: { id: dto.actividad_id } } : undefined,
        proyecto: dto.proyecto_id ? { connect: { id: dto.proyecto_id } } : undefined,
        archivo: dto.archivo_id ? { connect: { id: dto.archivo_id } } : undefined,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateEvidenciaDto, usuarioAutenticadoId: string): Promise<EvidenciaPayload> {
    const evidencia = await this.findOne(id, usuarioAutenticadoId);

    if (dto.actividad_id) await this.validateActividad(dto.actividad_id);
    if (dto.proyecto_id) await this.validateProyecto(dto.proyecto_id);
    if (dto.archivo_id) await this.validateArchivo(dto.archivo_id);

    if (dto.actividad_id || dto.proyecto_id) {
      const proyectoId = await this.scopeProyecto(dto.actividad_id, dto.proyecto_id);
      if (proyectoId) await this.assertParticipa(proyectoId, evidencia.usuario_id);
    }

    return this.prisma.evidencia.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        estado: dto.estado,
        actividad: dto.actividad_id
          ? { connect: { id: dto.actividad_id } }
          : dto.actividad_id === undefined
            ? undefined
            : { disconnect: true },
        proyecto: dto.proyecto_id
          ? { connect: { id: dto.proyecto_id } }
          : dto.proyecto_id === undefined
            ? undefined
            : { disconnect: true },
        archivo: dto.archivo_id
          ? { connect: { id: dto.archivo_id } }
          : dto.archivo_id === undefined
            ? undefined
            : { disconnect: true },
      },
      include: INCLUDE,
    });
  }

  async cambiarEstado(id: string, dto: CambioEstadoEvidenciaDto, usuarioAutenticadoId: string): Promise<EvidenciaPayload> {
    await this.findOne(id, usuarioAutenticadoId);

    return this.prisma.evidencia.update({
      where: { id },
      data: { estado: dto.estado },
      include: INCLUDE,
    });
  }

  async remove(id: string, usuarioAutenticadoId: string): Promise<{ message: string }> {
    await this.findOne(id, usuarioAutenticadoId);

    await this.prisma.evidencia.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Evidencia eliminada correctamente' };
  }

  private async validateUsuario(id: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!usuario || usuario.deleted_at) {
      throw new BadRequestException(`Usuario con id ${id} no encontrado`);
    }
  }

  private async validateActividad(id: string): Promise<void> {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!actividad || actividad.deleted_at) {
      throw new BadRequestException(`Actividad con id ${id} no encontrada`);
    }
  }

  private async validateProyecto(id: string): Promise<void> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!proyecto || proyecto.deleted_at) {
      throw new BadRequestException(`Proyecto con id ${id} no encontrado`);
    }
  }

  private async validateArchivo(id: string): Promise<void> {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!archivo || archivo.deleted_at) {
      throw new BadRequestException(`Archivo con id ${id} no encontrado`);
    }
  }

  private async scopeProyecto(actividadId: string | undefined, proyectoId: string | undefined): Promise<string | null> {
    if (proyectoId) return proyectoId;
    if (!actividadId) return null;

    const actividad = await this.prisma.actividad.findUnique({
      where: { id: actividadId },
      select: { proyecto_id: true },
    });

    return actividad?.proyecto_id ?? null;
  }

  private async assertParticipa(proyectoId: string, usuarioId: string): Promise<void> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: {
        owner_id: true,
        coordinador_id: true,
        created_by_id: true,
        dependencia_id: true,
        proyecto_equipo: { select: { usuario_id: true } },
        proyecto_dependencias: { select: { dependencia_id: true } },
      },
    });

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { dependencia_id: true },
    });

    if (!proyecto || !usuario) {
      throw new BadRequestException('No se pudo verificar la participación del usuario en el proyecto');
    }

    const equipo = proyecto.proyecto_equipo.some((e) => e.usuario_id === usuarioId);
    const directo =
      proyecto.owner_id === usuarioId ||
      proyecto.coordinador_id === usuarioId ||
      proyecto.created_by_id === usuarioId ||
      equipo;
    const porDependencia =
      !!usuario.dependencia_id &&
      (usuario.dependencia_id === proyecto.dependencia_id ||
        proyecto.proyecto_dependencias.some((d) => d.dependencia_id === usuario.dependencia_id));

    if (!directo && !porDependencia) {
      throw new ForbiddenException(
        'El usuario no participa en el proyecto de esta evidencia (no es responsable ni colaborador)',
      );
    }
  }
}