import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis } from 'ng-apexcharts';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { StatsApiService } from '../../../core/services/stats-api.service';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { StatsDashboard } from '../../../core/models/stats.model';
import { Proyecto } from '../../../core/models/proyecto.model';
import { SessionService } from '../../../core/services/session.service';

type PrioridadKind = 'Alta' | 'Media' | 'Baja';

@Component({
  selector: 'app-dasi-insights',
  imports: [DasiModuleHeaderComponent, NgApexchartsModule, ModalComponent, BadgeComponent],
  templateUrl: './insights.component.html',
})
export class InsightsComponent {
  kind: 'reports' | 'indicators';
  exportedOpen = false;
  exportedFile = '';
  stats: StatsDashboard | null = null;
  proyectos: Proyecto[] = [];
  chart: ApexChart = { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' };
  xaxis: ApexXAxis = { categories: ['Alta', 'Media', 'Baja'] };
  colors = ['#465FFF', '#9CB9FF'];

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly buckets = ['Pendiente', 'Aprobado', 'En curso', 'Implementado', 'En revisión', 'Completado'];
  private readonly bucketMap: Record<string, string> = {
    Pendiente: 'Pendiente',
    Aprobado: 'Aprobado',
    EnCurso: 'En curso',
    Implementado: 'Implementado',
    EnRevision: 'En revisión',
    Completado: 'Completado',
  };

  constructor(route: ActivatedRoute, statsApi: StatsApiService, proyectosApi: ProyectosApiService, session: SessionService) {
    this.kind = route.snapshot.data['kind'] as 'reports' | 'indicators';
    const userId = session.sesion?.user.id;
    statsApi.resumen(userId).subscribe({
      next: (s) => {
        this.stats = s;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar el resumen', err),
    });
    proyectosApi.findAll({ limit: 100, usuario_id: userId }).subscribe({
      next: (r) => {
        this.proyectos = r.data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar proyectos', err),
    });
  }

  get title() {
    return this.kind === 'reports' ? 'Reportes' : 'Indicadores';
  }

  get description() {
    return this.kind === 'reports'
      ? 'Resumen visual de proyectos y actividades.'
      : 'Indicadores institucionales calculados desde los datos registrados.';
  }

  get actionLabel() {
    return this.kind === 'reports' ? 'Exportar reporte' : 'Exportar indicadores';
  }

  get series(): ApexAxisChartSeries {
    return [
      { name: 'Proyectos', data: this.priorityCounts(this.stats?.proyectos_por_prioridad) },
      { name: 'Actividades', data: this.priorityCounts(this.stats?.actividades_por_prioridad) },
    ];
  }

  get kpis(): { label: string; value: string }[] {
    const activos = this.proyectos.filter(
      (p) => p.estado !== 'Completado' && p.estado !== 'Implementado',
    );
    return [
      { label: 'Proyectos activos', value: String(activos.length) },
      { label: 'Implementados', value: String(this.countByEstado('Implementado')) },
      { label: 'Completados', value: String(this.countByEstado('Completado')) },
      { label: 'En riesgo', value: String(this.riesgoCount) },
      { label: 'Vencidos', value: String(this.overdueProjects.length) },
      { label: 'Actividades', value: String(this.stats?.actividades ?? '—') },
    ];
  }

  get projectStatuses(): { name: string; percent: number; count: number }[] {
    const total = this.proyectos.length || 1;
    return this.buckets.map((name) => {
      const count = this.proyectos.filter((p) => this.stageBucket(p.estado) === name).length;
      return { name, count, percent: Math.round((count / total) * 100) };
    });
  }

  get riesgoCount(): number {
    return this.proyectos.filter((p) => p.riesgo).length;
  }

  get detalleProyecto(): Proyecto | null {
    return this.proyectos[0] ?? null;
  }

  get overdueProjects(): Proyecto[] {
    const hoy = new Date();
    return this.proyectos.filter(
      (p) =>
        p.estado !== 'Completado' &&
        p.estado !== 'Implementado' &&
        p.fecha_fin_estimada !== null &&
        new Date(p.fecha_fin_estimada) < hoy,
    );
  }

  export(): void {
    const header = ['Código', 'Proyecto', 'Responsable', 'Prioridad', 'Estado', 'Avance (%)', 'Vencimiento'];
    const rows = this.proyectos.map((p) => [
      p.code,
      p.nombre,
      p.owner.nombre,
      p.prioridad,
      this.estadoLabel(p.estado),
      String(p.progreso),
      this.fmt(p.fecha_fin_estimada),
    ]);
    const totalRow = ['', 'TOTAL PROYECTOS', String(this.proyectos.length), '', '', '', ''];
    const csv = [header, ...rows, totalRow]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const prefix = this.kind === 'reports' ? 'reporte' : 'indicadores';
    this.exportedFile = `${prefix}-dasi-${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.exportedFile;
    anchor.click();
    URL.revokeObjectURL(url);
    this.exportedOpen = true;
  }

  badge(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Completado' || status === 'Implementado') return 'success';
    if (status === 'EnRevision') return 'error';
    return 'warning';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      Pendiente: 'Pendiente',
      Aprobado: 'Aprobado',
      EnCurso: 'En curso',
      Implementado: 'Implementado',
      EnRevision: 'En revisión',
      Completado: 'Completado',
    };
    return map[estado] ?? estado.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  fmt(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  private stageBucket(estado: string): string {
    return this.bucketMap[estado] ?? 'Pendiente';
  }

  private countByEstado(estado: string): number {
    const statsCount = this.stats?.proyectos_por_estado.find(
      (e) => e.estado === estado,
    )?.count;
    return statsCount ?? this.proyectos.filter((p) => p.estado === estado).length;
  }

  private priorityCounts(list: { prioridad: string; count: number }[] | undefined): number[] {
    const prioridades: PrioridadKind[] = ['Alta', 'Media', 'Baja'];
    return prioridades.map((p) => list?.find((x) => x.prioridad === p)?.count ?? 0);
  }
}