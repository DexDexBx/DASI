import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../ui/modal/modal.component';
import { SessionService } from '../../../../core/services/session.service';
import { ProyectosApiService } from '../../../../core/services/proyectos-api.service';
import { ActividadesApiService } from '../../../../core/services/actividades-api.service';
import { UsuariosApiService } from '../../../../core/services/usuarios-api.service';
import { DependenciasApiService } from '../../../../core/services/dependencias-api.service';
import { CargosApiService } from '../../../../core/services/cargos-api.service';
import { RolesApiService } from '../../../../core/services/roles-api.service';
import { Proyecto, Prioridad } from '../../../../core/models/proyecto.model';
import { Usuario } from '../../../../core/models/usuario.model';
import { Dependencia } from '../../../../core/models/dependencia.model';
import { Cargo } from '../../../../core/models/cargo.model';
import { Rol } from '../../../../core/models/rol.model';

export type CreateKind = 'actividad' | 'usuario';

@Component({
  selector: 'app-dasi-create-modal',
  imports: [FormsModule, ModalComponent],
  templateUrl: './create-modal.component.html',
})
export class DasiCreateModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() kind: CreateKind = 'actividad';
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();

  proyectos: Proyecto[] = [];
  usuarios: Usuario[] = [];
  dependencias: Dependencia[] = [];
  cargos: Cargo[] = [];
  roles: Rol[] = [];

  titulo = '';
  descripcion = '';
  proyectoId = '';
  responsableId = '';
  prioridad: Prioridad = 'Media';
  fechaFin = '';
  prioridades: Prioridad[] = ['Alta', 'Media', 'Baja'];

  nombre = '';
  email = '';
  account = '';
  dependenciaId = '';
  cargoId = '';
  rolIds: string[] = [];

  errorMsg = '';
  saving = false;
  loadingCatalogos = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;
  private loadSub?: Subscription;

  constructor(
    private readonly session: SessionService,
    private readonly proyectosApi: ProyectosApiService,
    private readonly actividadesApi: ActividadesApiService,
    private readonly usuariosApi: UsuariosApiService,
    private readonly dependenciasApi: DependenciasApiService,
    private readonly cargosApi: CargosApiService,
    private readonly rolesApi: RolesApiService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      this.loadCatalogos();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }

  get title(): string {
    return this.kind === 'usuario' ? 'Nuevo usuario' : 'Nueva actividad';
  }

  get subtitle(): string {
    return this.kind === 'usuario'
      ? 'Se registrará en el directorio de usuarios.'
      : 'Se registrará en las actividades institucionales.';
  }

  get initialsPreview(): string {
    const parts = this.nombre.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—';
  }

  submit(): void {
    if (this.saving) {
      return;
    }
    this.errorMsg = '';
    if (this.kind === 'usuario') {
      this.submitUsuario();
      return;
    }
    this.submitActividad();
  }

  private submitActividad(): void {
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId) {
      this.errorMsg = 'No hay una sesión activa.';
      return;
    }
    if (!this.titulo.trim() || !this.proyectoId || !this.responsableId) {
      this.errorMsg = 'Completa el título, el proyecto y el responsable.';
      return;
    }
    this.saving = true;
    this.sub = this.actividadesApi
      .create({
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim() || undefined,
        proyecto_id: this.proyectoId,
        responsable_id: this.responsableId,
        created_by_id: usuarioId,
        prioridad: this.prioridad,
        fecha_fin_estimada: this.fechaFin || undefined,
      })
      .subscribe({
        next: (actividad) => {
          this.saving = false;
          this.created.emit(actividad.id);
          this.close.emit();
        },
        error: (err) => {
          this.saving = false;
          this.errorMsg =
            err instanceof Error ? err.message : 'No se pudo crear la actividad.';
        },
      });
  }

  private submitUsuario(): void {
    if (!this.nombre.trim() || !this.email.trim() || !this.account.trim()) {
      this.errorMsg = 'Completa el nombre, el correo y la cuenta institucional.';
      return;
    }
    this.saving = true;
    this.sub = this.usuariosApi
      .create({
        nombre: this.nombre.trim(),
        email: this.email.trim(),
        account: this.account.trim(),
        initials: this.initialsPreview === '—' ? undefined : this.initialsPreview,
        estado: 'Activo',
        dependencia_id: this.dependenciaId || undefined,
        cargo_id: this.cargoId || undefined,
        roles: this.rolIds.length ? this.rolIds : undefined,
      })
      .subscribe({
        next: (usuario) => {
          this.saving = false;
          this.created.emit(usuario.id);
          this.close.emit();
        },
        error: (err) => {
          this.saving = false;
          this.errorMsg =
            err instanceof Error ? err.message : 'No se pudo crear el usuario.';
        },
      });
  }

  toggleRol(id: string): void {
    const index = this.rolIds.indexOf(id);
    if (index === -1) {
      this.rolIds = [...this.rolIds, id];
    } else {
      this.rolIds = this.rolIds.filter((r) => r !== id);
    }
  }

  isRolSelected(id: string): boolean {
    return this.rolIds.includes(id);
  }

  private resetForm(): void {
    this.titulo = '';
    this.descripcion = '';
    this.prioridad = 'Media';
    this.fechaFin = '';
    this.nombre = '';
    this.email = '';
    this.account = '';
    this.cargoId = '';
    this.rolIds = [];
    this.errorMsg = '';
    this.saving = false;
    this.proyectoId = '';
    this.responsableId = '';
    this.dependenciaId = this.session.sesion?.dependencia?.id ?? '';
    this.proyectos = [];
    this.usuarios = [];
    this.dependencias = [];
    this.cargos = [];
    this.roles = [];
  }

  private loadCatalogos(): void {
    this.loadingCatalogos = true;
    if (this.kind === 'usuario') {
      this.loadUsuariosForm();
      return;
    }
    this.loadActividadForm();
  }

  private loadActividadForm(): void {
    const usuarioId = this.session.sesion?.user.id;
    this.loadSub?.unsubscribe();
    this.loadSub = new Subscription();
    const proyectosSub = this.proyectosApi.findAll({ limit: 100, usuario_id: this.session.sesion?.user.id }).subscribe({
      next: (res) => {
        this.proyectos = res.data;
        this.proyectoId = this.proyectos[0]?.id ?? '';
        if (usuarioId) {
          this.responsableId = usuarioId;
        }
        this.finishLoading();
      },
      error: () => this.finishLoading(),
    });
    const usuariosSub = this.usuariosApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.usuarios = res.data;
      },
      error: () => undefined,
    });
    this.loadSub.add(proyectosSub);
    this.loadSub.add(usuariosSub);
  }

  private loadUsuariosForm(): void {
    const carga = this.dependenciasApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.dependencias = res.data.filter((d) => d.activa);
        this.finishLoading();
      },
      error: () => this.finishLoading(),
    });
    const cargosSub = this.cargosApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.cargos = res.data;
      },
      error: () => undefined,
    });
    const rolesSub = this.rolesApi.findAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.roles = res.data;
      },
      error: () => undefined,
    });
    this.loadSub?.unsubscribe();
    this.loadSub = new Subscription();
    this.loadSub.add(carga);
    this.loadSub.add(cargosSub);
    this.loadSub.add(rolesSub);
  }

  private finishLoading(): void {
    this.loadingCatalogos = false;
    this.cdr.detectChanges();
  }
}
