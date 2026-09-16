import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { SessionService } from '../../../core/services/session.service';
import { Usuario } from '../../../core/models/usuario.model';
import { ApiError } from '../../../core/services/api.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, RouterModule, AuthPageLayoutComponent],
  templateUrl: './sign-in.component.html',
})
export class SignInComponent implements OnInit {
  private readonly usuariosApi = inject(UsuariosApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly chooserOpen = signal(false);
  readonly usuarios = signal<Usuario[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly signingIn = signal(false);

  ngOnInit(): void {
    if (this.session.isLoggedIn) {
      this.router.navigate(['/']);
      return;
    }
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    this.loading.set(true);
    this.error.set('');
    this.usuariosApi.findAll({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.usuarios.set(res.data);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  rolLabel(u: Usuario): string {
    return u.usuario_roles?.[0]?.rol?.nombre ?? 'Sin rol';
  }

  toggleChooser(): void {
    this.chooserOpen.update((open) => !open);
    if (this.chooserOpen() && this.usuarios().length === 0 && !this.loading()) {
      this.loadUsuarios();
    }
  }

  selectAccount(account: string): void {
    if (this.signingIn()) return;
    this.signingIn.set(true);
    this.error.set('');
    this.session.signIn(account).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.signingIn.set(false);
      },
    });
  }
}