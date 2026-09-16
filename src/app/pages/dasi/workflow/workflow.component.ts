import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { ActividadesApiService } from '../../../core/services/actividades-api.service';
import { SessionService } from '../../../core/services/session.service';
import { fetchAllPages } from '../../../core/services/pagination';
import { PLANTILLA_WORKFLOW_DEFAULT } from '../../../shared/data/workflow-templates';
import {
  EstadoProyecto,
  Prioridad,
  Proyecto,
  ResponsabilidadEtapa,
  WorkflowEtapa,
} from '../../../core/models/proyecto.model';

interface StageInfo {
  responsible: string;
  date: string;
  note: string;
}

const STAGE_LABEL: Record<string, string> = {
  Pendiente: 'Pendiente',
  Aprobado: 'Aprobado',
  EnCurso: 'En curso',
  Implementado: 'Implementado',
  EnRevision: 'En revisión',
  Completado: 'Completado',
};

@Component({
  selector: 'app-dasi-workflow',
  imports: [FormsModule, BadgeComponent, DasiModuleHeaderComponent, ModalComponent],
  templateUrl: './workflow.component.html',
})
export class WorkflowComponent implements OnInit, OnDestroy {
  proyectos: Proyecto[] = [];
  proyecto: Proyecto | null = null;
  selectedProyectoId = '';
  viewed = 0;
  loading = false;
  processing = false;
  actionError = '';

  proyectoBusqueda = '';
  proyectoDropdownOpen = false;

  configOpen = false;
  configEtapa = '';
  configResponsableId = '';
  configAccion = '';
  configHabilitado = true;

  activarProcessing = false;
  activarOk = false;

  etapaOpen = false;
  etapaNombre = '';
  etapaAccion = '';
  etapaResponsableId = '';
  etapaProcessing = false;
  etapaError = '';

  actividadOpen = false;
  actividadFase = '';
  actividadTitulo = '';
  actividadDescripcion = '';
  actividadResponsableId = '';
  actividadPrioridad: Prioridad = 'Media';
  actividadInicio = '';
  actividadFin = '';
  actividadProcessing = false;
  actividadError = '';

  prioridades: Prioridad[] = ['Alta', 'Media', 'Baja'];

