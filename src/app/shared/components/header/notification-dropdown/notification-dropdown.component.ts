import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { NotificacionesApiService } from '../../../../core/services/notificaciones-api.service';
import { SessionService } from '../../../../core/services/session.service';
import { VencimientosService, Vencimiento } from '../../../../core/services/vencimientos.service';
import { Notificacion } from '../../../../core/models/notificacion.model';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent],
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notificaciones: Notificacion[] = [];
  proximos: Vencimiento[] = [];
  unread = 0;
  private readonly notifs = inject(NotificacionesApiService);
  private readonly session = inject(SessionService);
  private readonly vencimientos = inject(VencimientosService);
  private readonly router = inject(Router);
  private sub?: Subscription;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.cargar();
    this.timer = setInterval(() => this.cargar(), 30000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
  }

  private cargar(): void {
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId) {
      return;
    }
    this.sub?.unsubscribe();
    this.sub = forkJoin({
      alertas: this.notifs.findAll({ usuario_id: usuarioId, limit: 20 }),
      vencimientos: this.vencimientos.proximos(usuarioId, 7),
    }).subscribe({
      next: ({ alertas, vencimientos }) => {
        this.notificaciones = alertas.data;
        this.unread = alertas.meta.noLeidas ?? alertas.data.filter((n) => !n.leida).length;
        this.proximos = vencimientos;
      },
      error: () => {
        if (!this.isOpen) {
          this.notificaciones = [];
          this.unread = 0;
          this.proximos = [];
        }
      },
    });
  }

  irAlCalendario(): void {
    this.closeDropdown();
    this.router.navigate(['/calendar']);
  }

  dotClassFor(v: Vencimiento): string {
    if (v.dias < 2) {
      return 'bg-error-500';
    }
    return v.prioridad === 'Alta'
      ? 'bg-error-500'
      : v.prioridad === 'Media'
        ? 'bg-orange-500'
        : 'bg-success-500';
  }

  badgeClassFor(v: Vencimiento): string {
    if (v.dias < 2) {
      return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400';
    }
    return v.prioridad === 'Alta'
      ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400'
      : v.prioridad === 'Media'
        ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400'
        : 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400';
  }

  diasLabelFor(v: Vencimiento): string {
    if (v.dias <= 0) {
      return v.dias === 0 ? 'Hoy' : `Vencido ${-v.dias}d`;
    }
    return `En ${v.dias}d`;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.cargar();
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  initials(n: Notificacion): string {
    const source = n.titulo || n.proyecto?.code || 'DASI';
    return source
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'D';
  }

  fecha(n: Notificacion): string {
    const d = new Date(n.created_at);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  read(id: string) {
    this.notifs.marcarLeida(id, true).subscribe({
      next: () => {
        const n = this.notificaciones.find((x) => x.id === id);
        if (n) {
          n.leida = true;
        }
        this.unread = Math.max(0, this.unread - 1);
      },
      error: () => undefined,
    });
    this.closeDropdown();
  }

  marcarTodasLeidas() {
    const usuarioId = this.session.sesion?.user.id;
    if (!usuarioId) {
      return;
    }
    this.notifs.marcarTodasLeidas(usuarioId).subscribe({
      next: () => {
        this.notificaciones.forEach((n) => (n.leida = true));
        this.unread = 0;
      },
      error: () => undefined,
    });
    this.closeDropdown();
  }
}