import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { ObservacionesApiService } from '../../../core/services/observaciones-api.service';
import { ActividadesApiService } from '../../../core/services/actividades-api.service';
import { SessionService } from '../../../core/services/session.service';
import { Observacion, EstadoObservacion, ObservacionQuery, CreateObservacion } from '../../../core/models/observacion.model';
import { Actividad } from '../../../core/models/actividad.model';

@Component({
  selector: 'app-dasi-observations',
  imports: [FormsModule, BadgeComponent, ModalComponent, DasiModuleHeaderComponent],
  templateUrl: './observations.component.html',
})
export class ObservationsComponent implements OnInit, OnDestroy {
  searchQuery = '';
  statusFilter = 'Todos';
  taskFilter = 'todas';
  createOpen = false;
  newText = '';
  newTaskId = '';
  observaciones: Observacion[] = [];
  actividades: Actividad[] = [];
  loading = true;

  private readonly cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;
  private actSub?: Subscription;

  constructor(
    private readonly observacionesApi: ObservacionesApiService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly session: SessionService,
  ) {}

  ngOnInit(): void {
    this.cargarActividades();
    this.cargarObservaciones();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.actSub?.unsubscribe();
  }

  get headerAction(): string {
    return this.session.can('observaciones', 'Crear') ? 'Nueva observación' : '';
  }

  get canApprove(): boolean {
    return this.session.can('observaciones', 'Aprobar');
  }

  get statusOptions(): string[] {
    return ['Todos', 'Abierta', 'Respondida', 'Resuelta'];
  }

  get kpis(): { estado: EstadoObservacion; label: string; tint: string }[] {
    return [
      { estado: 'Abierta', label: 'Abiertas', tint: 'text-error-600 dark:text-error-500' },
      { estado: 'Respondida', label: 'Respondidas', tint: 'text-warning-600 dark:text-orange-400' },
      { estado: 'Resuelta', label: 'Resueltas', tint: 'text-success-600 dark:text-success-500' },
    ];
  }

  get filtered(): Observacion[] {
    return this.observaciones;
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
    this.cargarObservaciones();
  }

  badge(estado: EstadoObservacion): 'success' | 'warning' | 'error' {
    if (estado === 'Resuelta') {
      return 'success';
    }
    if (estado === 'Respondida') {
      return 'warning';
    }
    return 'error';
  }

  fmt(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  private cargarActividades(): void {
    this.actSub?.unsubscribe();
    this.actSub = this.actividadesApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.actividades = res.data;
        if (!this.newTaskId && res.data[0]) {
          this.newTaskId = res.data[0].id;
        }
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  private cargarObservaciones(): void {
    const query: ObservacionQuery = { limit: 100 };
    if (this.searchQuery.trim()) {
      query.search = this.searchQuery.trim();
    }
    if (this.statusFilter !== 'Todos') {
      query.estado = this.statusFilter as EstadoObservacion;
    }
    if (this.taskFilter !== 'todas') {
      query.actividad_id = this.taskFilter;
    }
    this.sub?.unsubscribe();
    this.sub = this.observacionesApi.findAll(query).subscribe({
      next: (res) => {
        this.observaciones = res.data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.observaciones = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  respond(o: Observacion): void {
    this.observacionesApi.cambiarEstado(o.id, 'Respondida').subscribe({
      next: () => this.cargarObservaciones(),
      error: () => undefined,
    });
  }

  resolve(o: Observacion): void {
    this.observacionesApi.cambiarEstado(o.id, 'Resuelta').subscribe({
      next: () => this.cargarObservaciones(),
      error: () => undefined,
    });
  }

  submitCreate(): void {
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId || !this.newText.trim()) {
      return;
    }
    const dto: CreateObservacion = { contenido: this.newText.trim(), usuario_id: usuarioId };
    if (this.newTaskId) {
      dto.actividad_id = this.newTaskId;
    }
    this.observacionesApi.create(dto).subscribe({
      next: () => {
        this.newText = '';
        this.createOpen = false;
        this.cargarObservaciones();
      },
      error: () => undefined,
    });
  }
}