import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DasiUser } from '../../common/auth/dasi-user.js';
import { FirebaseAdminService } from './firebase-admin.service.js';

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

type UsuarioConAcceso = Prisma.UsuarioGetPayload<{
  include: typeof INCLUDE_USUARIO;
}>;

const PROVEEDOR_GOOGLE = 'google.com';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseAdminService,
  ) {}

  /**
   * Verifica un Firebase ID Token emitido por Google y devuelve el usuario DASI
   * registrado y activo. No crea usuarios: solo vincula la cuenta de Firebase
   * con un usuario ya dado de alta por un administrador (por correo).
   */
  async autenticarFirebase(idToken: string): Promise<UsuarioConAcceso> {
    let decoded: DecodedIdToken;
    try {
      decoded = await this.firebase.verifyIdToken(idToken);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new UnauthorizedException(
        'La sesión de Google no es válida o ha expirado.',
      );
    }

    if (decoded.firebase?.sign_in_provider !== PROVEEDOR_GOOGLE) {
      throw new UnauthorizedException(
        'Solo se admite el inicio de sesión con Google.',
      );
    }

    if (!decoded.email || decoded.email_verified !== true) {
      throw new UnauthorizedException(
        'La cuenta de Google debe tener un correo verificado.',
      );
    }

    let usuario = await this.buscarUsuarioRegistrado(decoded.uid, decoded.email);

    if (usuario.estado !== 'Activo') {
      throw new ForbiddenException(
        'El usuario no está activo; contacte al administrador.',
      );
    }

    // Foto de perfil de Google: se guarda cuando cambia (una sola escritura por cambio).
    if (decoded.picture && decoded.picture !== usuario.avatar_url) {
      usuario = await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { avatar_url: decoded.picture },
        include: INCLUDE_USUARIO,
      });
    }

    return usuario;
  }

  /** Registra el inicio de sesión y devuelve el perfil con roles y permisos. */
  async iniciarSesion(usuarioId: string) {
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { last_login_at: new Date() },
      include: INCLUDE_USUARIO,
    });

    return this.buildPerfil(actualizado);
  }

  async me(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: INCLUDE_USUARIO,
    });

    if (!usuario || usuario.deleted_at) {
      throw new UnauthorizedException('La sesión ya no es válida.');
    }

    if (usuario.estado !== 'Activo') {
      throw new ForbiddenException(
        'El usuario no está activo; contacte al administrador.',
      );
    }

    return this.buildPerfil(usuario);
  }

  toDasiUser(usuario: UsuarioConAcceso): DasiUser {
    const perfil = this.buildPerfil(usuario);

    return {
      sub: usuario.id,
      account: usuario.account,
      email: usuario.email,
      nombre: usuario.nombre,
      roles: perfil.roles.map((rol) => rol.nombre),
      permisos: perfil.permisos.map(
        (permiso) => `${permiso.modulo_slug}:${permiso.accion}`,
      ),
    };
  }

  /**
   * Busca el usuario por firebase_uid. Si aún no está vinculado, lo busca por
   * correo entre usuarios registrados sin vincular y lo vincula una sola vez.
   */
  private async buscarUsuarioRegistrado(
    uid: string,
    email: string,
  ): Promise<UsuarioConAcceso> {
    const vinculado = await this.prisma.usuario.findFirst({
      where: { deleted_at: null, firebase_uid: uid },
      include: INCLUDE_USUARIO,
    });
    if (vinculado) return vinculado;

    const pendiente = await this.prisma.usuario.findFirst({
      where: {
        deleted_at: null,
        firebase_uid: null,
        email: { equals: email, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (!pendiente) {
      throw new UnauthorizedException(
        'Esta cuenta de Google no está registrada en DASI. Solicite su alta a un administrador.',
      );
    }

    return this.prisma.usuario.update({
      where: { id: pendiente.id },
      data: { firebase_uid: uid },
      include: INCLUDE_USUARIO,
    });
  }

  private buildPerfil(usuario: UsuarioConAcceso) {
    const roles = usuario.usuario_roles.map(({ rol }) => ({
      id: rol.id,
      nombre: rol.nombre,
      scope: rol.scope,
    }));

    const permisosSet = new Map<string, { modulo_slug: string; accion: string }>();
    const modulosSet = new Map<
      string,
      {
        id: string;
        slug: string;
        nombre: string;
        descripcion: string | null;
        activo: boolean;
      }
    >();

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
        last_login_at: usuario.last_login_at,
      },
      dependencia: usuario.dependencia,
      cargo: usuario.cargo,
      roles,
      permisos: Array.from(permisosSet.values()),
      modulos: Array.from(modulosSet.values()),
    };
  }
}
