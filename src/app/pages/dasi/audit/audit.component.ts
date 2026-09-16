import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { DasiDetailModalComponent } from '../../../shared/components/dasi/detail-modal/detail-modal.component';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';
import { AuditoriaApiService } from '../../../core/services/auditoria-api.service';
import { Auditoria, AuditoriaQuery } from '../../../core/models/auditoria.model';

@Component({
  selector: 'app-dasi-audit',
  imports: [FormsModule, BadgeComponent, DasiDetailModalComponent, DasiModuleHeaderComponent],
  templateUrl: './audit.component.html',
})
export class AuditComponent implements OnInit, OnDestroy {
  searchQuery = '';
  moduleFilter = 'Todos';
  actionFilter = 'Todos';
  selected: Auditoria | null = null;
  auditorias: Auditoria[] = [];
  total = 0;
  loading = true;

  private sub?: Subscription;

  constructor(private readonly auditoriaApi: AuditoriaApiService) {}

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get modules(): string[] {
    return ['Todos', ...new Set(this.auditorias.map((e) => e.modulo).filter(Boolean))];
  }

  get actions(): string[] {
    return ['Todos', ...new Set(this.auditorias.map((e) => e.accion).filter(Boolean))];
  }

  get filtered(): Auditoria[] {
    if (this.actionFilter === 'Todos') {
      return this.auditorias;
    }
    return this.auditorias.filter((e) => e.accion === this.actionFilter);
  }

  hasFilters(): boolean {
    return this.searchQuery.trim() !== '' || this.moduleFilter !== 'Todos' || this.actionFilter !== 'Todos';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.moduleFilter = 'Todos';
    this.actionFilter = 'Todos';
    this.cargar();
  }

  cargar(): void {
    const query: AuditoriaQuery = { limit: 100 };
    if (this.searchQuery.trim()) {
      query.search = this.searchQuery.trim();
    }
    if (this.moduleFilter !== 'Todos') {
      query.modulo = this.moduleFilter;
    }
    this.sub?.unsubscribe();
    this.sub = this.auditoriaApi.findAll(query).subscribe({
      next: (res) => {
        this.auditorias = res.data;
        this.total = res.meta.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.auditorias = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  userLabel(a: Auditoria): string {
    return a.usuario?.nombre ?? 'Sistema';
  }

  userInitials(a: Auditoria): string {
    if (a.usuario?.initials) {
      return a.usuario.initials;
    }
    if (a.usuario?.nombre) {
      return a.usuario.nombre
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return 'DASI';
  }

  fmt(value: string): string {
    const d = new Date(value);
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
}