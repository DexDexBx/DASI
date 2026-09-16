import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { SessionService } from '../../../core/services/session.service';
import { combineLatest, Subscription } from 'rxjs';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const MODULE_BY_PATH: Record<string, string> = {
  '/': 'dashboard',
  '/proyectos': 'proyectos',
  '/mis-proyectos': 'mis-proyectos',
  '/proyectos-oficina': 'proyectos-oficina',
  '/proyectos-colaboracion': 'proyectos-colaboracion',
  '/tareas': 'tareas',
  '/kanban': 'kanban',
  '/workflow': 'workflow',
  '/actividades': 'actividades',
  '/observaciones': 'observaciones',
  '/evidencias': 'evidencias',
  '/calendar': 'calendar',
  '/reportes': 'reportes',
  '/indicadores': 'indicadores',
  '/usuarios': 'usuarios',
  '/administracion': 'administracion',
  '/roles': 'roles',
  '/permisos': 'permisos',
  '/modulos': 'modulos',
  '/dependencias': 'dependencias',
  '/cargos': 'cargos',
  '/configuracion': 'configuracion',
  '/auditoria': 'auditoria',
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
    SidebarWidgetComponent
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 13h8V3H3v10ZM13 21h8V11h-8v10ZM13 3v6h8V3h-8ZM3 21h8v-6H3v6Z"
          fill="currentColor"
        />
      </svg>
    `,
  },

  {
    name: 'Gestión',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    `,
    subItems: [
      { name: 'Proyectos', path: '/proyectos' },
      { name: 'Mis proyectos', path: '/mis-proyectos' },
      { name: 'Proyectos de mi oficina', path: '/proyectos-oficina' },
      { name: 'Donde colaboro', path: '/proyectos-colaboracion' },
      { name: 'Tareas', path: '/tareas' },
      { name: 'Kanban', path: '/kanban' },
    ],
  },

  {
    name: 'Seguimiento',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 3v18M5 8h14M5 16h14"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="12" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    subItems: [
      { name: 'Workflow', path: '/workflow' },
      { name: 'Actividades', path: '/actividades' },
      { name: 'Observaciones', path: '/observaciones' },
      { name: 'Evidencias', path: '/evidencias' },
      { name: 'Calendario', path: '/calendar' },
    ],
  },

  {
    name: 'Información',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    `,
    subItems: [
      { name: 'Reportes', path: '/reportes' },
      { name: 'Indicadores', path: '/indicadores' },
    ],
  },
];

othersItems: NavItem[] = [
  {
    name: 'Administración',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M19 12a7.1 7.1 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-2.1-1.2L14 3h-4l-.4 2.7a7.7 7.7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7.1 7.1 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1c.6.5 1.3.9 2.1 1.2L10 21h4l.4-2.7c.8-.3 1.5-.7 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    `,
    subItems: [
      { name: 'Panel', path: '/administracion' },
      { name: 'Usuarios', path: '/usuarios' },
      { name: 'Roles', path: '/roles' },
      { name: 'Permisos', path: '/permisos' },
      { name: 'Módulos', path: '/modulos' },
      { name: 'Dependencias', path: '/dependencias' },
      { name: 'Cargos', path: '/cargos' },
      { name: 'Configuración', path: '/configuracion' },
    ],
  },

  {
    name: 'Auditoría',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 3 5 6v5c0 4.5 2.9 8.3 7 10 4.1-1.7 7-5.5 7-10V6l-7-3Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <path
          d="M9 12h6M12 9v6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    `,
    subItems: [
      { name: 'Registro y trazabilidad', path: '/auditoria' },
    ],
  },

  {
    name: 'Institucional',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M10 10h.01M14 10h.01"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `,
    subItems: [
      { name: 'Mi perfil', path: '/profile' },
      { name: 'Mi actividad', path: '/calendar' },
      { name: 'Ayuda', path: '/ayuda' },
      { name: 'Acerca de DASI', path: '/acerca' },
    ],
  },
];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private session: SessionService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  get menuVisible(): NavItem[] {
    return this.filterItems(this.navItems);
  }

  get othersVisible(): NavItem[] {
    return this.filterItems(this.othersItems);
  }

  private filterItems(items: NavItem[]): NavItem[] {
    return items
      .map((nav) => {
        if (!nav.subItems) {
          const mod = nav.path ? MODULE_BY_PATH[nav.path] : undefined;
          return mod && !this.session.can(mod, 'Ver') ? null : nav;
        }
        const subs = nav.subItems.filter((s) => {
          const mod = MODULE_BY_PATH[s.path];
          return !mod || this.session.can(mod, 'Ver');
        });
        return subs.length ? { ...nav, subItems: subs } : null;
      })
      .filter((n): n is NavItem => n !== null);
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Initial load
    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); // Ensure UI updates
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }  

  
}
