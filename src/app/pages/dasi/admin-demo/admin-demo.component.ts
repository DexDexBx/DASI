import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { DasiDetailModalComponent } from '../../../shared/components/dasi/detail-modal/detail-modal.component';
import { DasiConfirmModalComponent } from '../../../shared/components/dasi/confirm-modal/confirm-modal.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { RolesApiService } from '../../../core/services/roles-api.service';
import { PermisosApiService } from '../../../core/services/permisos-api.service';
import { ModulosApiService } from '../../../core/services/modulos-api.service';
import { DependenciasApiService } from '../../../core/services/dependencias-api.service';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { CargosApiService } from '../../../core/services/cargos-api.service';
import { ProyectosApiService } from '../../../core/services/proyectos-api.service';
import { fetchAllPages } from '../../../core/services/pagination';
import { SessionService } from '../../../core/services/session.service';
import { Rol, ScopeRol } from '../../../core/models/rol.model';
import { Permiso, AccionPermiso } from '../../../core/models/permiso.model';
import { Modulo } from '../../../core/models/modulo.model';
import { Dependencia, TipoDependencia } from '../../../core/models/dependencia.model';
import { Usuario, EstadoUsuario } from '../../../core/models/usuario.model';
import { Cargo } from '../../../core/models/cargo.model';
import { Proyecto } from '../../../core/models/proyecto.model';
import { ApiListResponse } from '../../../core/models/api-response.model';

type Kind =
  | 'admin'
  | 'roles'
  | 'permissions'
  | 'modules'
  | 'dependencias'
  | 'cargos'
  | 'users'
  | 'settings';

const ACCIONES_CANONICAS: AccionPermiso[] = [
  'Ver',
  'Crear',
  'Editar',
  'CambiarEstado',
  'Eliminar',
  'Aprobar',
  'Observar',
  'Asignar',
  'Exportar',
  'Administrar',
];

const SCOPE_DESCRIPTIONS: Record<ScopeRol, string> = {
  GLOBAL: 'Puede actuar sobre cualquier dependencia y todo el sistema.',
  DEPENDENCIA: 'Puede actuar sobre todo lo de su dependencia (oficina o escuela).',
  PROPIO: 'Solo sobre lo suyo: proyectos, tareas y actividades que creó o le pertenecen.',
  ASIGNADO: 'Sobre lo que le fue asignado por un responsable.',
};

const TIPOS_DEPENDENCIA: TipoDependencia[] = ['Oficina', 'Escuela', 'JGA', 'Direccion'];

const ROUTE_BY_ADMIN_KIND: Record<Kind, string> = {
  admin: '/administracion',
  roles: '/roles',
  permissions: '/permisos',
  modules: '/modulos',
  dependencias: '/dependencias',
  cargos: '/cargos',
  users: '/usuarios',
  settings: '/configuracion',
};

@Component({
  selector: 'app-dasi-admin-demo',
  imports: [
    FormsModule,
    RouterModule,
    BadgeComponent,
    DasiModuleHeaderComponent,
    DasiDetailModalComponent,
    DasiConfirmModalComponent,
    ModalComponent,
  ],
  templateUrl: './admin-demo.component.html',
})
export class AdminDemoComponent implements OnInit, OnDestroy {
  kind!: Kind;
  loading = true;
  roles: Rol[] = [];
  modulos: Modulo[] = [];
  permisos: Permiso[] = [];
  dependencias: Dependencia[] = [];
  cargos: Cargo[] = [];
  usuarios: Usuario[] = [];
  proyectos: Proyecto[] = [];
  selectedRolId = '';
  selectedRol = '';
  selectedDep = '';

  /*** Filtros de búsqueda ***/
  rolSearch = '';
  moduleSearch = '';
  permViewFilter: 'todos' | 'acceso' = 'todos';
  moduloSearch = '';
  moduloEstadoFilter: '' | 'activo' | 'inactivo' = '';
  cargoSearch = '';

  /*** Permisos (matriz editable) ***/
  draftPermIds = new Set<string>();
  savingPerms = false;
  permSavingError = '';

  /*** Roles ***/
  createRolOpen = false;
  newRolNombre = '';
  newRolDescripcion = '';
  newRolScope: ScopeRol = 'PROPIO';
  rolScopes: ScopeRol[] = ['GLOBAL', 'DEPENDENCIA', 'PROPIO', 'ASIGNADO'];
  savingRol = false;
  createRolError = '';

  editRolOpen = false;
  editRol: Rol | null = null;
  editRolNombre = '';
  editRolDescripcion = '';
  editRolScope: ScopeRol = 'PROPIO';
  savingEditRol = false;
  editRolError = '';

  deleteRolOpen = false;
  deleteRol: Rol | null = null;
  deletingRol = false;
  deleteRolError = '';

  /*** Acciones por módulo (catálogo de permisos) ***/
  createPermisoOpen = false;
  createPermisoModuleId = '';
  createPermisoModuleName = '';
  createPermisoAccion = '';
  savingPermiso = false;
  createPermisoError = '';
  deletePermisoOpen = false;
  deletePermiso: Permiso | null = null;
  deletingPermiso = false;
  deletePermisoError = '';

  /*** Módulos ***/
  createModuloOpen = false;
  newModuloSlug = '';
  newModuloNombre = '';
  newModuloDescripcion = '';
  newModuloActivo = true;
  savingModulo = false;
  createModuloError = '';

