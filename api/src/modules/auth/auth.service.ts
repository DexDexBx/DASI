import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CrearSesionDto } from './dto/crear-sesion.dto.js';
import { Prisma } from '@prisma/client';

const INCLUDE_USUARIO = {
  dependencia: true,
  cargo: true,
  usuario_roles: {
    include: {
      rol: {
        include: {
          rol_permisos: {
            include: {
              permiso: {
                include: { modulo: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UsuarioInclude;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: CrearSesionDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        deleted_at: null,
        OR: [{ account: dto.account }, { email: dto.account }],
      },
      include: INCLUDE_USUARIO,
    });

    if (!usuario) {
      throw new NotFoundException('Cuenta no registrada en DASI');
    }

    if (usuario.estado !== 'Activo') {
      throw new ForbiddenException(
        'El usuario no está activo; contacte al administrador',
      );
    }

    const roles = usuario.usuario_roles.map(({ rol }) => ({
      id: rol.id,
      nombre: rol.nombre,
      scope: rol.scope,
    }));

    const permisosSet = new Map<string, { modulo_slug: string; accion: string }>();
    const modulosSet = new Map<string, { id: string; slug: string; nombre: string; descripcion: string | null; activo: boolean }>();

    for (const { rol } of usuario.usuario_roles) {
      for (const { permiso } of rol.rol_permisos) {
        if (!permiso.modulo.activo) continue;
        permisosSet.set(`${permiso.modulo.slug}:${permiso.accion}`, {
          modulo_slug: permiso.modulo.slug,
          accion: permiso.accion,
        });
        modulosSet.set(permiso.modulo.slug, {
          id: permiso.modulo.id,
          slug: permiso.modulo.slug,
          nombre: permiso.modulo.nombre,
          descripcion: permiso.modulo.descripcion,
          activo: permiso.modulo.activo,
        });
      }
    }

    return {
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        account: usuario.account,
        initials: usuario.initials,
        avatar_url: usuario.avatar_url,
        estado: usuario.estado,
        dependencia_id: usuario.dependencia_id,
        cargo_id: usuario.cargo_id,
      },
      dependencia: usuario.dependencia,
      cargo: usuario.cargo,
      roles,
      permisos: Array.from(permisosSet.values()),
      modulos: Array.from(modulosSet.values()),
    };
  }
}