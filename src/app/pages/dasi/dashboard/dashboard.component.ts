import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexPlotOptions } from 'ng-apexcharts';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { Observable, Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { ApiError } from '../../../core/services/api.service';
import { SessionService } from '../../../core/services/session.service';
import { StatsApiService } from '../../../core/services/stats-api.service';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { ActividadesApiService } from '../../../core/services/actividades-api.service';
import { EvidenciasApiService } from '../../../core/services/evidencias-api.service';
import { ObservacionesApiService } from '../../../core/services/observaciones-api.service';
import { AuditoriaApiService } from '../../../core/services/auditoria-api.service';
import { fetchAllPages } from '../../../core/services/pagination';
import { VencimientosService, Vencimiento } from '../../../core/services/vencimientos.service';
import { Proyecto } from '../../../core/models/proyecto.model';
import { Actividad, EstadoActividad } from '../../../core/models/actividad.model';
import { Evidencia } from '../../../core/models/evidencia.model';
import { Observacion } from '../../../core/models/observacion.model';
import { Auditoria } from '../../../core/models/auditoria.model';
import { StatsDashboard } from '../../../core/models/stats.model';

interface MovementView {
  id: string;
  initials: string;
  user: string;
  action: string;
  description: string;
  module: string;
  date: string;
  previous?: string;
  next?: string;
}

interface ObservationView {
  id: string;
  text: string;
  author: string;
  status: string;
  taskRef: string;
}

interface AlertView {
  id: string;
  text: string;
  date: string;
  responsable: string;
  dependenciaId: string;
  accion: string;
}

@Component({
  selector: 'app-dasi-dashboard',
  imports: [CommonModule, RouterModule, NgApexchartsModule, BadgeComponent, DasiModuleHeaderComponent],
  templateUrl: './dashboard.component.html',
})
export class DasiDashboardComponent implements OnInit, OnDestroy {
  series: ApexAxisChartSeries = [
    { name: 'Planificadas', data: [10, 13, 16, 15, 19, 20, 17, 23, 20, 26, 22, 28] },
    { name: 'Completadas', data: [8, 11, 14, 12, 17, 19, 15, 21, 18, 24, 20, 27] },
  ];
  chart: ApexChart = { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' };
  xaxis: ApexXAxis = { categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] };
  colors = ['#9CB9FF', '#465FFF'];

  radialChart: ApexChart = { type: 'radialBar', height: 260, fontFamily: 'Outfit, sans-serif' };
  radialLabels = ['Avance del proyecto'];
  radialColors = ['#465FFF'];
  radialPlotOptions: ApexPlotOptions = {
    radialBar: {
      hollow: { size: '55%' },
      track: { background: 'rgba(70,95,255,0.12)' },
      dataLabels: {
        name: { fontSize: '13px', color: '#98A2B3' },
        value: { fontSize: '28px', fontWeight: 600, color: '#101828' },
      },
    },
  };

  proyectos: Proyecto[] = [];
  actividades: Actividad[] = [];
  evidencias: Evidencia[] = [];
  observaciones: Observacion[] = [];
  auditoria: Auditoria[] = [];
  stats: StatsDashboard | null = null;
  loading = true;
  loadError = '';
  accessDenied = '';
  resumenVencimientos: Vencimiento[] = [];
  summaryDismissed = false;

  private readonly cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;

  constructor(
    private readonly session: SessionService,
    private readonly statsApi: StatsApiService,
    private readonly proyectosApi: ProyectosApiService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly evidenciasApi: EvidenciasApiService,
    private readonly observacionesApi: ObservacionesApiService,
    private readonly auditoriaApi: AuditoriaApiService,
    private readonly vencimientos: VencimientosService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.loadError = '';
    this.accessDenied = '';
    this.loading = true;
    this.load();
  }

  private proyectosPorScope(scope: 'mis' | 'oficina' | 'colaboro', userId: string): Observable<Proyecto[]> {
    return fetchAllPages((page, limit) =>
      this.proyectosApi.findAll({ [scope]: 'true', usuario_id: userId, page, limit }),
    ).pipe(
      catchError((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          this.accessDenied =
            'No tienes permiso para ver los proyectos de tu oficina. Solicita el permiso correspondiente al administrador.';
        }
        return of([] as Proyecto[]);
      }),
    );
  }

  private load(): void {
    this.sub?.unsubscribe();
    const userId = this.session.sesion?.user.id;
    const esGlobal = this.session.sesion?.roles.some((r) => r.scope === 'GLOBAL') ?? false;

    this.sub = forkJoin({
      stats: this.statsApi.resumen(userId),
      proyectos: esGlobal
        ? fetchAllPages((page, limit) => this.proyectosApi.findAll({ usuario_id: userId, page, limit }))
        : forkJoin({
            mis: userId
              ? this.proyectosPorScope('mis', userId)
              : of([] as Proyecto[]),
            oficina: userId
              ? this.proyectosPorScope('oficina', userId)
              : of([] as Proyecto[]),
            colaboro: userId
              ? this.proyectosPorScope('colaboro', userId)
              : of([] as Proyecto[]),
          }).pipe(
            map(({ mis, oficina, colaboro }) => {
              const mapa = new Map<string, Proyecto>();
              for (const p of [...mis, ...oficina, ...colaboro]) {
                mapa.set(p.id, p);
              }
              return [...mapa.values()];
            }),
          ),
      actividades: fetchAllPages((page, limit) => this.actividadesApi.findAll({ page, limit, usuario_id: userId })),
      evidencias: fetchAllPages((page, limit) => this.evidenciasApi.findAll({ page, limit })),
      observaciones: fetchAllPages((page, limit) => this.observacionesApi.findAll({ page, limit })),
      auditoria: this.auditoriaApi.findAll({ limit: 5 }),
    }).subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.proyectos = res.proyectos;
        this.actividades = res.actividades;
        this.evidencias = res.evidencias;
        this.observaciones = res.observaciones;
        this.auditoria = res.auditoria.data;
        if (!esGlobal) {
          this.aplicarAlcance(userId);
        }
        this.resumenVencimientos = this.vencimientos.computar(this.proyectos, this.actividades, 7);
        this.summaryDismissed =
          this.resumenVencimientos.length === 0 ||
          sessionStorage.getItem(`dasi_venc_summary_${this.session.sesion?.user.id ?? 'anon'}`) === '1';
        this.computeSeries(this.actividades);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError =
          'No se pudieron cargar los indicadores. Verifique que el backend esté disponible en http://localhost:3000/api.';
        this.proyectos = [];
        this.actividades = [];
        this.evidencias = [];
        this.observaciones = [];
        this.auditoria = [];
        this.cdr.detectChanges();
      },
    });
  }

  private aplicarAlcance(userId: string | undefined): void {
    const visibles = new Set(this.proyectos.map((p) => p.id));
    this.actividades = this.actividades.filter((a) => visibles.has(a.proyecto_id));
    const actividadProyecto = new Map(this.actividades.map((a) => [a.id, a.proyecto_id]));
    this.evidencias = this.evidencias.filter(
      (e) => visibles.has(e.proyecto_id ?? '') || visibles.has(actividadProyecto.get(e.actividad_id ?? '') ?? ''),
    );
    this.observaciones = this.observaciones.filter((o) => {
      if (visibles.has(o.proyecto_id ?? '')) return true;
      return visibles.has(actividadProyecto.get(o.actividad_id ?? '') ?? '');
    });
  }

  private computeSeries(actividades: Actividad[]): void {
    const planificadas = new Array(12).fill(0) as number[];
    const completadas = new Array(12).fill(0) as number[];
    for (const a of actividades) {
      const planned = this.monthIndex(a.created_at);
      if (planned === -1) {
        continue;
      }
      planificadas[planned] += 1;
      if (a.estado === 'Completado') {
        const done = this.monthIndex(a.fecha_fin_real ?? a.updated_at ?? a.created_at);
        if (done !== -1) {
          completadas[done] += 1;
        }
      }
    }
    this.series = [
      { name: 'Planificadas', data: planificadas },
      { name: 'Completadas', data: completadas },
    ];
  }

  private monthIndex(value: string | null | undefined): number {
    const t = this.time(value);
    if (!t) {
      return -1;
    }
    return new Date(t).getMonth();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get isLoggedIn(): boolean {
    return this.session.isLoggedIn;
  }

  get userInitials(): string {
    return this.session.sesion?.user.initials ?? '—';
  }

  get userName(): string {
    return this.session.sesion?.user.nombre ?? '—';
  }

  get activeRolName(): string {
    return this.session.sesion?.roles[0]?.nombre ?? '';
  }

  get scopeLabel(): string {
    const sesion = this.session.sesion;
    if (!sesion) {
      return '';
    }
    switch (sesion.roles[0]?.scope) {
      case 'GLOBAL':
        return 'Toda la institución';
      case 'PROPIO':
        return 'Proyectos a mi cargo';
      case 'ASIGNADO':
        return 'Actividades asignadas a mí';
      case 'DEPENDENCIA':
      default:
        return sesion.dependencia?.nombre ?? '';
    }
  }

  get featuredProject(): Proyecto | null {
    return this.proyectos[0] ?? null;
  }

  get radialSeries(): number[] {
    return [this.featuredProject?.progreso ?? 0];
  }

  get activeProjects(): number {
    return this.proyectos.filter((p) => p.estado !== 'Completado' && p.estado !== 'Implementado').length;
  }

  get riskProjects(): number {
    return this.proyectos.filter((p) => p.riesgo).length;
  }

  get overdueProjects(): number {
    const now = Date.now();
    return this.proyectos.filter(
      (p) =>
        p.estado !== 'Completado' && p.estado !== 'Implementado' && this.time(p.fecha_fin_estimada) !== 0 && this.time(p.fecha_fin_estimada) < now,
    ).length;
  }

  get stokedProjects(): number {
    const now = Date.now();
    return this.proyectos.filter((p) => {
      if (p.estado === 'Implementado' || p.estado === 'Completado') {
        return false;
      }
      const start = this.time(p.fecha_inicio);
      if (start === 0) {
        return false;
      }
      const days = Math.round((now - start) / 86_400_000);
      return days > 45 && p.progreso < 55;
    }).length;
  }

  get pendingTasks(): number {
    return this.actividades.filter((t) => t.estado === 'Pendiente' || t.estado === 'Aprobado').length;
  }

  get overdueTasks(): number {
    const now = Date.now();
    return this.actividades.filter(
      (t) => t.estado !== 'Completado' && this.time(t.fecha_fin_estimada) !== 0 && this.time(t.fecha_fin_estimada) < now,
    ).length;
  }

  get pendingEvidences(): number {
    return this.evidencias.filter((e) => e.estado === 'Pendiente' || e.estado === 'EnRevision').length;
  }

  get openObservations(): number {
    return this.observaciones.filter((o) => o.estado === 'Abierta').length;
  }

  get inReviewTasks(): number {
    return this.actividades.filter((t) => t.estado === 'EnRevision').length;
  }

  get projectStatuses(): { name: string; count: number; percent: number }[] {
    const buckets = ['Planificación', 'En ejecución', 'Revisión', 'Cerrado'];
    const total = this.proyectos.length || 1;
    return buckets.map((name) => {
      const count = this.proyectos.filter((p) => this.stageBucket(p.estado) === name).length;
      return { name, count, percent: Math.round((count / total) * 100) };
    });
  }

  get pendingAlerts(): AlertView[] {
    const alerts: AlertView[] = [];
    const risky = this.proyectos
      .filter((p) => p.riesgo && p.estado !== 'Completado' && p.estado !== 'Implementado')
      .slice(0, 2);
    for (const p of risky) {
      alerts.push({
        id: `R-${p.id}`,
        text: `Proyecto ${p.code} marcado en riesgo`,
        date: this.formatDateTime(p.fecha_fin_estimada),
        responsable: p.coordinador?.nombre ?? '—',
        dependenciaId: p.dependencia_id,
        accion: 'Priorizar',
      });
    }
    const overdue = this.actividades
      .filter((t) => t.estado !== 'Completado' && this.time(t.fecha_fin_estimada) !== 0 && this.time(t.fecha_fin_estimada) < Date.now())
      .slice(0, 2);
    for (const t of overdue) {
      const depId = this.proyectos.find((p) => p.id === t.proyecto_id)?.dependencia_id ?? '';
      alerts.push({
        id: `A-${t.id}`,
        text: `Actividad ${t.titulo} fuera de plazo`,
        date: this.formatDateTime(t.fecha_fin_estimada),
        responsable: t.responsable?.nombre ?? '—',
        dependenciaId: depId,
        accion: 'Retomar',
      });
    }
    const porRevisar = this.evidencias.filter((e) => e.estado === 'Pendiente' || e.estado === 'EnRevision').slice(0, 2);
    for (const e of porRevisar) {
      alerts.push({
        id: `E-${e.id}`,
        text: `Evidencia ${e.nombre} por revisar`,
        date: this.formatDateTime(e.created_at),
        responsable: e.usuario?.nombre ?? '—',
        dependenciaId: e.proyecto_id ?? '',
        accion: 'Revisar',
      });
    }
    return alerts.slice(0, 5);
  }

  get pendingByDependencia(): { dependenciaId: string; name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const a of this.pendingAlerts) {
      if (!a.dependenciaId) {
        continue;
      }
      counts.set(a.dependenciaId, (counts.get(a.dependenciaId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([dependenciaId, count]) => ({ dependenciaId, name: this.dependenciaNombre(dependenciaId), count }))
      .sort((a, b) => b.count - a.count);
  }

  get pendingEmailsCount(): number {
    return 0;
  }

  get emailsPreparados(): { id: string; asunto: string; para: string; fecha: string }[] {
    return [];
  }

  get statsProyectos(): number {
    return this.stats?.proyectos ?? this.proyectos.length;
  }

  get statsActividades(): number {
    return this.stats?.actividades ?? this.actividades.length;
  }

  get statsEvidencias(): number {
    return this.stats?.evidencias ?? this.evidencias.length;
  }

  get statsUsuarios(): number {
    return this.stats?.usuarios ?? 0;
  }

  get statsDependencias(): number {
    return this.stats?.dependencias ?? 0;
  }

  realStats(): boolean {
    return this.stats !== null && Object.keys(this.stats).length > 0;
  }

  get taskByStatus(): { status: string; count: number; color: string }[] {
    const statuses: EstadoActividad[] = ['Pendiente', 'Aprobado', 'EnCurso', 'Terminado', 'EnRevision', 'Completado'];
    const colors: Record<EstadoActividad, string> = {
      Pendiente: 'bg-warning-500',
      Aprobado: 'bg-blue-light-500',
      EnCurso: 'bg-brand-500',
      Terminado: 'bg-orange-400',
      EnRevision: 'bg-yellow-500',
      Completado: 'bg-success-500',
    };
    return statuses.map((status) => ({
      status: this.statusLabel(status),
      count: this.actividades.filter((t) => t.estado === status).length,
      color: colors[status],
    }));
  }

  get recentTasks(): Actividad[] {
    return [...this.actividades].slice(0, 6);
  }

  get recentMovements(): MovementView[] {
    return this.auditoria.slice(0, 5).map((a) => ({
      id: a.id,
      initials: a.usuario?.initials ?? this.initialsOf(a.usuario?.nombre ?? '—'),
      user: a.usuario?.nombre ?? '—',
      action: a.accion,
      description: a.descripcion ?? '',
      module: a.modulo,
      date: this.formatDateTime(a.created_at),
    }));
  }

  get pendingObservations(): ObservationView[] {
    return this.observaciones
      .filter((o) => o.estado === 'Abierta' || o.estado === 'Respondida')
      .slice(0, 3)
      .map((o) => ({
        id: o.id,
        text: o.contenido,
        author: o.usuario?.nombre ?? '—',
        status: o.estado,
        taskRef: o.actividad?.id ?? o.proyecto?.id ?? '',
      }));
  }

  get upcomingTasks(): Actividad[] {
    return this.actividades
      .filter((t) => t.estado !== 'Completado')
      .sort((a, b) => this.time(b.fecha_fin_estimada) - this.time(a.fecha_fin_estimada))
      .slice(0, 3);
  }

  taskBadge(status: EstadoActividad): 'success' | 'warning' | 'error' | 'info' {
    const map: Record<EstadoActividad, 'success' | 'warning' | 'error' | 'info'> = {
      Pendiente: 'warning',
      Aprobado: 'info',
      EnCurso: 'warning',
      Terminado: 'error',
      EnRevision: 'warning',
      Completado: 'success',
    };
    return map[status];
  }

  statusLabel(estado: EstadoActividad): string {
    const map: Record<EstadoActividad, string> = {
      Pendiente: 'Pendiente',
      Aprobado: 'Aprobado',
      EnCurso: 'En curso',
      Terminado: 'Terminado',
      EnRevision: 'En revisión',
      Completado: 'Completado',
    };
    return map[estado];
  }

  initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  dependenciaNombre(id: string): string {
    return this.proyectos.find((p) => p.dependencia_id === id)?.dependencia?.nombre ?? '—';
  }

  dismissSummary(): void {
    sessionStorage.setItem(`dasi_venc_summary_${this.session.sesion?.user.id ?? 'anon'}`, '1');
    this.summaryDismissed = true;
  }

  vDiasLabel(v: Vencimiento): string {
    if (v.dias < 0) {
      return `Vencido hace ${-v.dias}d`;
    }
    if (v.dias === 0) {
      return 'Vence hoy';
    }
    return `Vence en ${v.dias}d`;
  }

  vDotClass(v: Vencimiento): string {
    return v.prioridad === 'Alta'
      ? 'bg-error-500'
      : v.prioridad === 'Media'
        ? 'bg-orange-500'
        : 'bg-success-500';
  }

  vTextClass(v: Vencimiento): string {
    return v.prioridad === 'Alta'
      ? 'text-error-600 dark:text-error-400'
      : v.prioridad === 'Media'
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-success-600 dark:text-success-400';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  private formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private stageBucket(estado: string): string {
    if (estado === 'Implementado' || estado === 'Completado') {
      return 'Cerrado';
    }
    if (estado === 'EnRevision') {
      return 'Revisión';
    }
    if (estado === 'Pendiente' || estado === 'Aprobado') {
      return 'Planificación';
    }
    return 'En ejecución';
  }

  private time(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
}