  /*** Dependencias ***/
  depModalOpen = false;
  editingDep = false;
  editingDepId = '';
  depFormCode = '';
  depFormNombre = '';
  depFormTipo: TipoDependencia = 'Oficina';
  depFormDirector = '';
  depFormActiva = true;
  depFormParentId = '';
  savingDep = false;
  depFormError = '';

  /*** Cargos ***/
  cargoModalOpen = false;
  editingCargo = false;
  editingCargoId = '';
  cargoFormNombre = '';
  cargoFormDescripcion = '';
  savingCargo = false;
  cargoFormError = '';
  deleteCargoOpen = false;
  deleteCargo: Cargo | null = null;
  deletingCargo = false;
  deleteCargoError = '';

  /*** Usuarios ***/
  userSearch = '';
  userFilterRol = '';
  userFilterDep = '';
  userFilterEstado: '' | EstadoUsuario = '';
  userModalOpen = false;
  editingUser = false;
  editingUserId = '';
  userFormNombre = '';
  userFormEmail = '';
  userFormAccount = '';
  userFormEstado: EstadoUsuario = 'Activo';
  userFormRolIds: string[] = [];
  userFormDepIds: string[] = [];
  userFormPrincipalDepId = '';
  userFormCargoIds: string[] = [];
  savingUser = false;
  userFormError = '';
  deleteUserOpen = false;
  deleteUser: Usuario | null = null;
  deletingUser = false;
  deleteUserError = '';
  selectedUser = '';

  private readonly route: ActivatedRoute;
  private readonly cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;

  private readonly descriptions: Record<Kind, string> = {
    admin: 'Centro de control de la plataforma: gestiona usuarios, roles, permisos, módulos, dependencias, cargos y la configuración general.',
    roles: 'Roles de la institución: crea, edita o elimina roles y gestiona su alcance.',
    permissions: 'Matriz de permisos por módulo y acción para el rol seleccionado. Marca, desmarca y guarda.',
    modules: 'Catálogo de módulos del sistema. Puedes crear módulos y habilitar/deshabilitar los existentes.',
    dependencias: 'Dependencias institucionales. Crea, edita y activa/desactiva las unidades.',
    cargos: 'Catálogo de cargos institucionales. Crea, edita y elimina los cargos de la plantilla.',
    users: 'Directorio de usuarios. Crea usuarios, asígnales roles, cargos y una o varias oficinas o escuelas.',
    settings: 'Estado real de la plataforma: módulos, permisos, dependencias, usuarios y proyectos.',
  };

  constructor(
    route: ActivatedRoute,
    private router: Router,
    private rolesApi: RolesApiService,
    private permisosApi: PermisosApiService,
    private modulosApi: ModulosApiService,
    private dependenciasApi: DependenciasApiService,
    private cargosApi: CargosApiService,
    private usuariosApi: UsuariosApiService,
    private proyectosApi: ProyectosApiService,
    private session: SessionService,
  ) {
    this.kind = route.snapshot.data['kind'] as Kind;
    this.route = route;
  }

