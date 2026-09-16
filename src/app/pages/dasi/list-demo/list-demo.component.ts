import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { DasiDetailModalComponent } from '../../../shared/components/dasi/detail-modal/detail-modal.component';
import { DasiActivityModalComponent } from '../../../shared/components/dasi/activity-modal/activity-modal.component';
import { DasiProjectModalComponent } from '../../../shared/components/dasi/project-modal/project-modal.component';
import { DasiCreateModalComponent, CreateKind } from '../../../shared/components/dasi/create-modal/create-modal.component';
import { SessionService } from '../../../core/services/session.service';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { ActividadesApiService } from '../../../core/services/actividades-api.service';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { Proyecto, ProyectoQuery } from '../../../core/models/proyecto.model';
import { Actividad, ActividadQuery, EstadoActividad } from '../../../core/models/actividad.model';
import { Usuario, UsuarioQuery, EstadoUsuario } from '../../../core/models/usuario.model';
import { ApiError } from '../../../core/services/api.service';

type Kind = 'projects' | 'my-projects' | 'my-office' | 'collaborating' | 'tasks' | 'activities' | 'users';

interface Row {
  id: string;
  title: string;
  related: string;
  owner: string;
  date: string;
  status: string;
  priority: string;
  progress?: number;
}

interface EstadoOpcion {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dasi-list-demo',
  imports: [FormsModule, BadgeComponent, DasiModuleHeaderComponent, DasiDetailModalComponent, DasiActivityModalComponent, DasiProjectModalComponent, DasiCreateModalComponent],
  templateUrl: './list-demo.component.html',
})
export class ListDemoComponent implements OnInit, OnDestroy {
  readonly kind: Kind;
  searchQuery = '';
  statusFilter = 'Todos';
  selected: Row | null = null;
  selectedTaskId = '';
  projectOpen = false;
  createKind: CreateKind | null = null;

  proyectos: Proyecto[] = [];
  actividades: Actividad[] = [];
  usuarios: Usuario[] = [];
  accessDenied = '';
  loadError = '';

  private readonly cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;

  readonly config: Record<Kind, { title: string; description: string; action: string }> = {
    projects: { title: 'Proyectos', description: 'Gestión visual de iniciativas institucionales.', action: 'Nuevo proyecto' },
    'my-projects': { title: 'Mis proyectos', description: 'Proyectos asignados al usuario autenticado.', action: 'Ver calendario' },
    'my-office': { title: 'Proyectos de mi oficina', description: 'Proyectos de la dependencia del usuario.', action: '' },
    collaborating: { title: 'Donde colaboro', description: 'Proyectos en los que el usuario participa como colaborador.', action: '' },
    tasks: { title: 'Tareas', description: 'Control visual de tareas institucionales.', action: 'Nueva tarea' },
    activities: { title: 'Actividades', description: 'Seguimiento de actividades programadas.', action: 'Nueva actividad' },
    users: { title: 'Usuarios', description: 'Directorio visual de usuarios del sistema.', action: 'Nuevo usuario' },
  };

