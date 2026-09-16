import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { DropdownComponent } from '../../../shared/components/ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../shared/components/ui/dropdown/dropdown-item/dropdown-item.component';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { SessionService } from '../../../core/services/session.service';
import { fetchAllPages } from '../../../core/services/pagination';
import { EstadoProyecto, Prioridad, Proyecto } from '../../../core/models/proyecto.model';

interface KanbanColumn {
  status: EstadoProyecto;
  label: string;
  description: string;
  dotColor: string;
  headerBg: string;
}

const STATUS_LABEL: Record<EstadoProyecto, string> = {
  Pendiente: 'Pendiente',
  Aprobado: 'Aprobado',
  EnCurso: 'En curso',
  Implementado: 'Implementado',
  EnRevision: 'En revisión',
  Completado: 'Completado',
};

const TRANSICIONES: Record<EstadoProyecto, { estado: EstadoProyecto; accion: string }[]> = {
  Pendiente: [{ estado: 'Aprobado', accion: 'Aprobar' }],
  Aprobado: [
    { estado: 'EnCurso', accion: 'CambiarEstado' },
    { estado: 'Pendiente', accion: 'CambiarEstado' },
  ],
  EnCurso: [{ estado: 'Implementado', accion: 'CambiarEstado' }],
  Implementado: [{ estado: 'EnRevision', accion: 'CambiarEstado' }],
  EnRevision: [
    { estado: 'Completado', accion: 'Completar' },
    { estado: 'EnCurso', accion: 'CambiarEstado' },
  ],
  Completado: [],
};

