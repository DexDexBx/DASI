import { Routes } from '@angular/router';
import { DasiDashboardComponent } from './pages/dasi/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { AccessDeniedComponent } from './pages/auth-pages/access-denied/access-denied.component';
import { dasiAuthGuard } from './shared/guards/dasi-auth.guard';
import { dasiPermissionGuard } from './shared/guards/dasi-permission.guard';
import { CalenderComponent } from './pages/calender/calender.component';
import { ListDemoComponent } from './pages/dasi/list-demo/list-demo.component';
import { KanbanComponent } from './pages/dasi/kanban/kanban.component';
import { WorkflowComponent } from './pages/dasi/workflow/workflow.component';
import { InsightsComponent } from './pages/dasi/insights/insights.component';
import { AdminDemoComponent } from './pages/dasi/admin-demo/admin-demo.component';
import { AuditComponent } from './pages/dasi/audit/audit.component';
import { InstitucionalComponent } from './pages/dasi/institucional/institucional.component';
import { ProjectDetailComponent } from './pages/dasi/project-detail/project-detail.component';
import { EvidenceComponent } from './pages/dasi/evidence/evidence.component';
import { ObservationsComponent } from './pages/dasi/observations/observations.component';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [dasiAuthGuard],
    canActivateChild: [dasiPermissionGuard],
    children:[
      {
        path: '',
        component: DasiDashboardComponent,
        pathMatch: 'full',
        data: { modulo: 'dashboard' },
        title: 'Dashboard | DASI V.01',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        data: { modulo: 'calendar' },
        title:'Calendario | DASI V.01'
      },
      {
        path:'profile',
        component:ProfileComponent,
        data: { modulo: 'profile' },
        title:'Perfil | DASI V.01'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      { path: 'proyectos', component: ListDemoComponent, data: { kind: 'projects', modulo: 'proyectos' }, title: 'Proyectos | DASI V.01' },
      { path: 'proyectos/:id', component: ProjectDetailComponent, data: { modulo: 'proyectos' }, title: 'Detalle de proyecto | DASI V.01' },
      { path: 'mis-proyectos', component: ListDemoComponent, data: { kind: 'my-projects', modulo: 'mis-proyectos' }, title: 'Mis proyectos | DASI V.01' },
      { path: 'proyectos-oficina', component: ListDemoComponent, data: { kind: 'my-office', modulo: 'proyectos-oficina' }, title: 'Proyectos de mi oficina | DASI V.01' },
      { path: 'proyectos-colaboracion', component: ListDemoComponent, data: { kind: 'collaborating', modulo: 'proyectos-colaboracion' }, title: 'Donde colaboro | DASI V.01' },
      { path: 'tareas', component: ListDemoComponent, data: { kind: 'tasks', modulo: 'tareas' }, title: 'Tareas | DASI V.01' },
      { path: 'kanban', component: KanbanComponent, data: { modulo: 'kanban' }, title: 'Kanban | DASI V.01' },
{ path: 'workflow', component: WorkflowComponent, data: { modulo: 'workflow' }, title: 'Workflow | DASI V.01' },
{ path: 'actividades', component: ListDemoComponent, data: { kind: 'activities', modulo: 'actividades' }, title: 'Actividades | DASI V.01' },
      { path: 'observaciones', component: ObservationsComponent, data: { modulo: 'observaciones' }, title: 'Observaciones | DASI V.01' },
      { path: 'evidencias', component: EvidenceComponent, data: { modulo: 'evidencias' }, title: 'Evidencias | DASI V.01' },
      { path: 'reportes', component: InsightsComponent, data: { kind: 'reports', modulo: 'reportes' }, title: 'Reportes | DASI V.01' },
      { path: 'indicadores', component: InsightsComponent, data: { kind: 'indicators', modulo: 'indicadores' }, title: 'Indicadores | DASI V.01' },
{ path: 'usuarios', component: AdminDemoComponent, data: { kind: 'users', modulo: 'usuarios' }, title: 'Usuarios | DASI V.01' },
      { path: 'administracion', component: AdminDemoComponent, data: { kind: 'admin', modulo: 'administracion' }, title: 'Administración | DASI V.01' },
      { path: 'roles', component: AdminDemoComponent, data: { kind: 'roles', modulo: 'roles' }, title: 'Roles | DASI V.01' },
      { path: 'permisos', component: AdminDemoComponent, data: { kind: 'permissions', modulo: 'permisos' }, title: 'Permisos | DASI V.01' },
{ path: 'modulos', component: AdminDemoComponent, data: { kind: 'modules', modulo: 'modulos' }, title: 'Módulos | DASI V.01' },
      { path: 'dependencias', component: AdminDemoComponent, data: { kind: 'dependencias', modulo: 'dependencias' }, title: 'Dependencias | DASI V.01' },
      { path: 'cargos', component: AdminDemoComponent, data: { kind: 'cargos', modulo: 'cargos' }, title: 'Cargos | DASI V.01' },
      { path: 'configuracion', component: AdminDemoComponent, data: { kind: 'settings', modulo: 'configuracion' }, title: 'Configuración | DASI V.01' },
{ path: 'auditoria', component: AuditComponent, data: { modulo: 'auditoria' }, title: 'Auditoría | DASI V.01' },
      { path: 'ayuda', component: InstitucionalComponent, data: { kind: 'ayuda' }, title: 'Ayuda | DASI V.01' },
      { path: 'acerca', component: InstitucionalComponent, data: { kind: 'acerca' }, title: 'Acerca de DASI | DASI V.01' },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Ingreso | DASI V.01'
  },
  {
    path:'acceso-no-autorizado',
    component:AccessDeniedComponent,
    title:'Acceso no autorizado | DASI V.01'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
