import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { SafeHtmlPipe } from '../../../shared/pipe/safe-html.pipe';
import { DasiDetailModalComponent } from '../../../shared/components/dasi/detail-modal/detail-modal.component';
import { DasiConfirmModalComponent } from '../../../shared/components/dasi/confirm-modal/confirm-modal.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { EvidenciasApiService } from '../../../core/services/evidencias-api.service';
import { ActividadesApiService } from '../../../core/services/actividades-api.service';
import { SessionService } from '../../../core/services/session.service';
import { Evidencia, EstadoEvidencia, EvidenciaQuery, CreateEvidencia } from '../../../core/models/evidencia.model';
import { Actividad } from '../../../core/models/actividad.model';

const ESTADOS_FILTRO: Record<string, EstadoEvidencia> = {
  Pendiente: 'Pendiente',
  'En revisión': 'EnRevision',
  Aprobada: 'Aprobada',
  Observada: 'Observada',
};

@Component({
  selector: 'app-dasi-evidence',
  imports: [FormsModule, BadgeComponent, ModalComponent, SafeHtmlPipe, DasiDetailModalComponent, DasiConfirmModalComponent, DasiModuleHeaderComponent],
  templateUrl: './evidence.component.html',
})
export class EvidenceComponent implements OnInit, OnDestroy {
  searchQuery = '';
  statusFilter = 'Todos';
  taskFilter = 'todas';
  evidenceType = 'Adjunto';
  evidenceTypes = ['Adjunto'];
  registerOpen = false;
  deleteOpen = false;
  newName = '';
  newTaskId = '';
  selected: Evidencia | null = null;
  pendingDelete: Evidencia | null = null;
  evidencias: Evidencia[] = [];
  actividades: Actividad[] = [];
  total = 0;
  loading = true;

  private readonly cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;
  private actSub?: Subscription;

  constructor(
    private readonly evidenciasApi: EvidenciasApiService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly session: SessionService,
  ) {}

  ngOnInit(): void {
    this.cargarActividades();
    this.cargarEvidencias();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.actSub?.unsubscribe();
  }

  get headerAction(): string {
    return this.session.can('evidencias', 'Crear') ? 'Registrar evidencia' : '';
  }

  get canReview(): boolean {
    return this.session.can('evidencias', 'Editar');
  }

  get canApprove(): boolean {
    return this.session.can('evidencias', 'Aprobar');
  }

  get canObserve(): boolean {
    return this.session.can('evidencias', 'Observar');
  }

  get canDelete(): boolean {
    return this.session.can('evidencias', 'Eliminar');
  }

  get kpis(): { label: string; estado: EstadoEvidencia; tint: string }[] {
    return [
      { label: 'Aprobadas', estado: 'Aprobada', tint: 'text-success-600 dark:text-success-500' },
      { label: 'En revisión', estado: 'EnRevision', tint: 'text-blue-light-500' },
      { label: 'Observadas', estado: 'Observada', tint: 'text-error-600 dark:text-error-500' },
    ];
  }

  get statusOptions(): string[] {
    return ['Todos', 'Pendiente', 'En revisión', 'Aprobada', 'Observada'];
  }

  get filtered(): Evidencia[] {
    return this.evidencias;
  }

  hasFilters(): boolean {
    return this.searchQuery.trim() !== '' || this.statusFilter !== 'Todos' || this.taskFilter !== 'todas';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'Todos';
    this.taskFilter = 'todas';
    this.aplicarBuscador();
  }

  aplicarBuscador(): void {
    this.cargarEvidencias();
  }

  badge(estado: EstadoEvidencia): 'success' | 'warning' | 'error' {
    if (estado === 'Aprobada') {
      return 'success';
    }
    if (estado === 'Observada') {
      return 'error';
    }
    return 'warning';
  }

  estadoLabel(estado: EstadoEvidencia): string {
    return estado === 'EnRevision' ? 'En revisión' : estado;
  }

  fmt(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  fileIcon(type: string): string {
    const base = 'h-4 w-4';
    if (type === 'Hoja de cálculo') {
      return `<svg class="${base}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    }
    if (type === 'Imagen') {
      return `<svg class="${base}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
    }
    if (type === 'Archivo') {
      return `<svg class="${base}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>`;
    }
    return `<svg class="${base}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
  }

  fileAccent(type: string): string {
    if (type === 'Hoja de cálculo') {
      return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
    }
    if (type === 'Imagen') {
      return 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500';
    }
    if (type === 'Archivo') {
      return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400';
    }
    return 'bg-brand-50 text-brand-500 dark:bg-brand-500/15';
  }

  private cargarActividades(): void {
    this.actSub?.unsubscribe();
    this.actSub = this.actividadesApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.actividades = res.data;
        if (!this.newTaskId && res.data[0]) {
          this.newTaskId = res.data[0].id;
        }
      },
      error: () => undefined,
    });
  }

  private cargarEvidencias(): void {
    const query: EvidenciaQuery = { limit: 100 };
    if (this.searchQuery.trim()) {
      query.search = this.searchQuery.trim();
    }
    if (this.statusFilter !== 'Todos') {
      const estado = ESTADOS_FILTRO[this.statusFilter];
      if (estado) {
        query.estado = estado;
      }
    }
    if (this.taskFilter !== 'todas') {
      query.actividad_id = this.taskFilter;
    }
    this.sub?.unsubscribe();
    this.sub = this.evidenciasApi.findAll(query).subscribe({
      next: (res) => {
        this.evidencias = res.data;
        this.total = res.meta.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.evidencias = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  review(e: Evidencia): void {
    this.cambiarEstado(e, 'EnRevision');
  }

  approve(e: Evidencia): void {
    this.cambiarEstado(e, 'Aprobada');
  }

  observe(e: Evidencia): void {
    this.cambiarEstado(e, 'Observada');
  }

  private cambiarEstado(e: Evidencia, estado: EstadoEvidencia): void {
    this.evidenciasApi.cambiarEstado(e.id, { estado }).subscribe({
      next: () => {
        if (this.selected?.id === e.id) {
          this.selected = null;
        }
        this.cargarEvidencias();
      },
      error: () => undefined,
    });
  }

  askDelete(e: Evidencia): void {
    this.pendingDelete = e;
    this.deleteOpen = true;
  }

  confirmDelete(): void {
    const target = this.pendingDelete;
    if (!target) {
      return;
    }
    this.evidenciasApi.remove(target.id).subscribe({
      next: () => {
        this.deleteOpen = false;
        this.pendingDelete = null;
        this.cargarEvidencias();
      },
      error: () => undefined,
    });
  }

  submitRegister(): void {
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId || !this.newName.trim()) {
      return;
    }
    const dto: CreateEvidencia = { nombre: this.newName.trim(), usuario_id: usuarioId };
    if (this.newTaskId) {
      dto.actividad_id = this.newTaskId;
    }
    this.evidenciasApi.create(dto).subscribe({
      next: () => {
        this.newName = '';
        this.registerOpen = false;
        this.cargarEvidencias();
      },
      error: () => undefined,
    });
  }
}