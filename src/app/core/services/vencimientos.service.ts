import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ApiError } from './api.service';
import { SessionService } from './session.service';
import { ProyectosApiService } from './proyectos-api.service';
import { ActividadesApiService } from './actividades-api.service';
import { fetchAllPages } from './pagination';
import { Proyecto, Prioridad } from '../models/proyecto.model';
import { Actividad } from '../models/actividad.model';

export type OrigenVencimiento = 'proyecto' | 'actividad';

export interface Vencimiento {
  id: string;
  origen: OrigenVencimiento;
  titulo: string;
  code: string;
  prioridad: Prioridad;
  estado: string;
  fecha: string;
  dias: number;
  proyectoId: string;
  proyectoNombre: string;
  responsable: string;
}

const DIAS_MS = 86_400_000;
const ESTADOS_FINALES_PROYECTO = new Set(['Completado', 'Implementado']);
const ESTADOS_FINALES_ACTIVIDAD = new Set(['Completado', 'Terminado']);

@Injectable({ providedIn: 'root' })
export class VencimientosService {
  constructor(
    private readonly session: SessionService,
    private readonly proyectosApi: ProyectosApiService,
    private readonly actividadesApi: ActividadesApiService,
  ) {}

  cargar(usuarioId: string): Observable<{ proyectos: Proyecto[]; actividades: Actividad[] }> {
    return forkJoin({
      proyectos: this.proyectosDelUsuario(usuarioId),
      actividades: this.actividadesDelUsuario(usuarioId),
    });
  }

  proyectosDelUsuario(usuarioId: string): Observable<Proyecto[]> {
    if (!usuarioId) {
      return of([] as Proyecto[]);
    }
    const esGlobal =
      this.session.sesion?.roles.some((r) => r.scope === 'GLOBAL') ?? false;
    if (esGlobal) {
      return fetchAllPages<Proyecto>((page, limit) =>
        this.proyectosApi.findAll({ usuario_id: usuarioId, page, limit }),
      ).pipe(catchError((err: unknown): Observable<Proyecto[]> => this.vacio(err)));
    }
    return forkJoin({
      mis: this.porScope('mis', usuarioId),
      oficina: this.porScope('oficina', usuarioId),
      colaboro: this.porScope('colaboro', usuarioId),
    }).pipe(
      map(({ mis, oficina, colaboro }) => {
        const mapa = new Map<string, Proyecto>();
        for (const p of [...mis, ...oficina, ...colaboro]) {
          mapa.set(p.id, p);
        }
        return [...mapa.values()];
      }),
    );
  }

  actividadesDelUsuario(usuarioId: string): Observable<Actividad[]> {
    if (!usuarioId) {
      return of([] as Actividad[]);
    }
    return fetchAllPages<Actividad>((page, limit) =>
      this.actividadesApi.findAll({ page, limit, usuario_id: usuarioId }),
    ).pipe(catchError((err: unknown): Observable<Actividad[]> => this.vacio(err)));
  }

  private porScope(
    scope: 'mis' | 'oficina' | 'colaboro',
    usuarioId: string,
  ): Observable<Proyecto[]> {
    return fetchAllPages<Proyecto>((page, limit) =>
      this.proyectosApi.findAll({ [scope]: 'true', usuario_id: usuarioId, page, limit }),
    ).pipe(catchError((err: unknown): Observable<Proyecto[]> => this.vacio(err)));
  }

  private vacio<T>(err: unknown): Observable<T[]> {
    if (err instanceof ApiError && err.status === 403) {
      return of([] as T[]);
    }
    return of([] as T[]);
  }

  proximos(usuarioId: string, limiteDias = 7): Observable<Vencimiento[]> {
    return this.cargar(usuarioId).pipe(
      map(({ proyectos, actividades }) => this.computar(proyectos, actividades, limiteDias)),
    );
  }

  computar(proyectos: Proyecto[], actividades: Actividad[], limiteDias = 7): Vencimiento[] {
    const ahora = Date.now();
    const tope = ahora + limiteDias * DIAS_MS;

    const items: Vencimiento[] = [];

    for (const p of proyectos) {
      if (ESTADOS_FINALES_PROYECTO.has(p.estado) || p.fecha_fin_real) {
        continue;
      }
      if (!p.fecha_fin_estimada) {
        continue;
      }
      const t = new Date(p.fecha_fin_estimada).getTime();
      if (Number.isNaN(t) || t > tope) {
        continue;
      }
      items.push({
        id: p.id,
        origen: 'proyecto',
        titulo: p.nombre,
        code: p.code,
        prioridad: p.prioridad,
        estado: p.estado,
        fecha: p.fecha_fin_estimada,
        dias: this.diasRelativos(t, ahora),
        proyectoId: p.id,
        proyectoNombre: p.nombre,
        responsable: p.coordinador?.nombre ?? '—',
      });
    }

    for (const a of actividades) {
      if (ESTADOS_FINALES_ACTIVIDAD.has(a.estado) || a.fecha_fin_real) {
        continue;
      }
      if (!a.fecha_fin_estimada) {
        continue;
      }
      const t = new Date(a.fecha_fin_estimada).getTime();
      if (Number.isNaN(t) || t > tope) {
        continue;
      }
      items.push({
        id: a.id,
        origen: 'actividad',
        titulo: a.titulo,
        code: a.code ?? a.proyecto.code,
        prioridad: a.prioridad,
        estado: a.estado,
        fecha: a.fecha_fin_estimada,
        dias: this.diasRelativos(t, ahora),
        proyectoId: a.proyecto_id,
        proyectoNombre: a.proyecto.nombre,
        responsable: a.responsable?.nombre ?? '—',
      });
    }

    return items.sort(
      (x, y) => x.dias - y.dias || this.prioridadOrden(y.prioridad) - this.prioridadOrden(x.prioridad),
    );
  }

  diasRelativos(fechaMs: number, ahora = Date.now()): number {
    return Math.ceil((fechaMs - ahora) / DIAS_MS);
  }

  prioridadOrden(prioridad: Prioridad): number {
    return prioridad === 'Alta' ? 3 : prioridad === 'Media' ? 2 : 1;
  }

  colorPorPrioridad(prioridad: Prioridad): 'danger' | 'warning' | 'success' {
    return prioridad === 'Alta'
      ? 'danger'
      : prioridad === 'Media'
        ? 'warning'
        : 'success';
  }
}