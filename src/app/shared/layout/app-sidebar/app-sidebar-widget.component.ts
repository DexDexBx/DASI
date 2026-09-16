import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-sidebar-widget',
  imports: [RouterModule],
  template: `
    <div
      class="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]"
    >
      <h3 class="mb-2 font-semibold text-gray-900 dark:text-white">
        DASI V.01
      </h3>
      @if (session.isLoggedIn) {
        <p class="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
          Sesión de {{ session.sesion?.user.nombre }} ·
          {{ session.sesion?.roles?.[0]?.nombre ?? 'Sin rol' }}
        </p>
        <a
          routerLink="/profile"
          class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
        >
          Mi perfil
        </a>
      } @else {
        <p class="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
          Inicia sesión para acceder a DASI.
        </p>
        <a
          routerLink="/signin"
          class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
        >
          Iniciar sesión
        </a>
      }
    </div>
  `,
})
export class SidebarWidgetComponent {
  readonly session = inject(SessionService);
}