  private readonly proyectoEstados: EstadoOpcion[] = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Aprobado', label: 'Aprobado' },
    { value: 'EnCurso', label: 'En curso' },
    { value: 'Implementado', label: 'Implementado' },
    { value: 'EnRevision', label: 'En revisión' },
    { value: 'Completado', label: 'Completado' },
  ];

  private readonly actividadEstados: EstadoOpcion[] = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Aprobado', label: 'Aprobado' },
    { value: 'EnCurso', label: 'En curso' },
    { value: 'Terminado', label: 'Terminado' },
    { value: 'EnRevision', label: 'En revisión' },
    { value: 'Completado', label: 'Completado' },
  ];

  constructor(
    route: ActivatedRoute,
    private readonly session: SessionService,
    private readonly proyectosApi: ProyectosApiService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly usuariosApi: UsuariosApiService,
    private readonly router: Router,
  ) {
    this.kind = route.snapshot.data['kind'] as Kind;
  }

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get page() {
    return this.config[this.kind];
  }

  get headerAction(): string {
    if (this.kind === 'my-projects' && this.session.can('proyectos', 'Ver')) {
      return this.page.action;
    }
    if (this.kind === 'my-office' || this.kind === 'collaborating') {
      return '';
    }
    if (this.isProjectKind) {
      return this.session.can('proyectos', 'Crear') ? this.page.action : '';
    }
    if (this.kind === 'tasks') {
      return this.session.can('tareas', 'Crear') ? this.page.action : '';
    }
    if (this.kind === 'activities') {
      return this.session.can('actividades', 'Crear') ? this.page.action : '';
    }
    if (this.kind === 'users') {
      return this.session.can('usuarios', 'Crear') ? this.page.action : '';
    }
    return '';
  }

  get isProjectKind(): boolean {
    return (
      this.kind === 'projects' ||
      this.kind === 'my-projects' ||
      this.kind === 'my-office' ||
      this.kind === 'collaborating'
    );
  }

  get isTaskKind(): boolean {
    return this.kind === 'tasks' || this.kind === 'activities';
  }

  get statuses(): string[] {
    if (this.kind === 'users') {
      return ['Activo', 'Inactivo'];
    }
    if (this.isProjectKind) {
      return this.proyectoEstados.map((e) => e.label);
    }
    if (this.isTaskKind) {
      return this.actividadEstados.map((e) => e.label);
    }
    return [];
  }

  get statusOptions(): string[] {
    return ['Todos', ...this.statuses];
  }

  get metrics(): string[] {
    if (this.isProjectKind) {
      const total = this.proyectos.length;
      const risk = this.proyectos.filter((p) => p.riesgo).length;
      const late = this.proyectos.filter((p) => this.isOverdueProject(p)).length;
      const avg = total ? Math.round(this.proyectos.reduce((sum, p) => sum + p.progreso, 0) / total) : 0;
      return [`${total} proyectos`, `${risk} en riesgo · ${late} vencidos`, `${avg}% avance promedio`];
    }
    if (this.isTaskKind) {
      const pending = this.actividades.filter((t) => t.estado === 'Pendiente').length;
      const done = this.actividades.filter((t) => t.estado === 'Completado').length;
      const review = this.actividades.filter((t) => t.estado === 'EnRevision').length;
      return [`${pending} pendientes`, `${review} en revisión`, `${done} completadas`];
    }
    const active = this.usuarios.filter((u) => u.estado === 'Activo').length;
    const roles = new Set(this.usuarios.flatMap((u) => u.usuario_roles.map((ur) => ur.rol?.nombre))).size;
    return [`${active} activos`, `${this.usuarios.length - active} inactivos`, `${roles} roles`];
  }

  get rows(): Row[] {
    switch (this.kind) {
      case 'projects':
      case 'my-projects':
      case 'my-office':
      case 'collaborating':
        return this.proyectos.map((p) => this.projectRow(p));
      case 'tasks':
      case 'activities':
        return this.actividades.map((t) => this.taskRow(t));
      case 'users':
        return this.usuarios.map((u): Row => ({
          id: u.id,
          title: u.nombre,
          related: u.email,
          owner: u.usuario_roles[0]?.rol?.nombre ?? '—',
          date: u.dependencia?.nombre ?? '—',
          status: u.estado,
          priority: 'Usuario',
        }));
      default:
        return [];
    }
  }

  get filtered(): Row[] {
    let result = this.rows;
    if (this.statusFilter !== 'Todos') {
      result = result.filter((r) => r.status === this.statusFilter);
    }
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.related.toLowerCase().includes(query) ||
          r.owner.toLowerCase().includes(query),
      );
    }
    return result;
  }

  badge(status: string): 'success' | 'warning' | 'error' {
    const success = ['Completado', 'Implementado', 'Aprobado', 'Activo'];
    const error = ['Vencida', 'Inactivo', 'Observada'];
    if (success.includes(status)) {
      return 'success';
    }
    if (error.includes(status)) {
      return 'error';
    }
    return 'warning';
  }

  openDetail(row: Row): void {
    if (this.isProjectKind) {
      this.router.navigate(['/proyectos', row.id]);
      return;
    }
    if (this.isTaskKind) {
      this.selectedTaskId = row.id;
      return;
    }
    if (this.kind === 'users') {
      this.selected = row;
      return;
    }
    this.selected = row;
  }

  toggleStatus(row: Row): void {
    if (this.isSelf(row)) {
      return;
    }
    this.sub = this.usuariosApi.toggleEstado(row.id).subscribe({
      next: () => this.reload(),
      error: () => undefined,
    });
  }

  isSelf(row: Row): boolean {
    return row.id === this.session.sesion?.user.id;
  }

  hasProgress(): boolean {
    return this.isProjectKind || this.isTaskKind;
  }

  action(): void {
    if (this.kind === 'my-projects') {
      this.router.navigate(['/calendar']);
      return;
    }
    if (this.kind === 'my-office' || this.kind === 'collaborating') {
      return;
    }
    if (this.isProjectKind) {
      this.projectOpen = true;
      return;
    }
    if (this.kind === 'users') {
      this.createKind = 'usuario';
      return;
    }
    this.createKind = 'actividad';
  }

  created(id: string): void {
    this.reload();
  }

  reload(): void {
    this.sub?.unsubscribe();
    switch (this.kind) {
      case 'projects':
        this.sub = this.proyectosApi.findAll(this.proyectoQuery()).subscribe({
          next: (res) => this.setProyectos(res.data),
          error: (err) => this.handleProyectosError(err),
        });
        break;
      case 'my-projects':
        this.sub = this.proyectosApi.findAll(this.proyectoQuery('mis')).subscribe({
          next: (res) => this.setProyectos(res.data),
          error: (err) => this.handleProyectosError(err),
        });
        break;
      case 'my-office':
        this.sub = this.proyectosApi.findAll(this.proyectoQuery('oficina')).subscribe({
          next: (res) => this.setProyectos(res.data),
          error: (err) => this.handleProyectosError(err),
        });
        break;
      case 'collaborating':
        this.sub = this.proyectosApi.findAll(this.proyectoQuery('colaboro')).subscribe({
          next: (res) => this.setProyectos(res.data),
          error: (err) => this.handleProyectosError(err),
        });
        break;
      case 'tasks':
      case 'activities':
        this.sub = this.actividadesApi.findAll(this.actividadQuery()).subscribe({
          next: (res) => {
            this.actividades = res.data;
            this.cdr.detectChanges();
          },
          error: () => {
            this.actividades = [];
            this.cdr.detectChanges();
          },
        });
        break;
      case 'users':
        this.sub = this.usuariosApi.findAll(this.usuarioQuery()).subscribe({
          next: (res) => {
            this.usuarios = res.data;
            this.cdr.detectChanges();
          },
          error: () => {
            this.usuarios = [];
            this.cdr.detectChanges();
          },
        });
        break;
    }
  }

  private setProyectos(data: Proyecto[]): void {
    this.proyectos = data;
    this.accessDenied = '';
    this.loadError = '';
    this.cdr.detectChanges();
  }

  private handleProyectosError(err: unknown): void {
    this.proyectos = [];
    if (err instanceof ApiError && err.status === 403) {
      this.accessDenied =
        'No tienes permiso para ver estos proyectos. Solicita el permiso correspondiente al administrador.';
      this.loadError = '';
    } else {
      this.accessDenied = '';
      this.loadError = 'No se pudieron cargar los datos. Verifica la conexión con el backend.';
    }
    this.cdr.detectChanges();
  }

  private proyectoQuery(tag?: 'mis' | 'oficina' | 'colaboro'): ProyectoQuery {
    const q: ProyectoQuery = { limit: 100, usuario_id: this.session.sesion?.user.id };
    const search = this.searchQuery.trim();
    if (search) {
      q.search = search;
    }
    if (this.statusFilter !== 'Todos') {
      const value = this.statusValueFor(this.statusFilter);
      if (value) {
        q.estado = value;
      }
    }
    if (tag) {
      q.usuario_id = this.session.sesion?.user.id;
      if (tag === 'mis') {
        q.mis = 'true';
      } else if (tag === 'oficina') {
        q.oficina = 'true';
      } else {
        q.colaboro = 'true';
      }
    }
    return q;
  }

  private actividadQuery(): ActividadQuery {
    const q: ActividadQuery = { limit: 100, usuario_id: this.session.sesion?.user.id };
    const search = this.searchQuery.trim();
    if (search) {
      q.search = search;
    }
    if (this.statusFilter !== 'Todos') {
      const value = this.statusValueFor(this.statusFilter);
      if (value) {
        q.estado = value as EstadoActividad;
      }
    }
    return q;
  }

  private usuarioQuery(): UsuarioQuery {
    const q: UsuarioQuery = { limit: 100 };
    const search = this.searchQuery.trim();
    if (search) {
      q.search = search;
    }
    if (this.statusFilter !== 'Todos') {
      q.estado = this.statusFilter as EstadoUsuario;
    }
    return q;
  }

  private statusValueFor(label: string): string | undefined {
    const list = this.isProjectKind ? this.proyectoEstados : this.actividadEstados;
    return list.find((e) => e.label === label)?.value;
  }

  private isOverdueProject(p: Proyecto): boolean {
    if (p.estado === 'Completado' || p.estado === 'Implementado') {
      return false;
    }
    if (!p.fecha_fin_estimada) {
      return false;
    }
    const due = new Date(p.fecha_fin_estimada).getTime();
    return !Number.isNaN(due) && due < Date.now();
  }

  private projectRow(p: Proyecto): Row {
    return {
      id: p.id,
      title: p.nombre,
      related: `${p.code} · ${p.dependencia?.nombre ?? '—'}`,
      owner: p.owner?.nombre ?? '—',
      date: this.formatDate(p.fecha_fin_estimada),
      status: this.proyectoLabel(p.estado),
      priority: p.prioridad,
      progress: p.progreso,
    };
  }

  private taskRow(t: Actividad): Row {
    return {
      id: t.id,
      title: t.titulo,
      related: t.proyecto?.nombre ?? '—',
      owner: t.responsable?.nombre ?? '—',
      date: this.formatDate(t.fecha_fin_estimada),
      status: this.actividadLabel(t.estado),
      priority: t.prioridad,
      progress: t.progreso,
    };
  }

  private proyectoLabel(estado: string): string {
    return this.proyectoEstados.find((e) => e.value === estado)?.label ?? estado;
  }

  private actividadLabel(estado: EstadoActividad): string {
    return this.actividadEstados.find((e) => e.value === estado)?.label ?? estado;
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}