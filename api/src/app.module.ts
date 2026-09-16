import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './common/health/health.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { PermisosModule } from './modules/permisos/permisos.module.js';
import { DependenciasModule } from './modules/dependencias/dependencias.module.js';
import { CargosModule } from './modules/cargos/cargos.module.js';
import { ModulosModule } from './modules/modulos/modulos.module.js';
import { ProyectosModule } from './modules/proyectos/proyectos.module.js';
import { ActividadesModule } from './modules/actividades/actividades.module.js';
import { EvidenciasModule } from './modules/evidencias/evidencias.module.js';
import { ObservacionesModule } from './modules/observaciones/observaciones.module.js';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module.js';
import { CalendarioModule } from './modules/calendario/calendario.module.js';
import { AuditoriaModule } from './modules/auditoria/auditoria.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { StatsModule } from './modules/stats/stats.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    UsuariosModule,
    RolesModule,
    PermisosModule,
    DependenciasModule,
    CargosModule,
    ModulosModule,
    ProyectosModule,
    ActividadesModule,
    EvidenciasModule,
    ObservacionesModule,
    NotificacionesModule,
    CalendarioModule,
    AuditoriaModule,
    AuthModule,
    StatsModule,
  ],
})
export class AppModule {}