@Component({
  selector: 'app-dasi-kanban',
  imports: [
    FormsModule,
    DasiModuleHeaderComponent,
    BadgeComponent,
    ModalComponent,
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './kanban.component.html',
})
export class KanbanComponent implements OnInit {
  proyectos: Proyecto[] = [];
  loading = true;

  open = '';
  draggedProyecto: Proyecto | null = null;
  dragOverStatus: EstadoProyecto | null = null;

  moverOpen = false;
  moverProyecto: Proyecto | null = null;
  moverTarget: EstadoProyecto | null = null;
  moverPermitido = false;
  moverMotivo = '';
  moverAccion = '';
  moverError = '';
  moverProcesando = false;

  search = '';
  filterResponsable = '';
  filterPrioridad = '';
  filterEstado = '';

  prioridades: Prioridad[] = ['Alta', 'Media', 'Baja'];

  columns: KanbanColumn[] = [
    { status: 'Pendiente', label: 'Pendiente', description: 'En espera de aprobación', dotColor: 'bg-gray-400', headerBg: 'bg-gray-50 dark:bg-gray-800/50' },
    { status: 'Aprobado', label: 'Aprobado', description: 'Autorizado, pendiente de inicio', dotColor: 'bg-blue-500', headerBg: 'bg-blue-50/80 dark:bg-blue-500/10' },
    { status: 'EnCurso', label: 'En curso', description: 'Proyectos actualmente en ejecución', dotColor: 'bg-amber-500', headerBg: 'bg-amber-50/80 dark:bg-amber-500/10' },
    { status: 'Implementado', label: 'Implementado', description: 'Implementación registrada, a revisión', dotColor: 'bg-orange-500', headerBg: 'bg-orange-50/80 dark:bg-orange-500/10' },
    { status: 'EnRevision', label: 'En revisión', description: 'Esperando revisión y cierre', dotColor: 'bg-yellow-500', headerBg: 'bg-yellow-50/80 dark:bg-yellow-500/10' },
    { status: 'Completado', label: 'Completado', description: 'Proyectos revisados y cerrados', dotColor: 'bg-emerald-500', headerBg: 'bg-emerald-50/80 dark:bg-emerald-500/10' },
  ];

  constructor(private proyectosApi: ProyectosApiService, private session: SessionService, private router: Router) {}

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadProyectos();
  }

  get total(): number {
    return this.filtered.length;
  }

  get pendingCount(): number {
    return this.filtered.filter((p) => p.estado === 'Pendiente' || p.estado === 'Aprobado').length;
  }

  get inProgressCount(): number {
    return this.filtered.filter((p) => p.estado === 'EnCurso' || p.estado === 'Implementado').length;
  }

  get reviewCount(): number {
    return this.filtered.filter((p) => p.estado === 'EnRevision').length;
  }

  get completedCount(): number {
    return this.filtered.filter((p) => p.estado === 'Completado').length;
  }

  get responsables(): string[] {
    return [...new Set(this.proyectos.map((p) => p.owner?.nombre).filter((n): n is string => !!n))];
  }

  get filtered(): Proyecto[] {
    let items = this.proyectos;
    if (this.search) {
      const q = this.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.owner?.nombre ?? '').toLowerCase().includes(q) ||
          (p.dependencia?.nombre ?? '').toLowerCase().includes(q),
      );
    }
    if (this.filterResponsable) {
      items = items.filter((p) => p.owner?.nombre === this.filterResponsable);
    }
    if (this.filterPrioridad) {
      items = items.filter((p) => p.prioridad === this.filterPrioridad);
    }
    if (this.filterEstado) {
      items = items.filter((p) => p.estado === this.filterEstado);
    }
    return items;
  }

  cards(status: EstadoProyecto): Proyecto[] {
    return this.filtered.filter((p) => p.estado === status);
  }

  statusLabel(status: EstadoProyecto): string {
    return STATUS_LABEL[status] ?? status;
  }

  nextTransiciones(status: EstadoProyecto): { estado: EstadoProyecto; accion: string }[] {
    return TRANSICIONES[status] ?? [];
  }

  puedeCambiar(proyecto: Proyecto, next: EstadoProyecto): boolean {
    const trans = this.nextTransiciones(proyecto.estado).find((t) => t.estado === next);
    const accion = trans?.accion ?? 'CambiarEstado';
    if (accion === 'Aprobar') {
      return this.session.can('proyectos', 'Aprobar');
    }
    if (accion === 'Completar') {
      return this.session.can('proyectos', 'Completar');
    }
    return this.session.can('proyectos', 'CambiarEstado');
  }

  priorityBadge(prioridad: Prioridad): 'success' | 'warning' | 'error' {
    if (prioridad === 'Alta') return 'error';
    if (prioridad === 'Media') return 'warning';
    return 'success';
  }

  projectBadge(estado: string): 'success' | 'warning' | 'error' {
    if (estado === 'Completado' || estado === 'Implementado') return 'success';
    if (estado === 'EnRevision') return 'error';
    return 'warning';
  }

  initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  fmt(value?: string | null): string {
    return value ? new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—';
  }

  esTarjetaArrastrada(proyecto: Proyecto): boolean {
    return this.draggedProyecto?.id === proyecto.id;
  }

  esDropLegal(status: EstadoProyecto): boolean {
    const proyecto = this.draggedProyecto;
    if (!proyecto) {
      return false;
    }
    return this.nextTransiciones(proyecto.estado).some((t) => t.estado === status) && this.puedeCambiar(proyecto, status);
  }

  motivoMovimiento(proyecto: Proyecto | null, target: EstadoProyecto | null): { permitido: boolean; motivo: string; accion: string } {
    if (!proyecto || !target) {
      return { permitido: false, motivo: 'No se puede mover: faltan datos del proyecto.', accion: '' };
    }
    if (proyecto.estado === target) {
      return { permitido: false, motivo: `El proyecto ya se encuentra en “${STATUS_LABEL[target]}”.`, accion: '' };
    }
    const trans = this.nextTransiciones(proyecto.estado).find((t) => t.estado === target);
    if (!trans) {
      return {
        permitido: false,
        motivo: `El flujo institucional no permite pasar de “${STATUS_LABEL[proyecto.estado]}” a “${STATUS_LABEL[target]}”.`,
        accion: '',
      };
    }
    if (!this.puedeCambiar(proyecto, target)) {
      return {
        permitido: false,
        motivo: `No tienes permiso para ejecutar “${trans.accion}” sobre el módulo de proyectos.`,
        accion: trans.accion,
      };
    }
    return { permitido: true, motivo: '', accion: trans.accion };
  }

  onDragStart(proyecto: Proyecto): void {
    this.draggedProyecto = proyecto;
  }

  onDragEnd(): void {
    this.draggedProyecto = null;
    this.dragOverStatus = null;
  }

  onDragEnter(status: EstadoProyecto): void {
    if (this.draggedProyecto) {
      this.dragOverStatus = status;
    }
  }

  onDragLeave(): void {
    this.dragOverStatus = null;
  }

  onDrop(status: EstadoProyecto, event: Event): void {
    event.preventDefault();
    if (this.draggedProyecto) {
      this.abrirMover(this.draggedProyecto, status);
    }
    this.draggedProyecto = null;
    this.dragOverStatus = null;
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  abrirMover(proyecto: Proyecto, next: EstadoProyecto): void {
    const motivo = this.motivoMovimiento(proyecto, next);
    this.moverProyecto = proyecto;
    this.moverTarget = next;
    this.moverPermitido = motivo.permitido;
    this.moverMotivo = motivo.motivo;
    this.moverAccion = motivo.accion;
    this.moverError = '';
    this.moverOpen = true;
  }

  cambiar(proyecto: Proyecto, next: EstadoProyecto): void {
    this.abrirMover(proyecto, next);
    this.open = '';
  }

  cerrarMover(): void {
    if (this.moverProcesando) {
      return;
    }
    this.moverOpen = false;
    this.moverProyecto = null;
    this.moverTarget = null;
    this.moverPermitido = false;
    this.moverMotivo = '';
    this.moverAccion = '';
    this.moverError = '';
  }

  confirmarMover(): void {
    const proyecto = this.moverProyecto;
    const next = this.moverTarget;
    if (!proyecto || !next) {
      return;
    }
    this.moverProcesando = true;
    this.moverError = '';
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId) {
      this.moverError = 'No se pudo identificar al usuario en sesión.';
      this.moverProcesando = false;
      return;
    }
    this.proyectosApi.cambiarEstado(proyecto.id, { estado: next, usuario_id: usuarioId }).subscribe({
      next: () => {
        this.moverProcesando = false;
        this.moverOpen = false;
        this.moverProyecto = null;
        this.moverTarget = null;
        this.moverPermitido = false;
        this.moverMotivo = '';
        this.moverAccion = '';
        this.moverError = '';
        this.loadProyectos();
      },
      error: (err) => {
        this.moverProcesando = false;
        this.moverError = err?.error?.message ?? 'Ocurrió un error al cambiar el estado del proyecto.';
      },
    });
  }

  abrirDetalle(proyecto: Proyecto): void {
    this.router.navigate(['/proyectos', proyecto.id]);
  }

  clearFilters(): void {
    this.search = '';
    this.filterResponsable = '';
    this.filterPrioridad = '';
    this.filterEstado = '';
  }

  private loadProyectos(): void {
    this.loading = true;
    fetchAllPages((page, limit) =>
      this.proyectosApi.findAll({ page, limit, usuario_id: this.session.sesion?.user.id }),
    ).subscribe({
      next: (data) => {
        this.proyectos = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.proyectos = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}