  ngOnInit(): void {
    this.sub = forkJoin({
      roles: this.rolesApi.findAll({ limit: 100 }),
      permisos: fetchAllPages((page, limit) => this.permisosApi.findAll({ page, limit })),
      modulos: this.modulosApi.findAll({ limit: 100 }),
      dependencias: this.dependenciasApi.findAll({ limit: 100 }),
      cargos: this.cargosApi.findAll({ limit: 100 }),
      usuarios: fetchAllPages((page, limit) => this.usuariosApi.findAll({ page, limit })),
      proyectos: fetchAllPages((page, limit) => this.proyectosApi.findAll({ page, limit })),
    }).subscribe({
      next: (res: {
        roles: ApiListResponse<Rol>;
        permisos: Permiso[];
        modulos: ApiListResponse<Modulo>;
        dependencias: ApiListResponse<Dependencia>;
        cargos: ApiListResponse<Cargo>;
        usuarios: Usuario[];
        proyectos: Proyecto[];
      }) => {
        this.roles = res.roles.data;
        this.permisos = res.permisos;
        this.modulos = res.modulos.data;
        this.dependencias = res.dependencias.data;
        this.cargos = res.cargos.data;
        this.usuarios = res.usuarios;
        this.proyectos = res.proyectos;
        const preselect = this.route.snapshot.queryParamMap.get('rol');
        this.selectedRolId =
          (preselect && this.roles.find((r) => r.id === preselect)?.id) ||
          this.roles[0]?.id ||
          '';
        this.rebuildDraft(this.selectedRolId);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get title(): string {
    return (
      {
        admin: 'Administración',
        roles: 'Roles',
        permissions: 'Permisos',
        modules: 'Módulos',
        dependencias: 'Dependencias',
        cargos: 'Cargos',
        users: 'Usuarios',
        settings: 'Configuración',
      } as Record<Kind, string>
    )[this.kind];
  }

  get description(): string {
    return this.descriptions[this.kind];
  }

  get permActions(): AccionPermiso[] {
    return ACCIONES_CANONICAS;
  }

  get permisosTotales(): number {
    return this.permisos.length;
  }

  rolById(id: string): Rol | undefined {
    return this.roles.find((r) => r.id === id);
  }

  rolByNombre(nombre: string): Rol | undefined {
    return this.roles.find((r) => r.nombre === nombre);
  }

  depById(id: string): Dependencia | undefined {
    return this.dependencias.find((d) => d.id === id);
  }

  depByCode(code: string): Dependencia | undefined {
    return this.dependencias.find((d) => d.code === code);
  }

  cargoById(id: string): Cargo | undefined {
    return this.cargos.find((c) => c.id === id);
  }

  rolPermisoCount(rolId: string): number {
    return this.rolById(rolId)?.rol_permisos.length ?? 0;
  }

  rolUsersCount(rolId: string): number {
    return this.rolById(rolId)?._count?.usuario_roles ?? 0;
  }

  moduleActions(moduleId: string): AccionPermiso[] {
    return this.permisos.filter((p) => p.modulo_id === moduleId).map((p) => p.accion);
  }

  permisoId(moduleId: string, action: AccionPermiso): string {
    return this.permisos.find((p) => p.modulo_id === moduleId && p.accion === action)?.id ?? '';
  }

  moduleEnabled(moduleId: string): boolean {
    return this.modulos.find((m) => m.id === moduleId)?.activo ?? false;
  }

  grantedPermIds(rolId: string): Set<string> {
    return new Set(this.rolById(rolId)?.rol_permisos.map((rp) => rp.permiso_id) ?? []);
  }

  /*** Permisos (matriz editable) ***/

  rebuildDraft(rolId: string): void {
    this.draftPermIds = this.grantedPermIds(rolId);
    this.permSavingError = '';
  }

  onRolChange(): void {
    this.rebuildDraft(this.selectedRolId);
    this.cdr.detectChanges();
  }

  hasDraft(permisoId: string): boolean {
    return !!permisoId && this.draftPermIds.has(permisoId);
  }

  toggleDraftPermiso(moduleId: string, action: AccionPermiso): void {
    const id = this.permisoId(moduleId, action);
    if (!id) return;
    if (this.draftPermIds.has(id)) {
      this.draftPermIds.delete(id);
    } else {
      this.draftPermIds.add(id);
    }
    this.permSavingError = '';
  }

  toggleModuleDraft(moduleId: string, checked: boolean): void {
    for (const permiso of this.permisos.filter((p) => p.modulo_id === moduleId)) {
      if (checked) {
        this.draftPermIds.add(permiso.id);
      } else {
        this.draftPermIds.delete(permiso.id);
      }
    }
    this.permSavingError = '';
  }

  moduleDraftCount(rolId: string, moduleId: string): number {
    const granted = this.grantedPermIds(rolId);
    return this.permisos.filter((p) => p.modulo_id === moduleId && granted.has(p.id)).length;
  }

  moduleDraftPendingCount(moduleId: string): number {
    return this.permisos.filter((p) => p.modulo_id === moduleId && this.draftPermIds.has(p.id)).length;
  }

  isDraftDirty(): boolean {
    const committed = this.grantedPermIds(this.selectedRolId);
    if (committed.size !== this.draftPermIds.size) return true;
    for (const id of this.draftPermIds) {
      if (!committed.has(id)) return true;
    }
    return false;
  }

  savePermisos(): void {
    if (this.savingPerms) return;
    this.savingPerms = true;
    this.permSavingError = '';
    this.rolesApi.setPermisos(this.selectedRolId, [...this.draftPermIds]).subscribe({
      next: (rol) => {
        this.roles = this.roles.map((r) => (r.id === rol.id ? rol : r));
        this.savingPerms = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingPerms = false;
        this.permSavingError = err instanceof Error ? err.message : 'No se pudieron guardar los permisos.';
        this.cdr.detectChanges();
      },
    });
  }

  cancelPermisos(): void {
    this.rebuildDraft(this.selectedRolId);
    this.cdr.detectChanges();
  }

  /*** Roles ***/

  get headerAction(): string {
    switch (this.kind) {
      case 'roles':
        return 'Nuevo rol';
      case 'modules':
        return 'Nuevo módulo';
      case 'dependencias':
        return 'Nueva dependencia';
      case 'cargos':
        return 'Nuevo cargo';
      case 'users':
        return 'Nuevo usuario';
      default:
        return '';
    }
  }

  action(): void {
    if (this.kind === 'roles') {
      this.openCreateRol();
    } else if (this.kind === 'modules') {
      this.openCreateModulo();
    } else if (this.kind === 'dependencias') {
      this.openCreateDep();
    } else if (this.kind === 'cargos') {
      this.openCreateCargo();
    } else if (this.kind === 'users') {
      this.openCreateUser();
    }
  }

  go(kind: Kind): void {
    this.router.navigate([ROUTE_BY_ADMIN_KIND[kind]]);
  }

  goUrl(url: string): void {
    this.router.navigate([url]);
  }

  manageRolePermissions(rol: Rol): void {
    this.router.navigate(['/permisos'], { queryParams: { rol: rol.id } });
  }

  scopeDescription(scope: ScopeRol): string {
    return SCOPE_DESCRIPTIONS[scope];
  }

  /*** Filtros de búsqueda ***/
  get filteredRoles(): Rol[] {
    const q = this.rolSearch.trim().toLowerCase();
    return this.roles.filter(
      (r) => !q || r.nombre.toLowerCase().includes(q),
    );
  }

  get filteredModulosMatriz(): Modulo[] {
    const q = this.moduleSearch.trim().toLowerCase();
    return this.modulos.filter((m) => {
      if (q && !m.nombre.toLowerCase().includes(q) && !m.slug.toLowerCase().includes(q)) return false;
      if (this.permViewFilter === 'acceso') {
        const granted = this.grantedPermIds(this.selectedRolId);
        if (!this.permisos.some((p) => p.modulo_id === m.id && granted.has(p.id))) return false;
      }
      return true;
    });
  }

  get filteredModulos(): Modulo[] {
    const q = this.moduloSearch.trim().toLowerCase();
    const filtro = this.moduloEstadoFilter;
    return this.modulos.filter((m) => {
      if (q && !m.nombre.toLowerCase().includes(q) && !m.slug.toLowerCase().includes(q) && !m.descripcion?.toLowerCase().includes(q)) return false;
      if (filtro === 'activo' && !m.activo) return false;
      if (filtro === 'inactivo' && m.activo) return false;
      return true;
    });
  }

  get filteredCargos(): Cargo[] {
    const q = this.cargoSearch.trim().toLowerCase();
    return this.cargos.filter(
      (c) => !q || c.nombre.toLowerCase().includes(q) || c.descripcion?.toLowerCase().includes(q),
    );
  }

  cargoUserNames(cargoId: string): string {
    return this.usuarios
      .filter((u) => u.usuario_cargos.some((uc) => uc.cargo_id === cargoId))
      .slice(0, 3)
      .map((u) => u.nombre)
      .join(', ');
  }

  /*** Módulos visibles por rol ***/
  roleModuleIds(rolId: string): string[] {
    const granted = this.grantedPermIds(rolId);
    const ids = this.permisos
      .filter((p) => granted.has(p.id))
      .map((p) => p.modulo_id);
    return [...new Set(ids)];
  }

  roleModules(rolId: string): Modulo[] {
    const visible = new Set(this.roleModuleIds(rolId));
    return this.modulos.filter((m) => visible.has(m.id));
  }

  roleVisibleModulesCount(rolId: string): number {
    return this.roleModuleIds(rolId).length;
  }

  /*** Roles ***/

  openCreateRol(): void {
    this.newRolNombre = '';
    this.newRolDescripcion = '';
    this.newRolScope = 'PROPIO';
    this.createRolError = '';
    this.createRolOpen = true;
  }

  submitRol(): void {
    if (this.savingRol) {
      return;
    }
    if (!this.newRolNombre.trim()) {
      this.createRolError = 'Ingresa el nombre del rol.';
      return;
    }
    this.savingRol = true;
    this.createRolError = '';
    this.rolesApi
      .create({
        nombre: this.newRolNombre.trim(),
        descripcion: this.newRolDescripcion.trim() || undefined,
        scope: this.newRolScope,
      })
      .subscribe({
        next: (rol) => {
          this.roles = [rol, ...this.roles];
          this.savingRol = false;
          this.createRolOpen = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingRol = false;
          this.createRolError =
            err instanceof Error ? err.message : 'No se pudo crear el rol.';
          this.cdr.detectChanges();
        },
      });
  }

  openEditRol(rol: Rol): void {
    this.editRol = rol;
    this.editRolNombre = rol.nombre;
    this.editRolDescripcion = rol.descripcion ?? '';
    this.editRolScope = rol.scope;
    this.editRolError = '';
    this.editRolOpen = true;
  }

  submitEditRol(): void {
    if (this.savingEditRol || !this.editRol) return;
    if (!this.editRolNombre.trim()) {
      this.editRolError = 'Ingresa el nombre del rol.';
      return;
    }
    this.savingEditRol = true;
    this.editRolError = '';
    this.rolesApi
      .update(this.editRol.id, {
        nombre: this.editRolNombre.trim(),
        descripcion: this.editRolDescripcion.trim() || undefined,
        scope: this.editRolScope,
      })
      .subscribe({
        next: (rol) => {
          this.roles = this.roles.map((r) => (r.id === rol.id ? rol : r));
          this.savingEditRol = false;
          this.editRolOpen = false;
          this.editRol = null;
          this.rebuildDraft(this.selectedRolId);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingEditRol = false;
          this.editRolError =
            err instanceof Error ? err.message : 'No se pudo actualizar el rol.';
          this.cdr.detectChanges();
        },
      });
  }

  openDeleteRol(rol: Rol): void {
    this.deleteRol = rol;
    this.deleteRolError = '';
    this.deleteRolOpen = true;
  }

  confirmDeleteRol(): void {
    if (this.deletingRol || !this.deleteRol) return;
    this.deletingRol = true;
    this.deleteRolError = '';
    this.rolesApi.remove(this.deleteRol.id).subscribe({
      next: () => {
        this.roles = this.roles.filter((r) => r.id !== this.deleteRol!.id);
        if (this.selectedRolId === this.deleteRol!.id) {
          this.selectedRolId = this.roles[0]?.id ?? '';
          this.rebuildDraft(this.selectedRolId);
        }
        if (this.selectedRol === this.deleteRol!.id) this.selectedRol = '';
        this.deletingRol = false;
        this.deleteRolOpen = false;
        this.deleteRol = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingRol = false;
        this.deleteRolError =
          err instanceof Error ? err.message : 'No se pudo eliminar el rol.';
        this.cdr.detectChanges();
      },
    });
  }

  /*** Módulos ***/

  openCreateModulo(): void {
    this.newModuloSlug = '';
    this.newModuloNombre = '';
    this.newModuloDescripcion = '';
    this.newModuloActivo = true;
    this.createModuloError = '';
    this.createModuloOpen = true;
  }

  submitModulo(): void {
    if (this.savingModulo) return;
    if (!this.newModuloSlug.trim() || !this.newModuloNombre.trim()) {
      this.createModuloError = 'El slug y el nombre del módulo son obligatorios.';
      return;
    }
    this.savingModulo = true;
    this.createModuloError = '';
    this.modulosApi
      .create({
        slug: this.newModuloSlug.trim(),
        nombre: this.newModuloNombre.trim(),
        descripcion: this.newModuloDescripcion.trim() || undefined,
        activo: this.newModuloActivo,
      })
      .subscribe({
        next: (modulo) => {
          this.modulos = [modulo, ...this.modulos];
          this.savingModulo = false;
          this.createModuloOpen = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingModulo = false;
          this.createModuloError =
            err instanceof Error ? err.message : 'No se pudo crear el módulo.';
          this.cdr.detectChanges();
        },
      });
  }

  toggleModule(modulo: Modulo): void {
    this.modulosApi.update(modulo.id, { activo: !modulo.activo }).subscribe({
      next: (updated) => {
        this.modulos = this.modulos.map((m) => (m.id === updated.id ? updated : m));
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  /*** Acciones por módulo (catálogo de permisos) ***/
  modulePermisos(moduleId: string): Permiso[] {
    return this.permisos.filter((p) => p.modulo_id === moduleId);
  }

  moduleActionsAvailable(moduleId: string): AccionPermiso[] {
    const existing = new Set(this.modulePermisos(moduleId).map((p) => p.accion));
    return ACCIONES_CANONICAS.filter((a) => !existing.has(a));
  }

  openCreatePermiso(moduleId: string, moduleName: string): void {
    this.createPermisoModuleId = moduleId;
    this.createPermisoModuleName = moduleName;
    this.createPermisoAccion = '';
    this.createPermisoError = '';
    this.createPermisoOpen = true;
  }

  submitPermiso(): void {
    if (this.savingPermiso || !this.createPermisoAccion) return;
    this.savingPermiso = true;
    this.createPermisoError = '';
    this.permisosApi
      .create({
        modulo_id: this.createPermisoModuleId,
        accion: this.createPermisoAccion as AccionPermiso,
      })
      .subscribe({
        next: (permiso) => {
          this.permisos = [...this.permisos, permiso];
          this.savingPermiso = false;
          this.createPermisoOpen = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingPermiso = false;
          this.createPermisoError =
            err instanceof Error ? err.message : 'No se pudo crear la acción.';
          this.cdr.detectChanges();
        },
      });
  }

  openDeletePermiso(permiso: Permiso): void {
    this.deletePermiso = permiso;
    this.deletePermisoError = '';
    this.deletePermisoOpen = true;
  }

  confirmDeletePermiso(): void {
    if (this.deletingPermiso || !this.deletePermiso) return;
    this.deletingPermiso = true;
    this.deletePermisoError = '';
    this.permisosApi.remove(this.deletePermiso.id).subscribe({
      next: () => {
        this.permisos = this.permisos.filter((p) => p.id !== this.deletePermiso!.id);
        this.roles = this.roles.map((r) => ({
          ...r,
          rol_permisos: r.rol_permisos.filter(
            (rp) => rp.permiso_id !== this.deletePermiso!.id,
          ),
        }));
        this.rebuildDraft(this.selectedRolId);
        this.deletingPermiso = false;
        this.deletePermisoOpen = false;
        this.deletePermiso = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingPermiso = false;
        this.deletePermisoError =
          err instanceof Error ? err.message : 'No se pudo eliminar la acción.';
        this.cdr.detectChanges();
      },
    });
  }

  /*** Dependencias ***/

  get depTipos(): TipoDependencia[] {
    return TIPOS_DEPENDENCIA;
  }

  openCreateDep(): void {
    this.editingDep = false;
    this.editingDepId = '';
    this.depFormCode = '';
    this.depFormNombre = '';
    this.depFormTipo = 'Oficina';
    this.depFormDirector = '';
    this.depFormActiva = true;
    this.depFormParentId = '';
    this.depFormError = '';
    this.depModalOpen = true;
  }

  openEditDep(dep: Dependencia): void {
    this.editingDep = true;
    this.editingDepId = dep.id;
    this.depFormCode = dep.code;
    this.depFormNombre = dep.nombre;
    this.depFormTipo = dep.tipo;
    this.depFormDirector = dep.director;
    this.depFormActiva = dep.activa;
    this.depFormParentId = dep.parent_id ?? '';
    this.depFormError = '';
    this.depModalOpen = true;
  }

  submitDep(): void {
    if (this.savingDep) return;
    if (!this.depFormCode.trim() || !this.depFormNombre.trim()) {
      this.depFormError = 'El código y el nombre son obligatorios.';
      return;
    }
    this.savingDep = true;
    this.depFormError = '';
    const payload = {
      code: this.depFormCode.trim(),
      nombre: this.depFormNombre.trim(),
      tipo: this.depFormTipo,
      director: this.depFormDirector.trim() || '-',
      activa: this.depFormActiva,
      ...(this.depFormParentId ? { parent_id: this.depFormParentId } : { parent_id: undefined }),
    };

    if (this.editingDep) {
      this.dependenciasApi.update(this.editingDepId, payload).subscribe({
        next: (updated) => {
          this.dependencias = this.dependencias.map((d) =>
            d.id === updated.id ? updated : d,
          );
          this.depModalOpen = false;
          this.savingDep = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingDep = false;
          this.depFormError =
            err instanceof Error ? err.message : 'No se pudo actualizar la dependencia.';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.dependenciasApi.create(payload).subscribe({
      next: (dep) => {
        this.dependencias = [dep, ...this.dependencias];
        this.depModalOpen = false;
        this.savingDep = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingDep = false;
        this.depFormError =
          err instanceof Error ? err.message : 'No se pudo crear la dependencia.';
        this.cdr.detectChanges();
      },
    });
  }

  toggleDepActiva(dep: Dependencia): void {
    this.dependenciasApi.update(dep.id, { activa: !dep.activa }).subscribe({
      next: (updated) => {
        this.dependencias = this.dependencias.map((d) =>
          d.id === updated.id ? updated : d,
        );
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  /*** Cargos ***/

  cargoUsersCount(cargoId: string): number {
    return this.cargoById(cargoId)?._count?.usuario_cargos ?? 0;
  }

  openCreateCargo(): void {
    this.editingCargo = false;
    this.editingCargoId = '';
    this.cargoFormNombre = '';
    this.cargoFormDescripcion = '';
    this.cargoFormError = '';
    this.cargoModalOpen = true;
  }

  openEditCargo(cargo: Cargo): void {
    this.editingCargo = true;
    this.editingCargoId = cargo.id;
    this.cargoFormNombre = cargo.nombre;
    this.cargoFormDescripcion = cargo.descripcion ?? '';
    this.cargoFormError = '';
    this.cargoModalOpen = true;
  }

  submitCargo(): void {
    if (this.savingCargo) return;
    if (!this.cargoFormNombre.trim()) {
      this.cargoFormError = 'El nombre del cargo es obligatorio.';
      return;
    }
    this.savingCargo = true;
    this.cargoFormError = '';
    const payload = {
      nombre: this.cargoFormNombre.trim(),
      descripcion: this.cargoFormDescripcion.trim() || undefined,
    };

    if (this.editingCargo) {
      this.cargosApi.update(this.editingCargoId, payload).subscribe({
        next: (updated) => {
          this.cargos = this.cargos.map((c) => (c.id === updated.id ? updated : c));
          this.cargoModalOpen = false;
          this.savingCargo = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingCargo = false;
          this.cargoFormError =
            err instanceof Error ? err.message : 'No se pudo actualizar el cargo.';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.cargosApi.create(payload).subscribe({
      next: (cargo) => {
        this.cargos = [cargo, ...this.cargos];
        this.cargoModalOpen = false;
        this.savingCargo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingCargo = false;
        this.cargoFormError =
          err instanceof Error ? err.message : 'No se pudo crear el cargo.';
        this.cdr.detectChanges();
      },
    });
  }

  openDeleteCargo(cargo: Cargo): void {
    this.deleteCargo = cargo;
    this.deleteCargoError = '';
    this.deleteCargoOpen = true;
  }

  confirmDeleteCargo(): void {
    if (this.deletingCargo || !this.deleteCargo) return;
    this.deletingCargo = true;
    this.deleteCargoError = '';
    this.cargosApi.remove(this.deleteCargo.id).subscribe({
      next: () => {
        this.cargos = this.cargos.filter((c) => c.id !== this.deleteCargo!.id);
        this.deletingCargo = false;
        this.deleteCargoOpen = false;
        this.deleteCargo = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingCargo = false;
        this.deleteCargoError =
          err instanceof Error ? err.message : 'No se pudo eliminar el cargo.';
        this.cdr.detectChanges();
      },
    });
  }

  /*** Usuarios ***/

  get filteredUsers(): Usuario[] {
    const q = this.userSearch.trim().toLowerCase();
    return this.usuarios.filter((u) => {
      if (q && !`${u.nombre} ${u.email} ${u.account}`.toLowerCase().includes(q)) return false;
      if (this.userFilterEstado && u.estado !== this.userFilterEstado) return false;
      if (this.userFilterRol && !u.usuario_roles.some((ur) => ur.rol_id === this.userFilterRol)) return false;
      if (this.userFilterDep && !u.usuario_dependencias.some((ud) => ud.dependencia_id === this.userFilterDep)) return false;
      return true;
    });
  }

  userRols(usuario: Usuario): Rol[] {
    return usuario.usuario_roles
      .map((ur) => this.rolById(ur.rol_id))
      .filter((r): r is Rol => !!r);
  }

  userDeps(usuario: Usuario): Dependencia[] {
    return usuario.usuario_dependencias
      .map((ud) => this.depById(ud.dependencia_id))
      .filter((d): d is Dependencia => !!d);
  }

  userCargos(usuario: Usuario): Cargo[] {
    return usuario.usuario_cargos
      .map((uc) => this.cargoById(uc.cargo_id))
      .filter((c): c is Cargo => !!c);
  }

  principalDepIds(usuario: Usuario): Set<string> {
    return new Set(
      usuario.usuario_dependencias.filter((ud) => ud.es_principal).map((ud) => ud.dependencia_id),
    );
  }

  isPrincipalUserDep(usuario: Usuario, depId: string): boolean {
    return this.principalDepIds(usuario).has(depId);
  }

  isSelf(usuario: Usuario): boolean {
    return usuario.id === this.session.sesion?.user.id;
  }

  generateAccountFromEmail(email: string): string {
    return email.trim().split('@')[0] ?? '';
  }

  get userInitialsPreview(): string {
    const parts = this.userFormNombre.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  openCreateUser(): void {
    this.editingUser = false;
    this.editingUserId = '';
    this.userFormNombre = '';
    this.userFormEmail = '';
    this.userFormAccount = '';
    this.userFormEstado = 'Activo';
    this.userFormRolIds = [];
    this.userFormDepIds = [];
    this.userFormPrincipalDepId = '';
    this.userFormCargoIds = [];
    this.userFormError = '';
    this.userModalOpen = true;
  }

  openEditUser(usuario: Usuario): void {
    this.editingUser = true;
    this.editingUserId = usuario.id;
    this.userFormNombre = usuario.nombre;
    this.userFormEmail = usuario.email;
    this.userFormAccount = usuario.account;
    this.userFormEstado = usuario.estado;
    this.userFormRolIds = usuario.usuario_roles.map((ur) => ur.rol_id);
    this.userFormDepIds = usuario.usuario_dependencias.map((ud) => ud.dependencia_id);
    this.userFormPrincipalDepId =
      this.userFormDepIds.find((id) => this.isPrincipalUserDep(usuario, id)) ??
      this.userFormDepIds[0] ??
      '';
    this.userFormCargoIds = usuario.usuario_cargos.map((uc) => uc.cargo_id);
    this.userFormError = '';
    this.userModalOpen = true;
  }

  toggleUserRol(id: string): void {
    const idx = this.userFormRolIds.indexOf(id);
    if (idx === -1) {
      this.userFormRolIds = [...this.userFormRolIds, id];
    } else {
      this.userFormRolIds = this.userFormRolIds.filter((r) => r !== id);
    }
  }

  isUserRolSelected(id: string): boolean {
    return this.userFormRolIds.includes(id);
  }

  toggleUserDep(id: string): void {
    const idx = this.userFormDepIds.indexOf(id);
    let next: string[];
    if (idx === -1) {
      next = [...this.userFormDepIds, id];
      if (!this.userFormPrincipalDepId) this.userFormPrincipalDepId = id;
    } else {
      next = this.userFormDepIds.filter((d) => d !== id);
      if (this.userFormPrincipalDepId === id) {
        this.userFormPrincipalDepId = next[0] ?? '';
      }
    }
    this.userFormDepIds = next;
  }

  isUserDepSelected(id: string): boolean {
    return this.userFormDepIds.includes(id);
  }

  setPrincipalDep(id: string): void {
    if (this.userFormDepIds.includes(id)) {
      this.userFormPrincipalDepId = id;
    }
  }

  toggleUserCargo(id: string): void {
    const idx = this.userFormCargoIds.indexOf(id);
    if (idx === -1) {
      this.userFormCargoIds = [...this.userFormCargoIds, id];
    } else {
      this.userFormCargoIds = this.userFormCargoIds.filter((c) => c !== id);
    }
  }

  isUserCargoSelected(id: string): boolean {
    return this.userFormCargoIds.includes(id);
  }

  submitUser(): void {
    if (this.savingUser) return;
    if (!this.userFormNombre.trim() || !this.userFormEmail.trim()) {
      this.userFormError = 'El nombre y el correo son obligatorios.';
      return;
    }
    const email = this.userFormEmail.trim();
    const account =
      this.userFormAccount.trim() || this.generateAccountFromEmail(email);
    if (!account) {
      this.userFormError = 'La cuenta es obligatoria o se genera desde el correo.';
      return;
    }
    this.savingUser = true;
    this.userFormError = '';
    const payload = {
      nombre: this.userFormNombre.trim(),
      email,
      account,
      initials: this.userInitialsPreview || undefined,
      estado: this.userFormEstado,
      dependencias: this.userFormDepIds,
      cargos: this.userFormCargoIds,
      roles: this.userFormRolIds,
      dependencia_id: this.userFormPrincipalDepId || undefined,
      cargo_id: this.userFormCargoIds[0] || undefined,
    };

    const onNext = (usuario: Usuario) => {
      this.usuarios = this.usuarios.map((u) => (u.id === usuario.id ? usuario : u));
      if (!this.usuarios.some((u) => u.id === usuario.id)) {
        this.usuarios = [usuario, ...this.usuarios];
      }
      this.userModalOpen = false;
      this.savingUser = false;
      this.cdr.detectChanges();
    };
    const onError = (err: Error) => {
      this.savingUser = false;
      this.userFormError = err.message || 'No se pudo guardar el usuario.';
      this.cdr.detectChanges();
    };

    if (this.editingUser) {
      this.usuariosApi.update(this.editingUserId, payload).subscribe({ next: onNext, error: onError });
    } else {
      this.usuariosApi.create(payload).subscribe({ next: onNext, error: onError });
    }
  }

  toggleUserEstado(usuario: Usuario): void {
    this.usuariosApi.toggleEstado(usuario.id).subscribe({
      next: (updated) => {
        this.usuarios = this.usuarios.map((u) => (u.id === updated.id ? updated : u));
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  openDeleteUser(usuario: Usuario): void {
    this.deleteUser = usuario;
    this.deleteUserError = '';
    this.deleteUserOpen = true;
  }

  confirmDeleteUser(): void {
    if (this.deletingUser || !this.deleteUser) return;
    this.deletingUser = true;
    this.deleteUserError = '';
    this.usuariosApi.remove(this.deleteUser.id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter((u) => u.id !== this.deleteUser!.id);
        if (this.selectedUser === this.deleteUser!.id) this.selectedUser = '';
        this.deletingUser = false;
        this.deleteUserOpen = false;
        this.deleteUser = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingUser = false;
        this.deleteUserError =
          err instanceof Error ? err.message : 'No se pudo eliminar el usuario.';
        this.cdr.detectChanges();
      },
    });
  }

  get selectedUserData(): Usuario | undefined {
    return this.usuarios.find((u) => u.id === this.selectedUser);
  }

  get selectedUserItems(): { label: string; value: string }[] {
    const u = this.selectedUserData;
    if (!u) return [];
    return [
      { label: 'Correo', value: u.email },
      { label: 'Cuenta', value: '@' + u.account },
      { label: 'Estado', value: u.estado },
      {
        label: 'Oficinas / Escuelas',
        value:
          this.userDeps(u)
            .map((d) => (this.isPrincipalUserDep(u, d.id) ? '★ ' : '') + d.nombre)
            .join(', ') || '—',
      },
      { label: 'Cargos', value: this.userCargos(u).map((c) => c.nombre).join(', ') || '—' },
      { label: 'Roles', value: this.userRols(u).map((r) => r.nombre).join(', ') || '—' },
    ];
  }

  /*** Conteos (admin / settings) ***/

  hasPermission(rolId: string, moduleId: string, action: AccionPermiso): boolean {
    const granted = this.grantedPermIds(rolId);
    return this.permisos.some(
      (p) => p.modulo_id === moduleId && p.accion === action && granted.has(p.id),
    );
  }

  grantedCountForModule(rolId: string, moduleId: string): number {
    const granted = this.grantedPermIds(rolId);
    return this.permisos.filter((p) => p.modulo_id === moduleId && granted.has(p.id)).length;
  }

  grantedTotal(rolId: string): number {
    return this.grantedPermIds(rolId).size;
  }

  usuariosCountByDep(depId: string): number {
    return this.usuarios.filter((u) => u.usuario_dependencias.some((ud) => ud.dependencia_id === depId)).length;
  }

  proyectosCountByDep(depId: string): number {
    return this.proyectos.filter((p) => p.dependencia_id === depId).length;
  }

  modulosVisibles(): number {
    return this.modulos.filter((m) => m.activo).length;
  }

  dependenciasActivas(): number {
    return this.dependencias.filter((d) => d.activa).length;
  }

  get proyectosActivos(): number {
    return this.proyectos.filter(
      (p) => p.estado !== 'Completado' && p.estado !== 'Implementado',
    ).length;
  }

  get usuariosActivos(): number {
    return this.usuarios.filter((u) => u.estado === 'Activo').length;
  }

  get adminCards(): { title: string; count: string; desc: string; kind: Kind; icon: string; url?: string }[] {
    return [
      {
        title: 'Usuarios',
        count: `${this.usuarios.length}`,
        desc: `${this.usuariosActivos} activos · creación con oficinas, roles y cargos`,
        kind: 'users',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 19a4 4 0 0 0-8 0M15.5 11.5a3 3 0 1 0-2.6-1.5M19 19a4 4 0 0 0-2.8-3.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="11" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`,
      },
      {
        title: 'Roles',
        count: `${this.roles.length}`,
        desc: `${this.roles.length} con alcance editable (propio, asignado, dependencia o global)`,
        kind: 'roles',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3 5 6v4.5c0 4 2.6 7.5 7 9 4.4-1.5 7-5 7-9V6l-4-3H9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      },
      {
        title: 'Permisos',
        count: `${this.permisosTotales}`,
        desc: `acciones disponibles por módulo; matriz de permisos por rol`,
        kind: 'permissions',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11.5 11 13.5 15.5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>`,
      },
      {
        title: 'Módulos',
        count: `${this.modulos.length}`,
        desc: `${this.modulosVisibles()} visibles · ${this.modulos.length - this.modulosVisibles()} ocultos del menú`,
        kind: 'modules',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6ZM4 16a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2Z" stroke="currentColor" stroke-width="1.5"/></svg>`,
      },
      {
        title: 'Dependencias',
        count: `${this.dependencias.length}`,
        desc: `${this.dependenciasActivas()} activas · oficinas, escuelas y direcciones de la institución`,
        kind: 'dependencias',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      },
      {
        title: 'Cargos',
        count: `${this.cargos.length}`,
        desc: `cargos de la plantilla; cada uno define un propósito dentro de la institución`,
        kind: 'cargos',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="8" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.5"/></svg>`,
      },
      {
        title: 'Proyectos',
        count: `${this.proyectos.length}`,
        desc: `${this.proyectosActivos} activos · carga operativa registrada`,
        kind: 'admin',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" stroke="currentColor" stroke-width="1.5"/></svg>`,
        url: '/proyectos',
      },
      {
        title: 'Configuración',
        count: `${this.modulos.length}`,
        desc: `estado real de la plataforma: módulos, permisos y organización en un vistazo`,
        kind: 'settings',
        icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.5"/><path d="M19 12a7.1 7.1 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-2.1-1.2L14 3h-4l-.4 2.7a7.7 7.7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7.1 7.1 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1c.6.5 1.3.9 2.1 1.2L10 21h4l.4-2.7c.8-.3 1.5-.7 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      },
    ];
  }
}