  constructor(
    private proyectosApi: ProyectosApiService,
    private actividadesApi: ActividadesApiService,
    private session: SessionService,
  ) {}

  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  ngOnInit(): void {
    this.activarOk = false;
    this.loadProyectos();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get workflowEtapas(): WorkflowEtapa[] {
    return [...(this.proyecto?.proyecto_workflow ?? [])].sort((a, b) => a.orden - b.orden);
  }

  get stages(): string[] {
    return this.workflowEtapas.map((etapa) => STAGE_LABEL[etapa.etapa] ?? etapa.etapa);
  }

  get selected(): number {
    const etapas = this.workflowEtapas;
    const enCurso = etapas.findIndex((etapa) => etapa.estado === 'EnCurso');
    if (enCurso !== -1) {
      return enCurso;
    }
    if (!etapas.length) {
      return 0;
    }
    const completadas = etapas.filter((etapa) => etapa.estado === 'Completado').length;
    return Math.min(completadas, etapas.length - 1);
  }

  get progress(): number {
    const total = this.stages.length;
    return total ? Math.round(((this.selected + 1) / total) * 100) : 0;
  }

  get nextIndex(): number | null {
    for (let i = this.selected + 1; i < this.workflowEtapas.length; i++) {
      const etapa = this.workflowEtapas[i];
      const resp = this.responsabilidadPara(etapa.etapa);
      if (resp?.habilitado ?? true) {
        return i;
      }
    }
    return null;
  }

  get canAdvance(): boolean {
    const usuarioId = this.session.sesion?.user.id;
    if (
      !this.session.can('workflow', 'CambiarEstado') ||
      !this.proyecto ||
      !this.workflowEtapas.some((etapa) => etapa.estado === 'EnCurso')
    ) {
      return false;
    }

    const current = this.workflowEtapas.find((etapa) => etapa.estado === 'EnCurso');
    const responsabilidad = current ? this.responsabilidadPara(current.etapa) : undefined;

    return (
      this.proyecto.owner_id === usuarioId ||
      this.proyecto.coordinador_id === usuarioId ||
      current?.responsable_id === usuarioId ||
      responsabilidad?.responsable_id === usuarioId
    );
  }

  get canConfigure(): boolean {
    return this.session.can('workflow', 'Administrar') && this.proyecto !== null;
  }

  get currentIndex(): number {
    return this.workflowEtapas.findIndex((etapa) => etapa.estado === 'EnCurso');
  }

  get viewedResponsabilidad(): ResponsabilidadEtapa | undefined {
    return this.responsabilidadPara(this.workflowEtapas[this.viewed]?.etapa ?? '');
  }

  get skippedCount(): number {
    return this.nextIndex === null ? 0 : this.nextIndex - this.selected - 1;
  }

  get pendingApprovals(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const etapa of this.workflowEtapas) {
      if (etapa.estado !== 'Pendiente' || !etapa.dependencia) {
        continue;
      }
      const name = etapa.dependencia.nombre;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  get evidencias(): { id: string; name: string; size: string }[] {
    const raw = this.proyecto?.evidencias ?? [];
    return (raw as { id?: string; nombre?: string; archivo?: { nombre_original?: string } | null }[])
      .filter((e) => typeof e === 'object' && e !== null)
      .map((e, index) => ({
        id: String(e.id ?? `ev-${index}`),
        name: e.nombre ?? e.archivo?.nombre_original ?? 'Evidencia',
        size: '—',
      }));
  }

  get observacionesCount(): number {
    return this.proyecto?._count?.observaciones ?? 0;
  }

  get viewedInfo(): StageInfo {
    return this.info(this.viewed);
  }

  lockedTip(): string {
    const usuarioId = this.session.sesion?.user.id;
    if (!this.proyecto) {
      return 'Selecciona un proyecto para operar el workflow.';
    }
    if (!this.workflowEtapas.some((etapa) => etapa.estado === 'EnCurso')) {
      return 'El proceso no tiene una etapa en curso.';
    }
    if (
      !this.session.can('workflow', 'CambiarEstado') ||
      (usuarioId &&
        this.proyecto.owner_id !== usuarioId &&
        this.proyecto.coordinador_id !== usuarioId)
    ) {
      return 'Solo el responsable del proyecto, el coordinador o el responsable de la etapa pueden avanzar etapas. Como colaborador solo puedes trabajar tus actividades asignadas.';
    }
    return 'No tienes permiso para cambiar el estado del workflow.';
  }

  avanzar(): void {
    const proyecto = this.proyecto;
    const usuarioId = this.session.sesion?.user.id;
    if (!proyecto || !usuarioId || this.processing) {
      return;
    }
    const current = this.workflowEtapas.find((etapa) => etapa.estado === 'EnCurso');
    if (!current) {
      return;
    }
    const next = this.nextIndex !== null ? this.workflowEtapas[this.nextIndex] : null;
    this.processing = true;
    this.actionError = '';
    const now = new Date().toISOString();

    this.sub = this.proyectosApi
      .updateWorkflow(proyecto.id, current.etapa, { estado: 'Completado', completed_at: now, usuario_id: usuarioId })
      .subscribe({
        next: () => {
          if (!next) {
            this.reloadProyecto(proyecto.id);
            return;
          }
          this.sub = this.proyectosApi
            .updateWorkflow(proyecto.id, next.etapa, { estado: 'EnCurso', started_at: now, usuario_id: usuarioId })
            .subscribe({
              next: () => this.reloadProyecto(proyecto.id),
              error: () => this.failAdvance('No se pudo iniciar la siguiente etapa.'),
            });
        },
        error: () => this.failAdvance('No se pudo completar la etapa actual.'),
      });
  }

  openConfig(): void {
    const etapa = this.workflowEtapas[this.viewed];
    if (!etapa) {
      return;
    }
    const responsabilidad = this.viewedResponsabilidad;
    this.configEtapa = etapa.etapa;
    this.configResponsableId = etapa.responsable?.id ?? responsabilidad?.responsable?.id ?? '';
    this.configAccion = responsabilidad?.accion ?? etapa.accion_requerida ?? '';
    this.configHabilitado = responsabilidad?.habilitado ?? true;
    this.configOpen = true;
  }

  get responsablesDisponibles(): { id: string; nombre: string }[] {
    const proyecto = this.proyecto;
    if (!proyecto) {
      return [];
    }
    const ids = new Set<string>();
    const lista: { id: string; nombre: string }[] = [];
    for (const miembro of proyecto.proyecto_equipo ?? []) {
      const usuario = miembro.usuario;
      if (usuario && !ids.has(usuario.id)) {
        ids.add(usuario.id);
        lista.push({ id: usuario.id, nombre: usuario.nombre });
      }
    }
    const actual = this.workflowEtapas[this.viewed]?.responsable ?? this.viewedResponsabilidad?.responsable;
    if (actual && !ids.has(actual.id)) {
      ids.add(actual.id);
      lista.push({ id: actual.id, nombre: actual.nombre });
    }
    return lista;
  }

  get tieneWorkflow(): boolean {
    return this.workflowEtapas.length > 0;
  }

  get plantilla() {
    return PLANTILLA_WORKFLOW_DEFAULT;
  }

  get proyectosFiltrados(): Proyecto[] {
    const q = this.proyectoBusqueda.trim().toLowerCase();
    if (!q) {
      return this.proyectos.slice(0, 30);
    }
    return this.proyectos
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          (p.owner?.nombre ?? '').toLowerCase().includes(q) ||
          (p.coordinador?.nombre ?? '').toLowerCase().includes(q),
      )
      .slice(0, 30);
  }

  seleccionarProyecto(proyecto: Proyecto): void {
    this.proyectoBusqueda = `${proyecto.code} · ${proyecto.nombre}`;
    this.proyectoDropdownOpen = false;
    this.selectProyecto(proyecto.id);
  }

  activarWorkflow(): void {
    const proyecto = this.proyecto;
    const usuarioId = this.session.sesion?.user.id;
    if (!proyecto || !usuarioId || this.activarProcessing || this.tieneWorkflow) {
      return;
    }
    this.activarProcessing = true;
    this.actionError = '';
    this.activarOk = false;
    this.sub = this.proyectosApi
      .activarWorkflow(proyecto.id, {
        usuario_id: usuarioId,
        comentario: `Workflow activado manualmente para el proyecto ${proyecto.code}`,
      })
      .subscribe({
        next: (actualizado) => {
          this.proyecto = actualizado;
          this.activarProcessing = false;
          this.activarOk = true;
          this.viewed = 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.activarProcessing = false;
          this.actionError = err?.error?.message ?? 'No se pudo activar el workflow del proyecto.';
          this.cdr.detectChanges();
        },
      });
  }

  abrirAltaEtapa(): void {
    this.etapaOpen = true;
    this.etapaNombre = '';
    this.etapaAccion = '';
    this.etapaResponsableId = this.responsablesDisponibles[0]?.id ?? this.proyecto?.coordinador?.id ?? '';
    this.etapaError = '';
  }

  guardarEtapa(): void {
    const proyecto = this.proyecto;
    const usuarioId = this.session.sesion?.user.id;
    if (!proyecto || !usuarioId || this.etapaProcessing) {
      return;
    }
    const nombre = this.etapaNombre.trim();
    if (!nombre) {
      this.etapaError = 'Escribe el nombre de la etapa.';
      return;
    }
    this.etapaProcessing = true;
    this.etapaError = '';
    this.sub = this.proyectosApi
      .agregarEtapa(proyecto.id, {
        usuario_id: usuarioId,
        etapa: nombre,
        accion_requerida: this.etapaAccion.trim() || undefined,
        responsable_id: this.etapaResponsableId || undefined,
      })
      .subscribe({
        next: () => {
          this.etapaProcessing = false;
          this.etapaOpen = false;
          this.reloadProyecto(proyecto.id);
        },
        error: (err) => {
          this.etapaProcessing = false;
          this.etapaError = err?.error?.message ?? 'No se pudo añadir la etapa.';
          this.cdr.detectChanges();
        },
      });
  }

  abrirAltaActividad(fase: string): void {
    this.actividadOpen = true;
    this.actividadFase = fase;
    this.actividadTitulo = '';
    this.actividadDescripcion = '';
    this.actividadResponsableId = this.responsablesDisponibles[0]?.id ?? '';
    this.actividadPrioridad = 'Media';
    this.actividadInicio = '';
    this.actividadFin = '';
    this.actividadError = '';
  }

  guardarActividad(): void {
    const proyecto = this.proyecto;
    const usuarioId = this.session.sesion?.user.id;
    if (!proyecto || !usuarioId || this.actividadProcessing) {
      return;
    }
    const titulo = this.actividadTitulo.trim();
    if (!titulo) {
      this.actividadError = 'Escribe el título de la actividad.';
      return;
    }
    if (!this.actividadResponsableId) {
      this.actividadError = 'Selecciona un responsable del equipo del proyecto.';
      return;
    }
    this.actividadProcessing = true;
    this.actividadError = '';
    this.sub = this.actividadesApi
      .create({
        titulo,
        fase: this.actividadFase || undefined,
        descripcion: this.actividadDescripcion.trim() || undefined,
        proyecto_id: proyecto.id,
        responsable_id: this.actividadResponsableId,
        created_by_id: usuarioId,
        prioridad: this.actividadPrioridad,
        fecha_inicio: this.actividadInicio ? new Date(this.actividadInicio).toISOString() : undefined,
        fecha_fin_estimada: this.actividadFin ? new Date(this.actividadFin).toISOString() : undefined,
      })
      .subscribe({
        next: () => {
          this.actividadProcessing = false;
          this.actividadOpen = false;
          this.reloadProyecto(proyecto.id);
        },
        error: (err) => {
          this.actividadProcessing = false;
          this.actividadError = err?.error?.message ?? 'No se pudo crear la actividad.';
          this.cdr.detectChanges();
        },
      });
  }

  actividadesDeFase(fase: string): { id: string; titulo: string; code: string | null; estado: string; responsable: string; progreso: number }[] {
    const raw = this.proyecto?.actividades ?? [];
    return (raw as { id: string; titulo: string; code: string | null; fase: string | null; estado: string; responsable?: { nombre?: string } | null; progreso?: number }[])
      .filter((a) => (a.fase ?? '') === fase)
      .map((a) => ({
        id: a.id,
        titulo: a.titulo,
        code: a.code ?? null,
        estado: a.estado,
        responsable: a.responsable?.nombre ?? 'Sin asignar',
        progreso: a.progreso ?? 0,
      }));
  }

  prioridadBadge(prioridad: Prioridad): 'success' | 'warning' | 'error' {
    if (prioridad === 'Alta') return 'error';
    if (prioridad === 'Media') return 'warning';
    return 'success';
  }

  actividadEstadoLabel(estado: string): string {
    const etiquetas: Record<string, string> = {
      Pendiente: 'Pendiente',
      Aprobado: 'Aprobado',
      EnCurso: 'En curso',
      Terminado: 'Terminada',
      EnRevision: 'En revisión',
      Completado: 'Completada',
    };
    return etiquetas[estado] ?? estado;
  }

  actividadBadge(estado: string): 'success' | 'warning' | 'light' {
    if (estado === 'Completado' || estado === 'Terminado') return 'success';
    if (estado === 'EnCurso' || estado === 'EnRevision') return 'warning';
    return 'light';
  }

  saveConfig(): void {
    const proyecto = this.proyecto;
    if (!proyecto || this.processing) {
      return;
    }
    this.processing = true;
    this.actionError = '';
    const dto: Record<string, unknown> = {};
    if (this.configResponsableId) {
      dto['responsable_id'] = this.configResponsableId;
    }
    if (this.configAccion.trim()) {
      dto['accion_requerida'] = this.configAccion.trim();
    }
    this.sub = this.proyectosApi.updateWorkflow(proyecto.id, this.configEtapa, dto).subscribe({
      next: () => {
        if (!this.viewedResponsabilidad) {
          this.configOpen = false;
          this.reloadProyecto(proyecto.id);
          return;
        }
        const respDto: Record<string, unknown> = { habilitado: this.configHabilitado };
        if (this.configResponsableId) {
          respDto['responsable_id'] = this.configResponsableId;
        }
        if (this.configAccion.trim()) {
          respDto['accion'] = this.configAccion.trim();
        }
        this.sub = this.proyectosApi
          .updateResponsabilidad(proyecto.id, this.configEtapa, respDto)
          .subscribe({
            next: () => {
              this.configOpen = false;
              this.reloadProyecto(proyecto.id);
            },
            error: () => this.failAdvance('Se guardó la etapa, pero no la regla de responsabilidad.'),
          });
      },
      error: () => this.failAdvance('No se pudo configurar la etapa.'),
    });
  }

  private reloadProyecto(id: string): void {
    this.processing = false;
    this.proyectosApi.findOne(id).subscribe({
      next: (proyecto) => {
        this.proyecto = proyecto;
        if (this.viewed >= this.workflowEtapas.length) {
          this.viewed = Math.max(0, this.workflowEtapas.length - 1);
        }
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private failAdvance(message: string): void {
    this.processing = false;
    this.actionError = message;
    this.cdr.detectChanges();
  }

  etapaLabel(etapa: string): string {
    return STAGE_LABEL[etapa as EstadoProyecto] ?? etapa;
  }

  info(index: number): StageInfo {
    const etapa = this.workflowEtapas[index];
    if (!etapa) {
      return { responsible: 'Sin asignar', date: '—', note: '—' };
    }
    return {
      responsible: etapa.responsable?.nombre ?? 'Sin asignar',
      date: this.fmt(etapa.completed_at ?? etapa.started_at),
      note: etapa.accion_requerida ?? '—',
    };
  }

  stageState(index: number): 'done' | 'current' | 'pending' {
    if (index < this.selected) {
      return 'done';
    }
    if (index === this.selected) {
      return 'current';
    }
    return 'pending';
  }

  view(index: number): void {
    this.viewed = index;
  }

  ruleEnabled(index: number): boolean {
    return this.responsabilidadPara(this.workflowEtapas[index]?.etapa ?? '')?.habilitado ?? true;
  }

  fmt(value?: string | null): string {
    return value ? new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—';
  }

  selectProyecto(id: string): void {
    this.selectedProyectoId = id;
    this.viewed = 0;
    this.loading = true;
    this.actionError = '';
    this.activarOk = false;
    const elegido = this.proyectos.find((p) => p.id === id);
    if (elegido) {
      this.proyectoBusqueda = `${elegido.code} · ${elegido.nombre}`;
    }
    this.proyectosApi.findOne(id).subscribe({
      next: (proyecto) => {
        this.proyecto = proyecto;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.proyecto = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private responsabilidadPara(etapa: string): ResponsabilidadEtapa | undefined {
    return this.proyecto?.proyecto_responsabilidades.find((r) => r.etapa === etapa);
  }

  private loadProyectos(): void {
    const usuarioId = this.session.sesion?.user.id;
    this.sub?.unsubscribe();
    this.sub = fetchAllPages<Proyecto>((page, limit) =>
      this.proyectosApi.findAll({ page, limit, usuario_id: usuarioId }),
    ).subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos;
        if (!this.selectedProyectoId && this.proyectos.length) {
          this.selectProyecto(this.proyectos[0].id);
        }
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}