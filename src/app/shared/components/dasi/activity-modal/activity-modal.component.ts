import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { SessionService } from '../../../../core/services/session.service';
import { ActividadesApiService } from '../../../../core/services/actividades-api.service';
import { EvidenciasApiService } from '../../../../core/services/evidencias-api.service';
import { ObservacionesApiService } from '../../../../core/services/observaciones-api.service';
import { Actividad, EstadoActividad } from '../../../../core/models/actividad.model';
import { Evidencia, EstadoEvidencia } from '../../../../core/models/evidencia.model';
import {
  Observacion,
  EstadoObservacion,
} from '../../../../core/models/observacion.model';

@Component({
  selector: 'app-dasi-activity-modal',
  imports: [FormsModule, ModalComponent, BadgeComponent],
  templateUrl: './activity-modal.component.html',
})
export class DasiActivityModalComponent implements OnDestroy {
  @Output() close = new EventEmitter<void>();

  @Input() set section(value: 'detalle' | 'evidencias' | 'observaciones') {
    this.activeTab = value;
  }

  private _isOpen = false;

  get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() set isOpen(value: boolean) {
    const wasOpen = this._isOpen;
    this._isOpen = value;
    if (value && !wasOpen) {
      this.loadData();
    }
  }

  retryTask(): void {
    this.loadTask();
  }

  private _taskId = '';

  get taskId(): string {
    return this._taskId;
  }

  @Input() set taskId(value: string) {
    if (this._taskId === value) {
      return;
    }
    this._taskId = value;
    this.loadData();
  }

  activeTab: 'detalle' | 'evidencias' | 'observaciones' = 'detalle';

  get tabs(): ('detalle' | 'evidencias' | 'observaciones')[] {
    return ['detalle', 'evidencias', 'observaciones'];
  }

  newEvidence = '';
  evidenceType = 'Documento';
  newObservation = '';
  evidenceTypes = ['Documento', 'Archivo', 'Hoja de cálculo', 'Imagen'];

  task?: Actividad;
  evidences: Evidencia[] = [];
  observations: Observacion[] = [];
  taskError = '';

  private readonly cdr = inject(ChangeDetectorRef);

  private taskSub?: Subscription;
  private evidenceSub?: Subscription;
  private observationSub?: Subscription;

  constructor(
    private readonly session: SessionService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly evidenciasApi: EvidenciasApiService,
    private readonly observacionesApi: ObservacionesApiService,
  ) {}

  ngOnDestroy(): void {
    this.taskSub?.unsubscribe();
    this.evidenceSub?.unsubscribe();
    this.observationSub?.unsubscribe();
  }

  get nextStatuses(): EstadoActividad[] {
    if (!this.task) {
      return [];
    }
    const map: Record<EstadoActividad, EstadoActividad[]> = {
      Pendiente: ['Aprobado'],
      Aprobado: ['EnCurso'],
      EnCurso: ['Terminado'],
      Terminado: ['EnRevision'],
      EnRevision: ['Completado'],
      Completado: [],
    };
    return map[this.task.estado];
  }

  initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  taskBadge(estado: EstadoActividad): 'success' | 'warning' | 'error' {
    if (estado === 'Completado' || estado === 'Aprobado') {
      return 'success';
    }
    if (estado === 'Pendiente' || estado === 'EnRevision') {
      return 'warning';
    }
    return 'error';
  }

  evidenceBadge(estado: EstadoEvidencia): 'success' | 'warning' | 'error' {
    if (estado === 'Aprobada') {
      return 'success';
    }
    if (estado === 'Observada') {
      return 'error';
    }
    return 'warning';
  }

  observationBadge(estado: EstadoObservacion): 'success' | 'warning' | 'error' {
    if (estado === 'Resuelta') {
      return 'success';
    }
    if (estado === 'Respondida') {
      return 'warning';
    }
    return 'error';
  }

  estadoLabel(estado: EstadoActividad): string {
    const labels: Record<EstadoActividad, string> = {
      Pendiente: 'Pendiente',
      Aprobado: 'Aprobado',
      EnCurso: 'En curso',
      Terminado: 'Terminado',
      EnRevision: 'En revisión',
      Completado: 'Completado',
    };
    return labels[estado];
  }

