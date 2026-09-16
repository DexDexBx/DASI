import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { DasiActivityModalComponent } from '../../../shared/components/dasi/activity-modal/activity-modal.component';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { ActividadesApiService } from '../../../core/services/actividades-api.service';
import { EvidenciasApiService } from '../../../core/services/evidencias-api.service';
import { ObservacionesApiService } from '../../../core/services/observaciones-api.service';
import { AuditoriaApiService } from '../../../core/services/auditoria-api.service';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { DependenciasApiService } from '../../../core/services/dependencias-api.service';
import { fetchAllPages } from '../../../core/services/pagination';
import { HistorialProyecto, Proyecto, ResponsabilidadEtapa, WorkflowEtapa, Prioridad, EstadoProyecto } from '../../../core/models/proyecto.model';
import { Dependencia } from '../../../core/models/dependencia.model';
import { Actividad } from '../../../core/models/actividad.model';
import { Evidencia } from '../../../core/models/evidencia.model';
import { Observacion } from '../../../core/models/observacion.model';
import { SessionService } from '../../../core/services/session.service';

interface UsuarioLite {
  id: string;
  nombre: string;
  dependencia_id: string | null;
  dependencia: { id: string; nombre: string } | null;
}

interface HistorialEntry {
  id: string;
  initials: string;
  action: string;
  user: string;
  module: string;
  reference: string;
  date: string;
  previous?: string;
  next?: string;
}

