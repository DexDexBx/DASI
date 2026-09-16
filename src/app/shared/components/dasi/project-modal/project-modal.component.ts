import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../ui/modal/modal.component';
import { SessionService } from '../../../../core/services/session.service';
import { DependenciasApiService } from '../../../../core/services/dependencias-api.service';
import { ProyectosApiService } from '../../../../core/services/proyectos-api.service';
import { UsuariosApiService } from '../../../../core/services/usuarios-api.service';
import { fetchAllPages } from '../../../../core/services/pagination';
import { Dependencia } from '../../../../core/models/dependencia.model';
import { Prioridad } from '../../../../core/models/proyecto.model';

interface UsuarioLite {
  id: string;
  nombre: string;
  dependencia_id: string | null;
  dependencia: { id: string; nombre: string } | null;
}

@Component({
  selector: 'app-dasi-project-modal',
  imports: [FormsModule, ModalComponent],
  templateUrl: './project-modal.component.html',
})
export class DasiProjectModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();

  step = 1;
  newName = '';
  newDependencia = '';
  newOwnerId = '';
  newCoordinadorId = '';
  newPriority: Prioridad = 'Media';
  newDescription = '';
  newFinEstimada = '';
  newFechaInicio = '';
  newDependenciasColab: string[] = [];
  newEquipo: string[] = [];
  usuarioSearch = '';
  priorities: Prioridad[] = ['Alta', 'Media', 'Baja'];
  dependencias: Dependencia[] = [];
  usuarios: UsuarioLite[] = [];
  errorMsg = '';

  private sub?: Subscription;
  private usersSub?: Subscription;

  constructor(
    private readonly session: SessionService,
    private readonly dependenciasApi: DependenciasApiService,
    private readonly proyectosApi: ProyectosApiService,
    private readonly usuariosApi: UsuariosApiService,
  ) {}

  ngOnInit(): void {
    const sesion = this.session.sesion;
    this.newDependencia = sesion?.dependencia?.id ?? '';
    this.newOwnerId = sesion?.user.id ?? '';
    this.newCoordinadorId = sesion?.user.id ?? '';
    this.sub = this.dependenciasApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.dependencias = res.data.filter((d) => d.activa);
        const dependenciaId = this.session.sesion?.dependencia?.id;
        this.newDependencia =
          dependenciaId && this.dependencias.some((d) => d.id === dependenciaId)
            ? dependenciaId
            : this.newDependencia;
      },
      error: (err) => {
        this.errorMsg = 'No se pudieron cargar las dependencias.';
        console.error('DASI: error al cargar dependencias', err);
      },
    });
    this.usersSub = fetchAllPages((page, limit) =>
      this.usuariosApi.findAll({ estado: 'Activo', page, limit }),
    ).subscribe({
      next: (data) => {
        this.usuarios = data.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          dependencia_id: u.dependencia_id,
          dependencia: u.dependencia ? { id: u.dependencia.id, nombre: u.dependencia.nombre } : null,
        }));
      },
      error: (err) => {
        this.errorMsg = 'No se pudieron cargar los colaboradores.';
        console.error('DASI: error al cargar usuarios', err);
      },
    });
  }

  get dependenciaNombre(): string {
    return this.dependencias.find((d) => d.id === this.newDependencia)?.nombre ?? '—';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.step = 1;
    }
  }

  get dependenciasColabOptions(): Dependencia[] {
    return this.dependencias.filter(
      (d) => d.id !== this.newDependencia && !this.newDependenciasColab.includes(d.id),
    );
  }

  get dependenciasPermitidasId(): string[] {
    return [this.newDependencia, ...this.newDependenciasColab].filter(Boolean);
  }

  get participantes(): UsuarioLite[] {
    const permitidas = new Set(this.dependenciasPermitidasId);
    const q = this.usuarioSearch.trim().toLowerCase();
    return this.usuarios
      .filter((u) => u.dependencia_id && permitidas.has(u.dependencia_id))
      .filter(
        (u) =>
          !q ||
          u.nombre.toLowerCase().includes(q) ||
          (u.dependencia?.nombre ?? '').toLowerCase().includes(q),
      );
  }

  get responsableCandidatos(): UsuarioLite[] {
    return this.participantes;
  }

  get equipoCandidatos(): UsuarioLite[] {
    const yo = this.session.sesion?.user.id;
    return this.participantes.filter((u) => u.id !== yo);
  }

  get equipoSeleccionado(): string {
    if (this.newEquipo.length === 0) {
      return '—';
    }
    return this.usuarios
      .filter((u) => this.newEquipo.includes(u.id))
      .map((u) => u.nombre)
      .join(', ');
  }

  toggleDependenciaColab(id: string): void {
    if (this.newDependenciasColab.includes(id)) {
      this.newDependenciasColab = this.newDependenciasColab.filter((d) => d !== id);
      this.newEquipo = this.newEquipo.filter(
        (uid) => this.usuarios.find((u) => u.id === uid)?.dependencia_id !== id,
      );
    } else {
      this.newDependenciasColab = [...this.newDependenciasColab, id];
    }
  }

  toggleEquipo(id: string): void {
    if (this.newEquipo.includes(id)) {
      this.newEquipo = this.newEquipo.filter((x) => x !== id);
    } else {
      this.newEquipo = [...this.newEquipo, id];
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.usersSub?.unsubscribe();
  }

  submit(): void {
    if (!this.newName.trim()) {
      return;
    }

    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId) {
      this.errorMsg = 'No hay una sesión activa.';
      console.error('DASI: sin sesión activa al crear proyecto');
      return;
    }

    if (!this.newOwnerId || !this.newCoordinadorId) {
      this.errorMsg = 'Seleccione responsable y coordinador.';
      return;
    }

    this.errorMsg = '';
    this.sub?.unsubscribe();
    this.sub = this.proyectosApi
      .create({
        code: this.generateCode(),
        nombre: this.newName,
        descripcion: this.newDescription || undefined,
        prioridad: this.newPriority,
        owner_id: this.newOwnerId,
        coordinador_id: this.newCoordinadorId,
        created_by_id: usuarioId,
        dependencia_id: this.newDependencia,
        equipo: this.newEquipo.length ? this.newEquipo : undefined,
        dependencias: this.newDependenciasColab.length ? this.newDependenciasColab : undefined,
        fecha_inicio: this.newFechaInicio || undefined,
        fecha_fin_estimada: this.newFinEstimada || undefined,
      })
      .subscribe({
        next: (proyecto) => {
          this.created.emit(proyecto.id);
          this.newName = '';
          this.newDescription = '';
          this.newPriority = 'Media';
          this.newFinEstimada = '';
          this.newFechaInicio = '';
          this.newDependenciasColab = [];
          this.newEquipo = [];
          this.usuarioSearch = '';
          this.newOwnerId = usuarioId;
          this.newCoordinadorId = usuarioId;
          this.step = 1;
          this.close.emit();
        },
        error: (err) => {
          this.errorMsg =
            err instanceof Error ? err.message : 'No se pudo crear el proyecto.';
          console.error('DASI: error al crear proyecto', err);
        },
      });
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PRY-${code}`;
  }
}