  evidenceLabel(estado: EstadoEvidencia): string {
    const labels: Record<EstadoEvidencia, string> = {
      Pendiente: 'Pendiente',
      EnRevision: 'En revisión',
      Aprobada: 'Aprobada',
      Observada: 'Observada',
    };
    return labels[estado];
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

  moveTo(status: EstadoActividad): void {
    if (!this.task) {
      return;
    }
    this.taskSub?.unsubscribe();
    this.taskSub = this.actividadesApi
      .cambiarEstado(this.task.id, { estado: status })
      .subscribe({
        next: (actividad) => {
          this.task = actividad;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('DASI: error al cambiar estado de actividad', err),
      });
  }

  reviewEvidence(id: string): void {
    this.changeEvidenceState(id, 'EnRevision');
  }

  approveEvidence(id: string): void {
    this.changeEvidenceState(id, 'Aprobada');
  }

  markEvidenceObserved(id: string): void {
    this.changeEvidenceState(id, 'Observada');
  }

  private changeEvidenceState(id: string, estado: EstadoEvidencia): void {
    this.evidenceSub?.unsubscribe();
    this.evidenceSub = this.evidenciasApi
      .cambiarEstado(id, { estado })
      .subscribe({
        next: () => this.loadEvidences(),
        error: (err) => console.error('DASI: error al cambiar estado de evidencia', err),
      });
  }

  registerEvidence(): void {
    const nombre = this.newEvidence.trim();
    const usuarioId = this.session.sesion?.user.id;
    if (!nombre || !usuarioId) {
      return;
    }
    this.evidenceSub?.unsubscribe();
    this.evidenceSub = this.evidenciasApi
      .create({
        nombre,
        actividad_id: this.taskId,
        usuario_id: usuarioId,
      })
      .subscribe({
        next: () => {
          this.newEvidence = '';
          this.loadEvidences();
        },
        error: (err) => console.error('DASI: error al registrar evidencia', err),
      });
  }

  addObservation(): void {
    const contenido = this.newObservation.trim();
    const usuarioId = this.session.sesion?.user.id;
    if (!contenido || !usuarioId) {
      return;
    }
    this.observationSub?.unsubscribe();
    this.observationSub = this.observacionesApi
      .create({
        contenido,
        actividad_id: this.taskId,
        usuario_id: usuarioId,
      })
      .subscribe({
        next: () => {
          this.newObservation = '';
          this.loadObservations();
        },
        error: (err) => console.error('DASI: error al agregar observación', err),
      });
  }

  respond(id: string): void {
    this.changeObservationState(id, 'Respondida');
  }

  resolve(id: string): void {
    this.changeObservationState(id, 'Resuelta');
  }

  private changeObservationState(id: string, estado: EstadoObservacion): void {
    this.observationSub?.unsubscribe();
    this.observationSub = this.observacionesApi
      .cambiarEstado(id, estado)
      .subscribe({
        next: () => this.loadObservations(),
        error: (err) =>
          console.error('DASI: error al cambiar estado de observación', err),
      });
  }

  private loadData(): void {
    this.loadTask();
    this.loadEvidences();
    this.loadObservations();
  }

  private loadTask(): void {
    this.taskSub?.unsubscribe();
    if (!this._taskId) {
      this.taskError = '';
      return;
    }
    this.task = undefined;
    this.taskError = '';
    this.taskSub = this.actividadesApi.findOne(this._taskId).subscribe({
      next: (actividad) => {
        this.task = actividad;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.taskError = 'No se pudo cargar la actividad. Verifique la conexión con el backend.';
        console.error('DASI: error al cargar actividad', err);
        this.cdr.detectChanges();
      },
    });
  }

  private loadEvidences(): void {
    this.evidenceSub?.unsubscribe();
    if (!this._taskId) {
      return;
    }
    this.evidenceSub = this.evidenciasApi
      .findAll({ actividad_id: this._taskId, limit: 100 })
      .subscribe({
        next: (res) => {
          this.evidences = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('DASI: error al cargar evidencias', err),
      });
  }

  private loadObservations(): void {
    this.observationSub?.unsubscribe();
    if (!this._taskId) {
      return;
    }
    this.observationSub = this.observacionesApi
      .findAll({ actividad_id: this._taskId, limit: 100 })
      .subscribe({
        next: (res) => {
          this.observations = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('DASI: error al cargar observaciones', err),
      });
  }
}