@Component({
  selector: 'app-dasi-project-detail',
  imports: [RouterModule, FormsModule, BadgeComponent, ModalComponent, DasiModuleHeaderComponent, DasiActivityModalComponent],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  tab = 'Resumen';
  tabs = ['Resumen', 'Participantes', 'Actividades', 'Workflow', 'Evidencias', 'Observaciones', 'Historial'];
  selectedTaskId = '';
  editOpen = false;

  prioridades: Prioridad[] = ['Alta', 'Media', 'Baja'];
  editPrioridad: Prioridad = 'Media';
  editDescripcion = '';
  editObjetivo = '';
  editFechaInicio = '';
  editFechaFin = '';
  editRiesgo = false;
  savingProject = false;
  saveError = '';

  editDependenciaColabIds: string[] = [];
  editEquipoIds: string[] = [];
  editOwnerId = '';
  editCoordinadorId = '';
  equipoSearch = '';
  equipoCandidatos: UsuarioLite[] = [];
  dependenciaOptions: Dependencia[] = [];

  participantesEditando = false;
  savingParticipation = false;
  participationError = '';

  deriving = false;
  derivarError = '';

  proyectoEstados: EstadoProyecto[] = [
    'Pendiente', 'Aprobado', 'EnCurso', 'Implementado', 'EnRevision', 'Completado',
  ];
  editEstado: EstadoProyecto = 'Pendiente';

  taskSearch = '';
  taskStatusFilter = '';
  activityStatuses = ['Pendiente', 'Aprobado', 'EnCurso', 'Terminado', 'EnRevision', 'Completado'];

  proyecto: Proyecto | null = null;
  actividades: Actividad[] = [];
  evidencias: Evidencia[] = [];
  observaciones: Observacion[] = [];
  historial: HistorialEntry[] = [];
  loading = true;
  loadError = '';

  private readonly cdr = inject(ChangeDetectorRef);

  private projectId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly proyectosApi: ProyectosApiService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly evidenciasApi: EvidenciasApiService,
    private readonly observacionesApi: ObservacionesApiService,
    private readonly auditoriaApi: AuditoriaApiService,
    private readonly usuariosApi: UsuariosApiService,
    private readonly dependenciasApi: DependenciasApiService,
    private readonly session: SessionService,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
    this.loadParticipacion();
  }

  retry(): void {
    this.loadError = '';
    this.loading = true;
    this.load();
  }

  private loadParticipacion(): void {
    fetchAllPages((page, limit) =>
      this.usuariosApi.findAll({ estado: 'Activo', page, limit }),
    ).subscribe({
      next: (data) => {
        this.equipoCandidatos = data.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          dependencia_id: u.dependencia_id,
          dependencia: u.dependencia ? { id: u.dependencia.id, nombre: u.dependencia.nombre } : null,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar colaboradores', err),
    });
    this.dependenciasApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.dependenciaOptions = res.data.filter((d) => d.activa);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar dependencias', err),
    });
  }

  verEnCalendario(): void {
    this.router.navigate(['/calendar'], { queryParams: { proyecto: this.projectId } });
  }

  edit(): void {
    const p = this.proyecto;
    if (!p) return;
    this.editPrioridad = p.prioridad;
    this.editDescripcion = p.descripcion ?? '';
    this.editObjetivo = p.objetivo ?? '';
    this.editFechaInicio = p.fecha_inicio ? p.fecha_inicio.slice(0, 10) : '';
    this.editFechaFin = p.fecha_fin_estimada ? p.fecha_fin_estimada.slice(0, 10) : '';
    this.editRiesgo = p.riesgo;
    this.editEstado = p.estado;
    this.saveError = '';
    this.editOpen = true;
  }

  toggleParticipantesEdit(): void {
    const p = this.proyecto;
    if (!p) return;
    if (this.participantesEditando) {
      this.participantesEditando = false;
      return;
    }
    this.editEquipoIds = (p.proyecto_equipo ?? []).map((m) => m.usuario_id);
    this.editDependenciaColabIds = (p.proyecto_dependencias ?? [])
      .map((d) => d.dependencia_id)
      .filter((d) => d !== p.dependencia_id);
    this.editOwnerId = p.owner_id ?? '';
    this.editCoordinadorId = p.coordinador_id ?? '';
    this.equipoSearch = '';
    this.participationError = '';
    this.participantesEditando = true;
    this.cdr.detectChanges();
  }

  saveParticipacion(): void {
    const p = this.proyecto;
    if (!p || this.savingParticipation) return;
    this.savingParticipation = true;
    this.participationError = '';
    this.proyectosApi
      .update(p.id, {
        usuario_id: this.session.sesion?.user.id,
        owner_id: this.editOwnerId || undefined,
        coordinador_id: this.editCoordinadorId || undefined,
        equipo: this.editEquipoIds,
        dependencias: this.editDependenciaColabIds,
      })
      .subscribe({
        next: (updated) => {
          this.proyecto = updated;
          this.savingParticipation = false;
          this.participantesEditando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingParticipation = false;
          this.participationError =
            err instanceof Error ? err.message : 'No se pudo guardar la participación.';
          this.cdr.detectChanges();
        },
      });
  }

  saveProject(): void {
    if (this.savingProject || !this.proyecto) return;
    this.savingProject = true;
    this.saveError = '';
    this.proyectosApi
      .update(this.proyecto.id, {
        usuario_id: this.session.sesion?.user.id,
        prioridad: this.editPrioridad,
        descripcion: this.editDescripcion,
        objetivo: this.editObjetivo || undefined,
        fecha_inicio: this.editFechaInicio ? new Date(this.editFechaInicio).toISOString() : undefined,
        fecha_fin_estimada: this.editFechaFin ? new Date(this.editFechaFin).toISOString() : undefined,
        riesgo: this.editRiesgo,
        estado: this.editEstado,
        owner_id: this.editOwnerId || undefined,
        coordinador_id: this.editCoordinadorId || undefined,
        equipo: this.editEquipoIds,
        dependencias: this.editDependenciaColabIds,
      })
      .subscribe({
        next: (updated) => {
          this.proyecto = updated;
          this.savingProject = false;
          this.editOpen = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingProject = false;
          this.saveError = err instanceof Error ? err.message : 'No se pudo guardar el proyecto.';
          this.cdr.detectChanges();
        },
      });
  }

  get editParticipantes(): UsuarioLite[] {
    const permitidas = new Set(this.editPermitidasId);
    const actuales = new Set([this.editOwnerId, this.editCoordinadorId].filter(Boolean));
    return this.equipoCandidatos.filter(
      (u) =>
        u.dependencia_id &&
        (permitidas.has(u.dependencia_id) || actuales.has(u.id)),
    );
  }

  get editColabOptions(): Dependencia[] {
    const principal = this.proyecto?.dependencia_id;
    return this.dependenciaOptions.filter((d) => d.id !== principal);
  }

  get editPermitidasId(): string[] {
    if (!this.proyecto) return [];
    return [this.proyecto.dependencia_id, ...this.editDependenciaColabIds].filter(Boolean);
  }

  get editEquipoCandidatosFiltrados(): UsuarioLite[] {
    const permitidas = new Set(this.editPermitidasId);
    const q = this.equipoSearch.trim().toLowerCase();
    return this.equipoCandidatos
      .filter((u) => u.dependencia_id && permitidas.has(u.dependencia_id))
      .filter(
        (u) =>
          !q ||
          u.nombre.toLowerCase().includes(q) ||
          (u.dependencia?.nombre ?? '').toLowerCase().includes(q),
      );
  }

  get editEquipoSeleccionado(): { id: string; nombre: string; dependencia: string }[] {
    return this.editEquipoIds
      .map((id) => this.equipoCandidatos.find((u) => u.id === id))
      .filter((u): u is UsuarioLite => Boolean(u))
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        dependencia: u.dependencia?.nombre ?? '—',
      }));
  }

  toggleEditDependenciaColab(id: string): void {
    if (this.editDependenciaColabIds.includes(id)) {
      this.editDependenciaColabIds = this.editDependenciaColabIds.filter((d) => d !== id);
      this.editEquipoIds = this.editEquipoIds.filter(
        (uid) => this.equipoCandidatos.find((u) => u.id === uid)?.dependencia_id !== id,
      );
    } else {
      this.editDependenciaColabIds = [...this.editDependenciaColabIds, id];
    }
  }

  toggleEditEquipo(id: string): void {
    if (this.editEquipoIds.includes(id)) {
      this.editEquipoIds = this.editEquipoIds.filter((x) => x !== id);
    } else {
      this.editEquipoIds = [...this.editEquipoIds, id];
    }
  }

  get workflowEtapas(): WorkflowEtapa[] {
    return [...(this.proyecto?.proyecto_workflow ?? [])].sort((a, b) => a.orden - b.orden);
  }

  get workflowIdx(): number {
    const etapas = this.workflowEtapas;
    if (etapas.length === 0) return 0;
    const enCurso = etapas.findIndex((e) => e.estado === 'EnCurso');
    if (enCurso !== -1) return enCurso;
    let ultimoCompletado = -1;
    etapas.forEach((e, i) => {
      if (e.estado === 'Completado') ultimoCompletado = i;
    });
    return Math.min(ultimoCompletado + 1, etapas.length - 1);
  }

  get workflowActual(): WorkflowEtapa | null {
    return this.workflowEtapas[this.workflowIdx] ?? null;
  }

  get puedeDerivar(): boolean {
    const p = this.proyecto;
    if (!p || p.estado !== 'Pendiente') return false;
    const me = this.session.sesion?.user.id;
    return me === p.owner_id || me === p.coordinador_id || me === p.created_by_id;
  }

  derivar(): void {
    const p = this.proyecto;
    if (!p || this.deriving || !this.puedeDerivar) return;
    this.deriving = true;
    this.derivarError = '';
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId) {
      this.deriving = false;
      this.derivarError = 'No se pudo identificar al usuario en sesión.';
      this.cdr.detectChanges();
      return;
    }
    this.proyectosApi.derivar(p.id, { usuario_id: usuarioId }).subscribe({
      next: (updated) => {
        this.proyecto = updated;
        this.deriving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deriving = false;
        this.derivarError =
          err instanceof Error ? err.message : 'No se pudo derivar el proyecto.';
        this.cdr.detectChanges();
      },
    });
  }

  actividadesDeFase(fase: string): Actividad[] {
    return this.actividades.filter((a) => a.fase === fase);
  }

  get equipo(): string {
    return (this.proyecto?.proyecto_equipo ?? [])
      .map((e) => e.usuario?.nombre)
      .filter(Boolean)
      .join(', ');
  }

  get responsablePrincipal(): { usuario: string; dependencia: string } | null {
    const proyecto = this.proyecto;
    if (!proyecto) return null;
    return {
      usuario: proyecto.owner?.nombre ?? '—',
      dependencia: proyecto.dependencia?.nombre ?? '—',
    };
  }

  get colaboradores(): { id: string; nombre: string; dependencia: string }[] {
    const proyecto = this.proyecto;
    if (!proyecto) return [];
    return (proyecto.proyecto_equipo ?? [])
      .filter((m) => m.usuario_id !== proyecto.owner_id && m.usuario_id !== proyecto.created_by_id)
      .map((m) => ({
        id: m.usuario_id,
        nombre: m.usuario?.nombre ?? '—',
        dependencia: m.usuario?.dependencia?.nombre ?? '—',
      }));
  }

  get dependenciasColaboradoras(): { id: string; nombre: string }[] {
    const proyecto = this.proyecto;
    if (!proyecto) return [];
    return (proyecto.proyecto_dependencias ?? [])
      .filter((d) => d.dependencia_id !== proyecto.dependencia_id)
      .map((d) => ({ id: d.dependencia_id, nombre: d.dependencia?.nombre ?? '—' }));
  }

  get trabajoConjunto(): boolean {
    return this.colaboradores.length > 0 || this.dependenciasColaboradoras.length > 0;
  }

  get responsabilidades(): ResponsabilidadEtapa[] {
    return [...(this.proyecto?.proyecto_responsabilidades ?? [])];
  }

  get filteredActivities(): Actividad[] {
    let result = this.actividades;
    if (this.taskSearch) {
      const q = this.taskSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.responsable?.nombre ?? '').toLowerCase().includes(q),
      );
    }
    if (this.taskStatusFilter) {
      result = result.filter((a) => a.estado === this.taskStatusFilter);
    }
    return result;
  }

  get openActivities(): number {
    return this.actividades.filter((a) => a.estado === 'EnCurso').length;
  }

  get approvedEvidences(): number {
    return this.evidencias.filter((e) => e.estado === 'Aprobada').length;
  }

  get openObservations(): number {
    return this.observaciones.filter((o) => o.estado === 'Abierta').length;
  }

  clearTaskFilters(): void {
    this.taskSearch = '';
    this.taskStatusFilter = '';
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

  projectBadge(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Completado' || status === 'Implementado') {
      return 'success';
    }
    if (status === 'EnRevision') {
      return 'error';
    }
    return 'warning';
  }

  taskBadge(status: string): 'success' | 'warning' | 'error' | 'info' {
    const map: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      Pendiente: 'warning',
      Aprobado: 'info',
      EnCurso: 'warning',
      Terminado: 'error',
      EnRevision: 'warning',
      Completado: 'success',
    };
    return map[status] ?? 'warning';
  }

  evidenceBadge(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Aprobada') return 'success';
    if (status === 'Observada') return 'error';
    return 'warning';
  }

  observationBadge(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Resuelta') return 'success';
    if (status === 'Respondida') return 'warning';
    return 'error';
  }

  fmt(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';
    if (!this.projectId) {
      this.loading = false;
      this.loadError = 'No se pudo identificar el proyecto en la URL.';
      return;
    }
    this.proyectosApi.findOne(this.projectId, { usuario_id: this.session.sesion?.user.id }).subscribe({
      next: (proyecto) => {
        this.proyecto = proyecto;
        this.loading = false;
        this.historial = this.mapHistorial(proyecto.historial ?? []);
        if (!proyecto.historial || proyecto.historial.length === 0) {
          this.loadAuditoria();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.loadError = 'No se pudo cargar el proyecto. El endpoint /proyectos/:id no respondió correctamente.';
        console.error('DASI: error al cargar proyecto', err);
        this.cdr.detectChanges();
      },
    });
    fetchAllPages((page, limit) =>
      this.actividadesApi.findAll({ proyecto_id: this.projectId, page, limit }),
    ).subscribe({
      next: (data) => {
        this.actividades = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar actividades', err),
    });
    fetchAllPages((page, limit) =>
      this.evidenciasApi.findAll({ proyecto_id: this.projectId, page, limit }),
    ).subscribe({
      next: (data) => {
        this.evidencias = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar evidencias', err),
    });
    fetchAllPages((page, limit) =>
      this.observacionesApi.findAll({ proyecto_id: this.projectId, page, limit }),
    ).subscribe({
      next: (data) => {
        this.observaciones = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar observaciones', err),
    });
  }

  private loadAuditoria(): void {
    this.auditoriaApi.findAll({ entidad_id: this.projectId, limit: 100 }).subscribe({
      next: (r) => {
        this.historial = r.data.map((a) => ({
          id: a.id,
          initials: this.initialsOf(a.usuario?.nombre ?? ''),
          action: a.accion,
          user: a.usuario?.nombre ?? '',
          module: a.modulo,
          reference: a.entidad_id ?? '',
          date: this.fmt(a.created_at),
          previous: '',
          next: '',
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('DASI: error al cargar historial de auditoría', err),
    });
  }

  private mapHistorial(historial: HistorialProyecto[]): HistorialEntry[] {
    return [...historial]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((h) => ({
        id: h.id,
        initials: this.initialsOf(h.usuario?.nombre ?? ''),
        action: h.accion || 'Cambio de estado',
        user: h.usuario?.nombre ?? '',
        module: 'Proyectos',
        reference: this.proyecto?.code ?? h.proyecto_id,
        date: this.fmt(h.created_at),
        previous: h.estado_anterior ?? '',
        next: h.estado_nuevo ?? '',
      }));
  }
}